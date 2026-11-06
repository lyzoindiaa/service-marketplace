# service-marketplace — AraKart

> Hyperlocal Services Marketplace for Ara, Bhojpur, Bihar.  
> Built with React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, and MongoDB.

---

## 🚀 Local Development (100% Offline & Free)

This project is configured to run and test completely locally with **zero cloud dependencies** and **zero GitHub Actions token/minute consumption**.

### Prerequisites
- Node.js 20+
- Local MongoDB running on `mongodb://127.0.0.1:27017`

### Quick Start
```bash
# 1. Install all dependencies across workspaces
cd arakart
npm install

# 2. Seed database with Ara categories, cities, and demo sellers
npm run seed:demo

# 3. Start both backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

Visit **`http://localhost:5173`** to use AraKart.

---

## 🧪 Local Quality Gate & Test Runner (No GitHub Minutes Used)

The GitHub Actions workflow is set to `workflow_dispatch` (manual only) so that `git push` **never** triggers automated cloud runners or consumes GitHub tokens.

Run the entire quality gate locally before committing:
```bash
cd arakart

# Run linting across client and server
npm run lint

# Run all 246 automated tests (161 backend + 85 frontend)
npm test

# Build production bundles
npm run build

# Or run the complete unified quality check in one command:
npm run verify
```

---

## 📁 Repository Structure
```
d:/research/
├── arakart/
│   ├── client/             # React 18 + Vite + Tailwind CSS v3 SPA
│   ├── server/             # Node.js + Express + Mongoose + Socket.IO API
│   ├── package.json        # Monorepo workspaces manifest
│   └── README.md
├── .github/
│   └── workflows/
│       └── ci.yml          # Manual / local CI workflow (no automatic token burn)
└── README.md
```

---

## 🔐 Multi-Auth Methods
1. **Phone OTP:** Instant 6-digit OTP (logged to terminal in local mode via `SMS-CONSOLE`).
2. **Email / Password:** Full registration, verification code, and password reset.
3. **Google OAuth:** One-tap sign in (configured for client OAuth ID when provided).
