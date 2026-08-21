# 🔒 DevSecOps Demo Project — Task Manager

> A deliberately vulnerable Node.js app used to showcase DevSecOps security tools.
> **Do NOT use the vulnerable code in production.**

---

## 📁 Project Structure

```
devsecops-demo/
├── src/
│   ├── app.js            ← ⚠️  VULNERABLE version (demo starting point)
│   └── app.fixed.js      ← ✅  FIXED version (demo end result)
├── docker/
│   ├── Dockerfile.vulnerable  ← ⚠️  Bad Dockerfile (demo)
│   └── Dockerfile.secure      ← ✅  Secure Dockerfile (demo)
├── terraform/
│   ├── main.tf           ← ⚠️  Misconfigured cloud (demo)
│   └── main.fixed.tf     ← ✅  Secure cloud config (demo)
├── .github/workflows/
│   ├── 01-broken-pipeline.yml         ← No security checks (old way)
│   ├── 02-security-catches-issues.yml ← Security tools finding problems
│   └── 03-secure-pipeline.yml         ← Full green secure pipeline
└── README.md             ← This file (your demo script)
```

---

## 🎭 The Demo Story (3 Acts)

### ACT 1 — "The Old Way" (5 minutes)
Show the team that a passing pipeline does not mean safe code.

### ACT 2 — "The Tools Find Everything" (10 minutes)
Show each security tool catching a real vulnerability in our app.

### ACT 3 — "The Fixed Pipeline" (5 minutes)
Show the same pipeline — all green after fixes are applied.

---

## 🚀 Setup (Do This Before the Demo)

```bash
# 1. Clone this repo
git clone https://github.com/YOUR_USERNAME/devsecops-demo.git
cd devsecops-demo

# 2. Create dev and main branches
git checkout -b dev
git push --set-upstream origin dev

# Switch to main and push
git checkout main
git push --set-upstream origin main

# 3. Switch back to dev for the demo
git checkout dev
```

---

## 🎬 ACT 1 — The Old Way (No Security Checks)

**What to say:**
> "This is how most teams ship code today.
>  The pipeline passes — but our code has 5 serious vulnerabilities.
>  We have zero visibility into any of them."

**What to do:**
```bash
# Make sure src/app.js (vulnerable version) is active
git checkout dev

# Go to GitHub → Actions → Run workflow → "Stage 1 — No Security Checks"
# Show the GREEN pipeline
# Point out: "Green means nothing without security checks"
```

**Vulnerabilities hidden in app.js:**
| Line | Vulnerability | Impact |
|------|--------------|--------|
| 17-18 | Hardcoded AWS credentials | Full AWS account takeover |
| 19 | Hardcoded DB password | Database access |
| 55 | SQL Injection | Read/delete all data |
| 80 | XSS | Steal user sessions |
| 100 | Command Injection | Run any command on server |
| 122 | MD5 password hashing | Passwords cracked instantly |

---

## 🎬 ACT 2 — Security Tools Catch Everything

**What to say:**
> "Now watch what happens when we add security tools to the same code.
>  Nothing in the app changed — only the pipeline changed.
>  Every red box is a real vulnerability that was hiding in our codebase."

**What to do:**
```bash
# Workflow 02 runs automatically on push to dev
# Or go to GitHub → Actions → "Stage 2 — Security Tools Finding Issues" → Run workflow
```

**Walk through each failing job:**

### 🔑 Job 1: Secrets Detection (Gitleaks)
**Click this job and show:**
```
leak found: rule-id: aws-access-key-id
  File: src/app.js
  Line: 17
  Secret: AKIAIOSFODNN7EXAMPLE
```
**Say:** *"Gitleaks found our AWS key in 3 seconds.
If this repo were public, bots would find this within 4 minutes."*

---

### 🔍 Job 2: SAST — Semgrep
**Click this job and show:**
```
src/app.js:55  ERROR  javascript.lang.security.audit.sqli.node-sqli-concat
  Detected string concatenation with user-controlled input into SQL query.
  This could lead to SQL injection.

src/app.js:100  ERROR  javascript.lang.security.audit.dangerous-exec-command
  Avoid using user input in exec() calls.
  This is vulnerable to command injection.
```
**Say:** *"Semgrep read our code like a security engineer would.
It found the exact line, explained the risk, and this took 12 seconds."*

---

### 📦 Job 3: SCA — npm audit
**Click this job and show:**
```
lodash  4.17.20
Severity: High
Prototype Pollution in lodash
CVE-2021-23337
Fix: upgrade to 4.17.21
```
**Say:** *"We use lodash — a very popular library. Version 4.17.20 has a
known HIGH severity vulnerability. npm audit found it instantly."*

---

### 🐳 Job 4: Container Scan — Trivy
**Click this job and show:**
```
node:14-alpine (alpine 3.16.2)
Total: 12 (CRITICAL: 3, HIGH: 9)

CRITICAL CVE-2023-xxxx — OpenSSL vulnerability in base image
CRITICAL CVE-2022-xxxx — Node.js runtime vulnerability
```
**Say:** *"Our Docker image uses node:14 — an old version.
Trivy found 3 CRITICAL CVEs before we ever deployed.
We would have shipped these to production without knowing."*

---

### ☁️ Job 5: IaC Scan — Checkov
**Click this job and show:**
```
Check: CKV_AWS_20 FAILED
  S3 bucket has ACL that allows public access
  File: terraform/main.tf, Line: 20

Check: CKV_AWS_24 FAILED
  Security group allows unrestricted access (0.0.0.0/0)
  File: terraform/main.tf, Line: 38

Check: CKV_AWS_17 FAILED
  RDS instance is not encrypted at rest
  File: terraform/main.tf, Line: 60
```
**Say:** *"Our cloud infrastructure had an open S3 bucket, SSH open to the
entire internet, and an unencrypted database — all in the Terraform file.
Checkov caught this before a single resource was created in AWS."*

---

## 🎬 ACT 3 — The Fixed Pipeline (All Green)

**What to say:**
> "Now I will apply the fixes the tools recommended.
>  Same pipeline — but now all checks pass.
>  This is what production-ready DevSecOps looks like."

**What to do:**
```bash
# Step 1: Replace vulnerable app with fixed version
cp src/app.fixed.js src/app.js

# Step 2: Use the secure Dockerfile
cp docker/Dockerfile.secure docker/Dockerfile

# Step 3: Use the fixed Terraform
cp terraform/main.fixed.tf terraform/main.tf

# Step 4: Update lodash in package.json to 4.17.21
# (Edit package.json: change "lodash": "4.17.20" to "4.17.21")

# Step 5: Commit and push to dev
git add .
git commit -m "fix: resolve all security findings from DevSecOps pipeline"
git push

# Step 6: Open Pull Request from dev → main
# GitHub Actions runs on the PR — show all jobs green
# Merge → Deploy job fires
```

---

## 💬 Management Q&A — Cheat Sheet

**Q: How long did this take to set up?**
> "The pipeline itself took one day. The tool integrations are mostly copy-paste from documentation.
>  The time investment is tiny compared to the risk we are now catching."

**Q: Does this slow down developers?**
> "Each scan adds 2-3 minutes to the pipeline. But it saves days of investigating production incidents.
>  Developers get immediate feedback in their PR — they fix it while the context is fresh."

**Q: What does this cost?**
> "All tools shown today are free and open-source.
>  The only cost is the GitHub Actions compute time — roughly ₹500/month for a small team."

**Q: What if a tool flags too many false positives?**
> "We tune the rules. Each tool allows us to suppress specific rules that do not apply to our context.
>  We start strict and relax rules that are not relevant — not the other way around."

**Q: What is the next step after this POC?**
> "Add DAST scanning against our staging environment, and enable cloud posture monitoring
>  in AWS Security Hub. That completes the full security coverage picture."

---

## 📊 Before / After (For Your Presentation Slide)

| Security Check | Before DevSecOps | After (This Demo) |
|----------------|-----------------|-------------------|
| Secrets in code | Unknown | Caught in 3 seconds |
| SQL Injection | Found in prod | Caught in PR review |
| Vulnerable dependencies | Unknown | Tracked, auto-alerted |
| Container CVEs | Unknown | Scanned every build |
| Cloud misconfigurations | Unknown | Blocked before deploy |
| Time to detect a secret leak | Days to months | Under 60 seconds |
| Cost of this protection | ₹0 baseline | Free (open-source tools) |
