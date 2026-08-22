const express = require('express');
const db = require('../db');
const { processCampaignQueue, stopSending, getSendingStatus } = require('../services/emailSender');

const router = express.Router();

// POST /api/send/:campaignId — Start sending a campaign
router.post('/:campaignId', (req, res) => {
    const { campaignId } = req.params;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);

    if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sending') {
        return res.status(400).json({ error: 'Campaign is already being sent' });
    }

    const { isSending } = getSendingStatus();
    if (isSending) {
        return res.status(400).json({ error: 'Another campaign is currently being sent. Please wait.' });
    }

    // Get all contacts
    const {contactIds} = req.body;
    let contacts = []
    if(contactIds && Array.isArray(contactIds) && contactIds.length >0 ){
        const placeholders = contactIds.map(()=> '?').join(',')
        contacts = db.prepare(`SELECT * FROM contacts WHERE id IN (${placeholders})`).all(...contactIds);
    }else{
        contacts = db.prepare('SELECT * FROM contacts').all();
    }
    if (contacts.length === 0) {
        return res.status(400).json({ error: 'No contacts selected or found to send to.' });
    }
    // Clear previous send logs for this campaign (if re-sending)
    db.prepare('DELETE FROM send_log WHERE campaign_id = ?').run(campaignId);

    // Create send_log entries for each contact
    const insertStmt = db.prepare(
        'INSERT INTO send_log (campaign_id, contact_email, contact_name, status) VALUES (?, ?, ?, ?)'
    );

    const insertAll = db.transaction((contactsList) => {
        for (const contact of contactsList) {
            insertStmt.run(campaignId, contact.email, contact.name, 'queued');
        }
    });

    insertAll(contacts);

    // Update campaign total
    db.prepare('UPDATE campaigns SET total_recipients = ?, sent_count = 0, failed_count = 0, status = ? WHERE id = ?')
        .run(contacts.length, 'queued', campaignId);

    // Start sending in background (don't await)
    processCampaignQueue(parseInt(campaignId)).catch((err) => {
        console.error('Campaign sending error:', err.message);
    });

    res.json({
        message: `Campaign "${campaign.name}" queued for sending to ${contacts.length} contacts`,
        totalRecipients: contacts.length,
    });
});

// POST /api/send/stop — Stop sending
router.post('/stop/current', (req, res) => {
    stopSending();
    res.json({ message: 'Sending stop signal sent. Current email will finish, then sending will pause.' });
});

// GET /api/send/status — Get sending status
router.get('/status/current', (req, res) => {
    const status = getSendingStatus();
    res.json(status);
});

module.exports = router;
