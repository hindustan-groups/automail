const express = require('express');
const db = require('../db');
const { processCampaignQueue, stopSending, getSendingStatus } = require('../services/emailSender');

const router = express.Router();

// POST /api/send/:campaignId — Start sending a campaign
router.post('/:campaignId', async (req, res) => {
    const { campaignId } = req.params;
    try {
        const campaignResult = await db.execute({
            sql: 'SELECT * FROM campaigns WHERE id = ?',
            args: [campaignId]
        });
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        const campaign = campaignResult.rows[0];

        if (campaign.status === 'sending') {
            return res.status(400).json({ error: 'Campaign is already being sent' });
        }

        const { isSending } = getSendingStatus();
        if (isSending) {
            return res.status(400).json({ error: 'Another campaign is currently being sent. Please wait.' });
        }

        // Get all contacts
        const { contactIds } = req.body;
        let contacts = [];
        if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
            const placeholders = contactIds.map(() => '?').join(',');
            const contactsResult = await db.execute({
                sql: `SELECT * FROM contacts WHERE id IN (${placeholders})`,
                args: contactIds
            });
            contacts = contactsResult.rows;
        } else {
            const contactsResult = await db.execute('SELECT * FROM contacts');
            contacts = contactsResult.rows;
        }
        
        if (contacts.length === 0) {
            return res.status(400).json({ error: 'No contacts selected or found to send to.' });
        }
        
        // Clear previous send logs for this campaign (if re-sending)
        await db.execute({
            sql: 'DELETE FROM send_log WHERE campaign_id = ?',
            args: [campaignId]
        });

        // Create send_log entries for each contact
        const stmts = contacts.map(contact => ({
            sql: 'INSERT INTO send_log (campaign_id, contact_email, contact_name, status) VALUES (?, ?, ?, ?)',
            args: [campaignId, contact.email, contact.name, 'queued']
        }));
        
        // Batch insert
        const chunkSize = 100;
        for (let i = 0; i < stmts.length; i += chunkSize) {
            const chunk = stmts.slice(i, i + chunkSize);
            await db.batch(chunk, "write");
        }

        // Update campaign total
        await db.execute({
            sql: 'UPDATE campaigns SET total_recipients = ?, sent_count = 0, failed_count = 0, status = ? WHERE id = ?',
            args: [contacts.length, 'queued', campaignId]
        });

        // Start sending in background (don't await)
        processCampaignQueue(parseInt(campaignId)).catch((err) => {
            console.error('Campaign sending error:', err.message);
        });

        res.json({
            message: `Campaign "${campaign.name}" queued for sending to ${contacts.length} contacts`,
            totalRecipients: contacts.length,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
