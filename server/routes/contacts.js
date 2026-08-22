const express = require('express');
const multer = require('multer');
const db = require('../db');
const { parseCSV } = require('../services/csvParser');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/contacts — List all contacts
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let contacts, total;

  if (search) {
    contacts = db.prepare(
      'SELECT * FROM contacts WHERE email LIKE ? OR name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(`%${search}%`, `%${search}%`, limit, offset);

    total = db.prepare(
      'SELECT COUNT(*) as count FROM contacts WHERE email LIKE ? OR name LIKE ?'
    ).get(`%${search}%`, `%${search}%`).count;
  } else {
    contacts = db.prepare(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);

    total = db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  }

  res.json({
    contacts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/contacts — Add single contact
router.post('/', (req, res) => {
  const { email, name, tags } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO contacts (email, name, tags) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), name || '', tags || '');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Contact added' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Contact already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/import — Import CSV
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const { contacts, errors, totalParsed } = parseCSV(req.file.buffer);

  const insertStmt = db.prepare(
    'INSERT OR IGNORE INTO contacts (email, name) VALUES (?, ?)'
  );

  const insertMany = db.transaction((contactsList) => {
    let inserted = 0;
    for (const c of contactsList) {
      const result = insertStmt.run(c.email, c.name);
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  const inserted = insertMany(contacts);

  res.json({
    message: `Imported ${inserted} contacts`,
    totalParsed,
    validEmails: contacts.length,
    inserted,
    duplicatesSkipped: contacts.length - inserted,
    errors,
  });
});

// DELETE /api/contacts/:id — Delete contact
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json({ message: 'Contact deleted' });
});

// DELETE /api/contacts — Delete all contacts
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM contacts').run();
  res.json({ message: 'All contacts deleted' });
});

module.exports = router;
