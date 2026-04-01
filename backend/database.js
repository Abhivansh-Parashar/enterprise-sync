const { createClient } = require('@libsql/client');
require('dotenv').config();

// Connect to Turso Cloud DB
// Uses environment variables first, with hardcoded fallbacks for deployment
const dbUrl = process.env.TURSO_DATABASE_URL || 'libsql://enterprise-db-abhivansh-parashar.aws-ap-south-1.turso.io';
const dbToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQzNjY1MDMsImlkIjoiMDE5ZDIwNzQtNGIwMS03MDRmLTkzZGYtMjRhNzMwZWY5ODZjIiwicmlkIjoiMWNhNTVhZjktMWFjNi00ZmI1LTlkZjYtOGFmYzQ5ZTcwYjI1In0.WWUYzYIZacFXzaq3pmo87T__buNixPN5W8oqsyIi_A3FJOhFBcFDR09JrpdBI_eDSBQESSQSfVAM_Rp8PQ1cBQ';

const db = createClient({
  url: dbUrl,
  authToken: dbToken
});

// Initialize database dynamically
let initPromise = null;

const initDB = () => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await db.execute(`
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT NOT NULL,
        accountOwner TEXT NOT NULL,
        stage TEXT NOT NULL,
        lastUpdate TEXT,
        assignedTo TEXT,
        blocker TEXT,
        followUpDate TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        phoneNumber TEXT,
        priority TEXT DEFAULT 'Medium'
      )
    `);

        // Gracefully handle migration for existing databases
        try { await db.execute("ALTER TABLE deals ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) { /* ignore if column exists */ }
        try { await db.execute("ALTER TABLE deals ADD COLUMN phoneNumber TEXT"); } catch (e) { }
        try { await db.execute("ALTER TABLE deals ADD COLUMN priority TEXT DEFAULT 'Medium'"); } catch (e) { }

        await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

        await db.execute(`
      CREATE TABLE IF NOT EXISTS email_threads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT NOT NULL,
        content TEXT NOT NULL,
        link TEXT,
        savedAt TEXT
      )
    `);

        await db.execute(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT NOT NULL,
        url TEXT NOT NULL,
        label TEXT,
        savedAt TEXT
      )
    `);

        // Seed initial users if empty
        const { rows: userRows } = await db.execute("SELECT COUNT(*) as count FROM users");
        if (userRows[0].count === 0) {
          const defaultUsers = [
            { name: 'Riya Parashar', email: 'riya.parashar@xindus.net', password: 'xindus@123', role: 'Manager' },
            { name: 'Saurabh', email: 'saurabh@xindus.net', password: 'xindus@123', role: 'Account Owner' },
            { name: 'Jaideep Singh', email: 'jaideep.singh@xindus.net', password: 'xindus@123', role: 'Account Owner' },
            { name: 'Saptarshi', email: 'saptarshi@xindus.net', password: 'xindus@123', role: 'Account Owner' }
          ];

          for (const u of defaultUsers) {
            await db.execute({
              sql: "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
              args: [u.name, u.email, u.password, u.role]
            });
          }
          console.log('Seeded users table with Xindus default credentials.');
        }


      } catch (err) {
        console.error('Error initializing database:', err.message);
        initPromise = null; // Allow retry if failure occurs
      }
    })();
  }
  return initPromise;
};

module.exports = { db, initDB };
