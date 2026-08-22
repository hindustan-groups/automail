const express = require('express');
const db = require('../db');
const { getTodaySentCount } = require('../services/emailSender');

const router = express.Router();

// GET /api/stats/dashboard — Overview stats
router.get('/dashboard', (req, res) => {
  const totalContacts = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  const totalCampaigns = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
  const totalSent = db.prepare("SELECT COUNT(*) as count FROM send_log WHERE status = 'sent'").get().count;
  const totalFailed = db.prepare("SELECT COUNT(*) as count FROM send_log WHERE status = 'failed'").get().count;
  const sentToday = getTodaySentCount();
  const dailyLimit = parseInt(process.env.DAILY_LIMIT) || 200;

  // Recent activity (last 7 days)
  const recentStats = db.prepare(
    'SELECT date, total_sent, total_failed FROM daily_stats ORDER BY date DESC LIMIT 7'
  ).all();

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
});

// GET /api/stats/campaign/:id — Campaign delivery report
router.get('/campaign/:id', (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const logs = db.prepare(
    'SELECT * FROM send_log WHERE campaign_id = ? ORDER BY id ASC'
  ).all(req.params.id);

  const queued = logs.filter((l) => l.status === 'queued').length;
  const sent = logs.filter((l) => l.status === 'sent').length;
  const failed = logs.filter((l) => l.status === 'failed').length;

  res.json({
    campaign,
    summary: { queued, sent, failed, total: logs.length },
    logs,
  });
});

module.exports = router;
