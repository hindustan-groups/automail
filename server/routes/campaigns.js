const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM campaigns ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM campaigns WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/campaigns — Create new campaign
router.post('/', async (req, res) => {
    const { name, subject, html_body, text_body, sender_name, sender_email } = req.body;
    if (!name || !subject) {
        return res.status(400).json({ error: 'Name and subject are required' });
    }
    try {
        const result = await db.execute({
            sql: 'INSERT INTO campaigns (name, subject, html_body, text_body, sender_name, sender_email) VALUES (?, ?, ?, ?, ?, ?)',
            args: [name, subject, html_body || '', text_body || '', sender_name || null, sender_email || null]
        });
        res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Campaign created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/campaigns/:id — Update campaign
router.put('/:id', async (req, res) => {
    const { name, subject, html_body, text_body, sender_name, sender_email } = req.body;
    try {
        const existingResult = await db.execute({
            sql: 'SELECT * FROM campaigns WHERE id = ?',
            args: [req.params.id]
        });
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const existing = existingResult.rows[0];
        if (existing.status === 'sending') {
            return res.status(400).json({ error: 'Cannot edit a campaign that is currently sending' });
        }
        await db.execute({
            sql: 'UPDATE campaigns SET name = ?, subject = ?, html_body = ?, text_body = ?, sender_name = ?, sender_email = ?, status = ? WHERE id = ?',
            args: [
                name || existing.name,
                subject || existing.subject,
                html_body !== undefined ? html_body : existing.html_body,
                text_body !== undefined ? text_body : existing.text_body,
                sender_name !== undefined ? sender_name : existing.sender_name,
                sender_email !== undefined ? sender_email : existing.sender_email,
                'draft',
                req.params.id
            ]
        });
        res.json({ message: 'Campaign updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/campaigns/:id — Delete campaign
router.delete('/:id', async (req, res) => {
    try {
        // Delete related send logs first
        await db.execute({
            sql: 'DELETE FROM send_log WHERE campaign_id = ?',
            args: [req.params.id]
        });
        const result = await db.execute({
            sql: 'DELETE FROM campaigns WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json({ message: 'Campaign deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
