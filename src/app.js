/**
 * DevSecOps Demo App — Task Manager API (FIXED VERSION)
 *
 * ✅  All vulnerabilities from app.js have been resolved.
 * This is what the code looks like AFTER the security team reviews findings.
 *
 * Fixes applied:
 *   1. AWS keys + passwords removed  → moved to environment variables
 *   2. SQL Injection fixed           → parameterised query pattern used
 *   3. XSS fixed                     → output escaped before rendering
 *   4. Command Injection fixed       → shell exec removed, safe alternative used
 *   5. Weak crypto fixed             → bcrypt used instead of MD5
 */

const express = require('express');
const bcrypt  = require('bcryptjs');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────
// ✅  FIX 1: No hardcoded credentials — use environment variables
// Set these in GitHub Secrets / your deployment environment
// ─────────────────────────────────────────────────────────
const DB_PASSWORD_HASH = process.env.DB_PASSWORD_HASH;  // pre-hashed with bcrypt
const AWS_KEY          = process.env.AWS_ACCESS_KEY_ID; // injected at runtime

if (!DB_PASSWORD_HASH) {
  console.warn('WARNING: DB_PASSWORD_HASH not set — login will be disabled');
}

// In-memory task store
const tasks = [
  { id: 1, title: 'Buy groceries',    done: false },
  { id: 2, title: 'Write unit tests', done: false },
  { id: 3, title: 'Fix the bug',      done: true  },
];

// ─────────────────────────────────────────────────────────
// GET /tasks — list all tasks
// ─────────────────────────────────────────────────────────
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// ─────────────────────────────────────────────────────────
// GET /tasks/:id — get one task
// ✅  FIX 2: SQL Injection resolved
// Use parameterised queries — never concatenate user input into queries.
// For a real DB (e.g. postgres), use: db.query('SELECT * FROM tasks WHERE id = $1', [id])
// ─────────────────────────────────────────────────────────
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  // ✅ GOOD — validate input type first, then use it safely
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID — must be a number' });
  }

  // For real DB: const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// ─────────────────────────────────────────────────────────
// POST /tasks — create a task
// ─────────────────────────────────────────────────────────
app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }
  // Sanitise length
  const safeTitle = title.trim().substring(0, 200);
  const newTask = { id: tasks.length + 1, title: safeTitle, done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// ─────────────────────────────────────────────────────────
// ✅  FIX 3: XSS resolved — escape output before rendering HTML
// ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

app.get('/render/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id, 10));
  if (!task) return res.status(404).send('Not found');

  // ✅ GOOD — escape all user-controlled data before injecting into HTML
  const safeTitle = escapeHtml(task.title);
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
      </head>
      <body>
        <h1>Task Details</h1>
        <div id="task-title">${safeTitle}</div>
      </body>
    </html>
  `;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.send(html);
});

// ─────────────────────────────────────────────────────────
// ✅  FIX 4: Command Injection resolved — removed shell exec entirely
// Use Node.js built-in DNS lookup instead of shelling out to ping
// ─────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  const dns  = require('dns');
  const host = req.query.host;

  if (!host || !/^[a-zA-Z0-9.\-]+$/.test(host)) {
    return res.status(400).json({ error: 'Invalid hostname' });
  }

  // ✅ GOOD — use a safe API instead of shell command
  dns.lookup(host, (err, address) => {
    if (err) return res.status(400).json({ error: 'Host not found' });
    res.json({ host, address, reachable: true });
  });
});

// ─────────────────────────────────────────────────────────
// ✅  FIX 5: Weak crypto resolved — use bcrypt for password hashing
// bcrypt is slow by design — makes brute-force attacks impractical
// ─────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (!DB_PASSWORD_HASH) {
    return res.status(503).json({ error: 'Authentication not configured' });
  }

  try {
    // ✅ GOOD — bcrypt compare does constant-time comparison (prevents timing attacks)
    const match = await bcrypt.compare(password, DB_PASSWORD_HASH);
    if (username === 'admin' && match) {
      // In production: generate a proper JWT with short expiry
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0-secure' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Secure Task Manager running on port ${PORT}`);
});

module.exports = app;
