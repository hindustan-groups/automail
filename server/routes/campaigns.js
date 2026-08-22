const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
    const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    res.json(campaigns);
});

router.get('/:id', (req, res) => {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id)
    if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);

})


// POST /api/campaigns — Create new campaign
router.post('/', (req, res) => {
    const { name, subject, html_body, text_body } = req.body;
    if (!name || !subject) {
        return res.status(400).json({ error: 'Name and subject are required' });
    }
    const result = db.prepare(
        'INSERT INTO campaigns (name, subject, html_body, text_body) VALUES (?, ?, ?, ?)'
    ).run(name, subject, html_body || '', text_body || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Campaign created' });
});
// PUT /api/campaigns/:id — Update campaign
router.put('/:id', (req, res) => {
    const { name, subject, html_body, text_body } = req.body;
    const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!existing) {
        return res.status(404).json({ error: 'Campaign not found' });
    }
    if (existing.status === 'sending') {
        return res.status(400).json({ error: 'Cannot edit a campaign that is currently sending' });
    }
    db.prepare(
        'UPDATE campaigns SET name = ?, subject = ?, html_body = ?, text_body = ?, status = ? WHERE id = ?'
    ).run(
        name || existing.name,
        subject || existing.subject,
        html_body !== undefined ? html_body : existing.html_body,
        text_body !== undefined ? text_body : existing.text_body,
        'draft',
        req.params.id
    );
    res.json({ message: 'Campaign updated' });
});
// DELETE /api/campaigns/:id — Delete campaign
router.delete('/:id', (req, res) => {
    // Delete related send logs first
    db.prepare('DELETE FROM send_log WHERE campaign_id = ?').run(req.params.id);
    const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted' });
});
module.exports = router;
