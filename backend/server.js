require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// --- Mailer Setup ---
let transporter;
nodemailer.createTestAccount().then(testAccount => {
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('Ethereal Email Transporter Ready!');
}).catch(console.error);

// --- Cron Job ---
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily cron job for follow-ups...');
  sendFollowUpEmails();
});

app.post('/api/trigger-cron', (req, res) => {
  sendFollowUpEmails();
  res.json({ message: "Cron triggered manually" });
});

async function sendFollowUpEmails() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { rows } = await db.execute({ sql: 'SELECT * FROM deals WHERE followUpDate = ?', args: [today] });
    if (rows.length === 0) return console.log('No follow-ups due today.');

    let dealListHTML = rows.map(d => `<li><strong>${d.clientName}</strong>: Status: ${d.stage} (Assigned to: ${d.assignedTo || 'Unassigned'})</li>`).join('');

    const { rows: users } = await db.execute('SELECT email FROM users');
    const toEmails = users.map(u => u.email).join(', ');

    const mailOptions = {
      from: '"Enterprise Dashboard" <no-reply@enterprise.local>',
      to: toEmails,
      subject: `Action Required: ${rows.length} Follow-up(s) Due Today`,
      html: `
          <h2>Daily Follow-up Report</h2>
          <p>The following deals require your attention today:</p>
          <ul>${dealListHTML}</ul>
          <p>Please log in to the Enterprise Sync Dashboard to update their status.</p>
        `
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log('Follow-up Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('Cron DB Error:', err);
  }
}

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
  const { email } = req.body;
  try {
    const { rows } = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    const user = rows[0];

    if (user) {
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, role: user.role, email: user.email, name: user.name });
    } else {
      res.status(401).json({ error: 'Email not found in the system. Please verify your address.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. Please log in.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// --- Profile Routes ---
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.execute({ sql: 'SELECT id, name, email, role FROM users WHERE id = ?', args: [req.user.id] });
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (password && password.trim() !== '') {
      await db.execute({ sql: 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', args: [name, email, password, req.user.id] });
      res.json({ message: 'Profile updated with new password' });
    } else {
      await db.execute({ sql: 'UPDATE users SET name = ?, email = ? WHERE id = ?', args: [name, email, req.user.id] });
      res.json({ message: 'Profile updated successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Deal Routes ---
app.get('/api/deals', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.execute("SELECT * FROM deals WHERE status = 'active' ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deals/closed', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.execute("SELECT * FROM deals WHERE status = 'closed' ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deals', authenticateToken, async (req, res) => {
  const { clientName, accountOwner, stage, assignedTo, blocker, followUpDate, notes } = req.body;
  const lastUpdate = new Date().toISOString().split('T')[0];
  try {
    const result = await db.execute({
      sql: `INSERT INTO deals (clientName, accountOwner, stage, lastUpdate, assignedTo, blocker, followUpDate, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [clientName, accountOwner, stage, lastUpdate, assignedTo, blocker, followUpDate, notes]
    });
    res.json({ id: result.lastInsertRowid ? result.lastInsertRowid.toString() : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deals/:id', authenticateToken, async (req, res) => {
  const { stage, assignedTo, blocker, followUpDate, notes } = req.body;
  const lastUpdate = new Date().toISOString().split('T')[0];
  try {
    const result = await db.execute({
      sql: `UPDATE deals SET stage = ?, lastUpdate = ?, assignedTo = ?, blocker = ?, followUpDate = ?, notes = ? WHERE id = ?`,
      args: [stage, lastUpdate, assignedTo, blocker, followUpDate, notes, req.params.id]
    });
    res.json({ message: "Deal updated successfully", changes: result.rowsAffected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/deals/:id/close', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({
      sql: "UPDATE deals SET status = 'closed', lastUpdate = ? WHERE id = ?",
      args: [new Date().toISOString().split('T')[0], req.params.id]
    });
    res.json({ message: "Deal closed successfully", changes: result.rowsAffected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/deals/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.execute({ sql: 'DELETE FROM deals WHERE id = ?', args: [req.params.id] });
    res.json({ message: "Deal deleted successfully", changes: result.rowsAffected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/metrics', authenticateToken, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const twoDaysAgoDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  try {
    const { rows } = await db.execute("SELECT * FROM deals WHERE status = 'active'");

    let metrics = {
      followupsToday: 0,
      overdue: 0,
      blocked: 0,
      awaitingManager: 0,
      totalActive: rows.length,
      alerts: []
    };

    rows.forEach(deal => {
      if (deal.followUpDate === today) {
        metrics.followupsToday++;
        metrics.alerts.push({ dealId: deal.id, client: deal.clientName, type: 'followup_today', message: 'Follow-up due today' });
      } else if (deal.followUpDate && deal.followUpDate < today) {
        metrics.overdue++;
        metrics.alerts.push({ dealId: deal.id, client: deal.clientName, type: 'overdue', message: 'Follow-up is overdue' });
      }

      if (deal.blocker && deal.blocker.trim() !== '') {
        metrics.blocked++;
        metrics.alerts.push({ dealId: deal.id, client: deal.clientName, type: 'blocked', message: `Blocked: ${deal.blocker}` });
      }

      if (deal.assignedTo && deal.assignedTo.toLowerCase() === 'manager') {
        metrics.awaitingManager++;
      }

      if (deal.lastUpdate && deal.lastUpdate <= twoDaysAgoDate) {
        metrics.alerts.push({ dealId: deal.id, client: deal.clientName, type: 'stale', message: 'No update in over 2 days' });
      }
    });

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
