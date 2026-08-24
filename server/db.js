require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

// Initialize libSQL client
// If TURSO_DATABASE_URL is not provided, fallback to local sqlite file (or memory if on Vercel)
const isVercel = process.env.VERCEL === '1';
const url = process.env.TURSO_DATABASE_URL || (isVercel ? 'file::memory:' : `file:${path.join(__dirname, '..', 'data', 'automail.db')}`);
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Ensure data directory exists for local fallback
if (url.startsWith('file:') && url !== 'file::memory:') {
  const dataDir = path.join(__dirname, '..', 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('⚠️ Could not create data directory (likely read-only environment like Vercel).');
    console.warn('⚠️ You MUST set TURSO_DATABASE_URL in your Vercel Environment Variables!');
  }
}

const db = createClient({
  url,
  authToken,
});

// Setup database tables
async function setupDatabase() {
  try {
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_body TEXT DEFAULT '',
        text_body TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        sender_name TEXT,
        sender_email TEXT
      );

      CREATE TABLE IF NOT EXISTS send_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        contact_email TEXT NOT NULL,
        contact_name TEXT DEFAULT '',
        status TEXT DEFAULT 'queued',
        error TEXT DEFAULT '',
        sent_at DATETIME,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        total_sent INTEGER DEFAULT 0,
        total_failed INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Turso / libSQL Database initialized');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  }
}

setupDatabase();

module.exports = db;
