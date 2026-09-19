# PC PART HUB 🖥️⚡

> **Premium White Apple-Style PC Hardware Marketplace**  
> Certified Pre-Owned Components • Benchmarked & Tested • Direct WhatsApp & Phone Enquiries

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-blue.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

---

## 🌟 Highlights & Features

- **Apple-Inspired Design Language**: Pure white aesthetics, subtle frosted glass layers (`backdrop-blur`), liquid metallic borders, smooth micro-animations, and clean typography.
- **Direct WhatsApp / Call Integration**: Zero friction offline-deal workflow. Prioritizes launching native WhatsApp desktop and mobile applications with pre-filled product enquiry messages.
- **Complete Hardware Catalog**: Multi-attribute filtering by Category, Brand, Price Range, and Condition rating (*Like New*, *Excellent*, *Good*, *Fair*).
- **Curated PC Builds & Combos**: Balanced GPU + CPU + Motherboard hardware bundles.
- **Benchmark & Testing Transparency**: Built-in 4-stage hardware certification process (FurMark, Cinebench, MemTest86, Thermal paste inspection).
- **Comprehensive Admin Suite**:
  - Protected Admin Dashboard with quick stock toggle (*In Stock*, *Low Stock*, *Sold Out*).
  - Dynamic spec builder with multi-image upload.
  - Category manager & hardware combo builder.
  - CSV Bulk inventory import.
  - Live Database Connectivity & Health Check widget with SQLite integrity reporting.
  - In-app admin username and password credentials manager.
- **SEO & Social Sharing Optimized**: Structured Schema.org (`ComputerStore` & `Product` JSON-LD), OpenGraph tags, dynamic meta descriptions, and robots.txt + XML sitemap.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js 22+, Express, TypeScript, Multer, Bcrypt, JWT, Vercel Serverless Functions
- **Database**: SQLite 3 (Node 22 built-in `node:sqlite`), zero C++ compilation dependencies, auto-seeded
- **Hosting**: 100% Vercel (Frontend on Global CDN + Backend on Vercel Serverless Functions, Zero Render needed)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/mefake2620122-dev/pc_parts_hub.git
cd pc_parts_hub

# Install all dependencies
npm run install:all
```

### 2. Run Development Servers
```bash
# Run both client and server simultaneously
npm run dev
```
- Public Storefront: `http://localhost:5173` (or `http://localhost:5000` in production)
- Admin Portal: `http://localhost:5173/admin`

---

## 📦 Production Build & Run

```bash
# Build both frontend and backend
npm run build

# Start production server (serves frontend + API together)
npm start
```

Admin Access:
- Sign in at `/admin/login` using your configured admin credentials.
- Update your credentials anytime in **Store Settings** (`/admin/settings`) or override via environment variable `ADMIN_PASSWORD`.

---

## ⚡ 100% Vercel Deployment (Zero Render Needed)

This repository is configured to deploy directly to **Vercel** with a single upload/push:
- **Root Directory**: `./` (default)
- **Framework Preset**: `Other` (or Vite)
- **Build Command**: `npm run build` (auto-detected from `vercel.json`)
- **Output Directory**: `client/dist` (auto-detected from `vercel.json`)
- **Node.js Version**: Select **22.x** in Vercel Project Settings > General > Node.js Version.

Frontend static files are deployed to Vercel's global Edge CDN, and backend API routes run as Vercel Serverless Functions under `/api`. Zero CORS issues, zero cold start spin-down timeouts, and zero Render setup required!

---

## 🛡️ Security & Integrity

- Passwords are encrypted using `bcrypt` (10 rounds). Plaintext passwords never persist.
- API endpoints strictly exclude password hashes.
- Database runs locally with WAL mode and transaction safeguards.
