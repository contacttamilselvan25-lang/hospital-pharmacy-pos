<p align="center">
  <img src="https://img.shields.io/badge/Hospital-Pharmacy%20POS-00B4D8?style=for-the-badge&logo=medkit&logoColor=white" alt="Hospital Pharmacy POS" />
  <img src="https://img.shields.io/badge/Version-1.0.0-90E0EF?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-CA6702?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Tests-118%20Passing-00B4D8?style=for-the-badge&logo=jest&logoColor=white" alt="Tests" />
</p>

<h1 align="center">🏥 Hospital Pharmacy POS & Inventory Management System</h1>

<p align="center">
  <strong>A full-stack, clinical-grade Hospital Pharmacy Point of Sale (POS) and Inventory Management System</strong><br>
  Built for pharmacy students, healthcare technology demonstrations, and hospital dispensaries.
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-demo-accounts">Demo Accounts</a> •
  <a href="#-testing">Testing</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🔐 Role-Based Access Control** | Separate **Admin (Chief Pharmacist)** and **Cashier (Counter Dispensary)** roles with granular permissions |
| **📦 Batch & FEFO Tracking** | Tracks batch numbers, manufacturing/expiry dates; enforces First-Expiry-First-Out dispensing |
| **🚫 Clinical Expiry Blocking** | Prevents dispensing expired medications at POS with real-time clinical alerts |
| **🔔 4-Tier Smart Alerts** | **Critical Stock**, **Low Stock**, **Near-Expiry (<90 days)**, **Expired Quarantine** — instant visual badges |
| **💊 POS Billing Counter** | Instant medicine search, dynamic cart, multi-payment (UPI/Cash/Card), authentic receipts |
| **🔒 ACID Transactions** | Atomic stock deduction from exact batch on sale completion — zero negative stock risk |
| **📋 Complete Audit Trail** | Immutable history of medicine creation, shipments, adjustments, and patient sales |
| **📊 Analytics & Reports** | Sales analytics, procurement reports, stock movement logs, revenue dashboards |

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite • Vanilla CSS Design System (Dark Glassmorphism) |
| **Backend** | Node.js + Express • SQLite (WAL Mode) |
| **Auth** | JWT (HS256) • bcrypt Password Hashing • Passkey 2FA |
| **Testing** | Native Node.js Test Runner • 118 Integration Tests |
| **Database** | SQLite3 with Foreign Keys • Relational Schema |

</div>

---

## 🏗 Architecture

```text
hospital-pharmacy-pos/
├── backend/
│   ├── src/
│   │   ├── db/              # SQLite connection (WAL) + schema + seed
│   │   ├── middleware/      # JWT auth + role authorization
│   │   ├── routes/          # auth, dashboard, inventory, sales, reports
│   │   ├── tests/           # 8 test suites (118 tests)
│   │   └── server.js        # Express entry point (port 5000)
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # POS Terminal, Dashboard, Catalog, Reports
│   │   ├── App.css          # Design system: glassmorphism + dark theme
│   │   ├── index.css        # Design tokens + typography
│   │   └── main.jsx
│   └── package.json         # Vite + React (port 5173)
├── database/                # SQLite database (auto-created)
├── docs/                    # Viva documentation & technical guide
├── .gitignore
├── package.json             # Root workspace scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- Git (for cloning)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/hospital-pharmacy-pos.git
cd hospital-pharmacy-pos

# 2. Backend setup
cd backend
cp .env.example .env          # Configure your JWT_SECRET!
npm install
npm run seed                  # Initialize database with demo data
npm start                     # Starts on http://localhost:5000

# 3. Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev                   # Starts on http://localhost:5173
```

### Health Check
- **Backend**: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
- **Frontend**: Open `http://localhost:5173` in browser

---

## 🔑 Demo Staff Accounts

| Username | Password | Passkey | Role | Capabilities |
|----------|----------|---------|------|--------------|
| `admin` | `admin123` | `2306324052` | **Admin** | Full dashboard, alerts, stock adjustment, medicine catalog, user management, reports |
| `cashier01` | `cashier123` | `1111` | **Cashier** | POS billing, live catalog, patient invoices, receipt printing |
| `cashier02` | `cashier123` | `1111` | **Cashier** | Secondary shift counter dispensary |

> **Quick Login**: 1-click demo buttons available on sign-in screen for rapid demonstration.

---

## 🧪 Automated Test Suite (100% Passing)

```bash
cd backend

# Run all tests (118 tests)
npm test

# Individual test suites:
node src/db/verify.js                    # Schema & seed validation (20 tests)
node src/tests/test_auth.js              # Auth & RBAC (16 tests)
node src/tests/test_dashboard.js         # KPIs & 4-tier alerts (15 tests)
node src/tests/test_inventory.js         # Inventory & batches (14 tests)
node src/tests/test_pos.js               # POS & stock deduction (15 tests)
node src/tests/test_reports.js           # Analytics & procurement (17 tests)
node src/tests/test_security.js          # Security audit (20 tests)
node src/tests/test_e2e_workflow.js      # 18-step viva workflow (16 tests)
```

**Coverage**: 118 / 118 tests passing ✅

---

## 🎓 College Viva & Demonstration

Detailed step-by-step presentation scripts, viva questions, and technical architecture explanations:

📄 **[Hospital Pharmacy POS System Documentation](docs/Hospital_Pharmacy_POS_System_Documentation.md)**

Includes:
- 18-step live demonstration workflow
- Expected viva questions with model answers
- Database schema walkthrough
- Security architecture deep-dive
- Performance considerations

---

## 🔧 Configuration

### Environment Variables (Backend)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `JWT_SECRET` | **Yes** | JWT signing secret (64+ chars) | `crypto.randomBytes(64).toString('hex')` |
| `DATABASE_PATH` | No | SQLite file path | `../database/pharmacy.db` |
| `FRONTEND_URL` | No | CORS origin for production | `https://your-domain.com` |

> **Generate JWT Secret**: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## 📦 Production Deployment

### Backend
```bash
cd backend
NODE_ENV=production JWT_SECRET=<strong-secret> npm start
```
- Use PM2 or systemd for process management
- Configure reverse proxy (Nginx) with SSL
- Set secure CORS origin in `FRONTEND_URL`

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ via Nginx, Vercel, Netlify, or any static host
```

### Database
- SQLite file (`pharmacy.db`) persists in `database/`
- For high availability, consider PostgreSQL migration (schema compatible)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- ESLint + Prettier configured
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Write tests for new features

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

## 🙏 Acknowledgments

- Built for **pharmacy education** and **healthcare technology** demonstrations
- Inspired by real hospital pharmacy workflows
- Designed with clinical safety as the highest priority

---

<p align="center">
  <strong>Made with ❤️ for Healthcare Technology Education</strong><br>
  <sub>Hospital Pharmacy POS • Clinical-Grade • Student-Friendly</sub>
</p>