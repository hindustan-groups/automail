const express = require('express');
const db = require('../db');
const { getTodaySentCount } = require('../services/emailSender');

const router = express.Router();

// GET /api/stats/dashboard — Overview stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalContactsResult = await db.execute('SELECT COUNT(*) as count FROM contacts');
    const totalContacts = Number(totalContactsResult.rows[0].count);
    
    const totalCampaignsResult = await db.execute('SELECT COUNT(*) as count FROM campaigns');
    const totalCampaigns = Number(totalCampaignsResult.rows[0].count);
    
    const totalSentResult = await db.execute("SELECT COUNT(*) as count FROM send_log WHERE status = 'sent'");
    const totalSent = Number(totalSentResult.rows[0].count);
    
    const totalFailedResult = await db.execute("SELECT COUNT(*) as count FROM send_log WHERE status = 'failed'");
    const totalFailed = Number(totalFailedResult.rows[0].count);
    
    const sentToday = await getTodaySentCount();
    const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 200;

    // Recent activity (last 7 days)
    const recentStatsResult = await db.execute('SELECT date, total_sent, total_failed FROM daily_stats ORDER BY date DESC LIMIT 7');
    const recentStats = recentStatsResult.rows;

    res.json({
      totalContacts,
      totalCampaigns,
      totalSent,
      totalFailed,
      sentToday,
      dailyLimit,
      successRate: totalSent + totalFailed > 0
        ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
        : 0,
      recentStats: recentStats.reverse(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/campaign/:id — Campaign delivery report
router.get('/campaign/:id', async (req, res) => {
  try {
    const campaignResult = await db.execute({
      sql: 'SELECT * FROM campaigns WHERE id = ?',
      args: [req.params.id]
    });

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaign = campaignResult.rows[0];

    const logsResult = await db.execute({
      sql: 'SELECT * FROM send_log WHERE campaign_id = ? ORDER BY id ASC',
      args: [req.params.id]
    });
    
    const logs = logsResult.rows;

    const queued = logs.filter((l) => l.status === 'queued').length;
    const sent = logs.filter((l) => l.status === 'sent').length;
    const failed = logs.filter((l) => l.status === 'failed').length;

    res.json({
      campaign,
      summary: { queued, sent, failed, total: logs.length },
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
