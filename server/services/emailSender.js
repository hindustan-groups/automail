const nodemailer = require('nodemailer');
const db = require('../db');

// Track sending state
let isSending = false;
let shouldStop = false;

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || process.env.SENDER_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.HOSTINGER_API_KEY;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send a single email via Hostinger SMTP with fallback
 */
async function sendOneEmail(to, subject, htmlBody, textBody) {
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.SENDER_NAME || 'Automail';

  // Try SMTP Transport first via nodemailer
  try {
    const mailTransporter = createTransporter();
    const info = await mailTransporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text: textBody || (htmlBody ? htmlBody.replace(/<[^>]*>/g, '') : ''),
      html: htmlBody,
    });
    return info;
  } catch (smtpErr) {
    console.error('SMTP send failed:', smtpErr.message);
    
    // Fallback to Hostinger HTTP API if configured
    const apiKey = process.env.HOSTINGER_API_KEY;
    if (!apiKey) throw smtpErr;

    try {
      const payload = {
        from: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        html: htmlBody || undefined,
        text: textBody || (htmlBody ? htmlBody.replace(/<[^>]*>/g, '') : ''),
      };

      const response = await fetch('https://api.mail.hostinger.com/v1/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`SMTP Auth Failed (${smtpErr.message})`);
      }

      return await response.json();
    } catch (httpErr) {
      throw new Error(`SMTP Error: ${smtpErr.message}`);
    }
  }
}

/**
 * Get today's send count
 */
function getTodaySentCount() {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare('SELECT total_sent FROM daily_stats WHERE date = ?').get(today);
  return row ? row.total_sent : 0;
}

/**
 * Increment today's stats
 */
function incrementDailyStats(success) {
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM daily_stats WHERE date = ?').get(today);

  if (existing) {
    if (success) {
      db.prepare('UPDATE daily_stats SET total_sent = total_sent + 1 WHERE date = ?').run(today);
    } else {
      db.prepare('UPDATE daily_stats SET total_failed = total_failed + 1 WHERE date = ?').run(today);
    }
  } else {
    db.prepare('INSERT INTO daily_stats (date, total_sent, total_failed) VALUES (?, ?, ?)').run(
      today,
      success ? 1 : 0,
      success ? 0 : 1
    );
  }
}

/**
 * Replace template variables in email body
 */
function personalizeBody(body, contact) {
  if (!body) return '';
  return body
    .replace(/\{\{name\}\}/gi, contact.contact_name || contact.name || 'there')
    .replace(/\{\{email\}\}/gi, contact.contact_email || contact.email || '');
}

/**
 * Process the send queue for a campaign
 */
async function processCampaignQueue(campaignId) {
  if (isSending) {
    throw new Error('Another campaign is already being sent');
  }

  isSending = true;
  shouldStop = false;

  const rateLimit = parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 5;
  const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 200;
  const delayMs = Math.ceil(60000 / rateLimit); // ms between each email

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) {
    isSending = false;
    throw new Error('Campaign not found');
  }

  // Update campaign status
  db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('sending', campaignId);

  const queuedEmails = db.prepare(
    'SELECT * FROM send_log WHERE campaign_id = ? AND status = ?'
  ).all(campaignId, 'queued');

  console.log(`📧 Starting campaign "${campaign.name}" — ${queuedEmails.length} emails to send`);

  let sentCount = 0;
  let failedCount = 0;

  for (const entry of queuedEmails) {
    if (shouldStop) {
      console.log('⏹️ Campaign sending stopped by user');
      break;
    }

    // Check daily limit
    if (getTodaySentCount() >= dailyLimit) {
      console.log(`⚠️ Daily limit of ${dailyLimit} reached. Pausing.`);
      db.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run('paused', campaignId);
      break;
    }

    try {
      const personalizedHtml = personalizeBody(campaign.html_body, entry);
      const personalizedText = personalizeBody(campaign.text_body, entry);

      await sendOneEmail(entry.contact_email, campaign.subject, personalizedHtml, personalizedText);

      // Mark as sent
      db.prepare('UPDATE send_log SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?').run('sent', entry.id);
      incrementDailyStats(true);
      sentCount++;

      console.log(`  ✅ Sent to ${entry.contact_email} (${sentCount}/${queuedEmails.length})`);
    } catch (err) {
      // Mark as failed
      db.prepare('UPDATE send_log SET status = ?, error = ? WHERE id = ?').run('failed', err.message, entry.id);
      incrementDailyStats(false);
      failedCount++;

      console.log(`  ❌ Failed: ${entry.contact_email} — ${err.message}`);

      // If rate limited, wait longer
      if (err.message.includes('429')) {
        console.log('  ⏳ Rate limited! Waiting 60 seconds...');
        await sleep(60000);
      }
    }

    // Update campaign counts
    db.prepare('UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?').run(
      sentCount, failedCount, campaignId
    );

    // Wait between sends
    await sleep(delayMs);
  }

  // Final status
  const finalStatus = shouldStop ? 'paused' : 'completed';
  db.prepare('UPDATE campaigns SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(finalStatus, campaignId);

  console.log(`📊 Campaign "${campaign.name}" ${finalStatus}: ${sentCount} sent, ${failedCount} failed`);

  isSending = false;
}

/**
 * Stop the current sending process
 */
function stopSending() {
  shouldStop = true;
}

/**
 * Check if currently sending
 */
function getSendingStatus() {
  return { isSending, shouldStop };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sendOneEmail,
  processCampaignQueue,
  stopSending,
  getSendingStatus,
  getTodaySentCount,
};
