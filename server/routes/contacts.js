const express = require('express');
const multer = require('multer');
const db = require('../db');
const { parseCSV } = require('../services/csvParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/contacts — List all contacts
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let contacts, total;

  try {
    if (search) {
      const contactsResult = await db.execute({
        sql: 'SELECT * FROM contacts WHERE email LIKE ? OR name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [`%${search}%`, `%${search}%`, limit, offset]
      });
      contacts = contactsResult.rows;

      const totalResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM contacts WHERE email LIKE ? OR name LIKE ?',
        args: [`%${search}%`, `%${search}%`]
      });
      total = Number(totalResult.rows[0].count);
    } else {
      const contactsResult = await db.execute({
        sql: 'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [limit, offset]
      });
      contacts = contactsResult.rows;

      const totalResult = await db.execute('SELECT COUNT(*) as count FROM contacts');
      total = Number(totalResult.rows[0].count);
    }

    res.json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts — Add single contact
router.post('/', async (req, res) => {
  const { email, name, tags } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await db.execute({
      sql: 'INSERT INTO contacts (email, name, tags) VALUES (?, ?, ?)',
      args: [email.toLowerCase().trim(), name || '', tags || '']
    });

    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Contact added' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Contact already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/import — Import CSV
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const { contacts, errors, totalParsed } = parseCSV(req.file.buffer,req.file.originalname);

  try {
    // batch is the libSQL equivalent of transaction
    const stmts = contacts.map(c => ({
      sql: 'INSERT OR IGNORE INTO contacts (email, name) VALUES (?, ?)',
      args: [c.email, c.name]
    }));
    
    // Process in chunks to avoid hitting limits
    const chunkSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < stmts.length; i += chunkSize) {
      const chunk = stmts.slice(i, i + chunkSize);
      const results = await db.batch(chunk, "write");
      inserted += results.reduce((acc, r) => acc + r.rowsAffected, 0);
    }

    res.json({
      message: `Imported ${inserted} contacts`,
      totalParsed,
      validEmails: contacts.length,
      inserted,
      duplicatesSkipped: contacts.length - inserted,
      errors,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id — Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [req.params.id]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts — Delete all contacts
router.delete('/', async (req, res) => {
  try {
    await db.execute('DELETE FROM contacts');
    res.json({ message: 'All contacts deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
