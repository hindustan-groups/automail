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
async function sendOneEmail(to, subject, htmlBody, textBody, customSenderEmail, customSenderName) {
  const senderEmail = customSenderEmail || process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = customSenderName || process.env.SENDER_NAME || 'Automail';

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
async function getTodaySentCount() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const result = await db.execute({
      sql: 'SELECT total_sent FROM daily_stats WHERE date = ?',
      args: [today]
    });
    return result.rows.length > 0 ? Number(result.rows[0].total_sent) : 0;
  } catch (err) {
    console.error('Failed to get today sent count:', err);
    return 0;
  }
}

/**
 * Increment today's stats
 */
async function incrementDailyStats(success) {
  const today = new Date().toISOString().split('T')[0];
  try {
    const existingResult = await db.execute({
      sql: 'SELECT * FROM daily_stats WHERE date = ?',
      args: [today]
    });
    
    if (existingResult.rows.length > 0) {
      if (success) {
        await db.execute({
          sql: 'UPDATE daily_stats SET total_sent = total_sent + 1 WHERE date = ?',
          args: [today]
        });
      } else {
        await db.execute({
          sql: 'UPDATE daily_stats SET total_failed = total_failed + 1 WHERE date = ?',
          args: [today]
        });
      }
    } else {
      await db.execute({
        sql: 'INSERT INTO daily_stats (date, total_sent, total_failed) VALUES (?, ?, ?)',
        args: [today, success ? 1 : 0, success ? 0 : 1]
      });
    }
  } catch (err) {
    console.error('Failed to increment daily stats:', err);
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

  try {
    const campaignResult = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE id = ?',
      args: [campaignId]
    });
    
    if (campaignResult.rows.length === 0) {
      isSending = false;
      throw new Error('Campaign not found');
    }
    
    const campaign = campaignResult.rows[0];

    // Update campaign status
    await db.execute({
      sql: 'UPDATE campaigns SET status = ? WHERE id = ?',
      args: ['sending', campaignId]
    });

    const queuedEmailsResult = await db.execute({
      sql: 'SELECT * FROM send_log WHERE campaign_id = ? AND status = ?',
      args: [campaignId, 'queued']
    });
    
    const queuedEmails = queuedEmailsResult.rows;

    console.log(`📧 Starting campaign "${campaign.name}" — ${queuedEmails.length} emails to send`);

    let sentCount = 0;
    let failedCount = 0;

    for (const entry of queuedEmails) {
      if (shouldStop) {
        console.log('⏹️ Campaign sending stopped by user');
        break;
      }

      // Check daily limit
      const todaySentCount = await getTodaySentCount();
      if (todaySentCount >= dailyLimit) {
        console.log(`⚠️ Daily limit of ${dailyLimit} reached. Pausing.`);
        await db.execute({
          sql: 'UPDATE campaigns SET status = ? WHERE id = ?',
          args: ['paused', campaignId]
        });
        break;
      }

      try {
        const personalizedHtml = personalizeBody(campaign.html_body, entry);
        const personalizedText = personalizeBody(campaign.text_body, entry);

        await sendOneEmail(
          entry.contact_email, 
          campaign.subject, 
          personalizedHtml, 
          personalizedText,
          campaign.sender_email,
          campaign.sender_name
        );

        // Mark as sent
        await db.execute({
          sql: 'UPDATE send_log SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: ['sent', entry.id]
        });
        await incrementDailyStats(true);
        sentCount++;

        console.log(`  ✅ Sent to ${entry.contact_email} (${sentCount}/${queuedEmails.length})`);
      } catch (err) {
        // Mark as failed
        await db.execute({
          sql: 'UPDATE send_log SET status = ?, error = ? WHERE id = ?',
          args: ['failed', err.message, entry.id]
        });
        await incrementDailyStats(false);
        failedCount++;

        console.log(`  ❌ Failed: ${entry.contact_email} — ${err.message}`);

        // If rate limited, wait longer
        if (err.message.includes('429')) {
          console.log('  ⏳ Rate limited! Waiting 60 seconds...');
          await sleep(60000);
        }
      }

      // Update campaign counts
      await db.execute({
        sql: 'UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?',
        args: [sentCount, failedCount, campaignId]
      });

      // Wait between sends
      await sleep(delayMs);
    }

    // Final status
    const finalStatus = shouldStop ? 'paused' : 'completed';
    await db.execute({
      sql: 'UPDATE campaigns SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [finalStatus, campaignId]
    });

    console.log(`📊 Campaign "${campaign.name}" ${finalStatus}: ${sentCount} sent, ${failedCount} failed`);

  } catch (err) {
    console.error('Campaign processor error:', err);
  } finally {
    isSending = false;
  }
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
