# HCS-U7 Challenge

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

**Public challenge with €10,000 reward for anyone who successfully bypasses the HCS-U7 cognitive biometric authentication system.**

## What is this?

The HCS-U7 Challenge is **NOT**:
- ❌ A demo
- ❌ A sandbox
- ❌ A special mode
- ❌ A separate system

The HCS-U7 Challenge **IS**:
- ✅ A real HCS-U7 client implementation
- ✅ Using the exact same backend
- ✅ Using the exact same proxy
- ✅ Using the exact same scoring logic
- ✅ Using the exact same decision pipeline

**This is exactly what our customers get.**

## Architecture

```
Visitor
 ↓
hcs-u7-challenge.com (Cloudflare Pages - Frontend)
 ↓
Cloudflare Worker Proxy (HCS-U7 Standard Proxy)
 ↓
HCS-U7 Backend (Production - Scoring & Verification)
 ↓
Challenge Backend Origin (Node.js API - Protected Target)
```

## Project Structure

```
hcs-u7-challenge/
├── frontend/              # Static UI (Cloudflare Pages)
│   ├── index.html        # Challenge page
│   ├── styles.css        # Styling
│   ├── app.js            # Client logic
│   └── README.md         # Frontend docs
│
├── backend/              # Protected origin (Node.js/Express)
│   ├── src/
│   │   └── server.js     # API server
│   ├── package.json      # Dependencies
│   └── README.md         # Backend docs
│
├── ARCHITECTURE.md       # Detailed architecture documentation
├── DEPLOYMENT.md         # Complete deployment guide
└── README.md            # This file
```

## Quick Start

### 1. Test Backend Locally

```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:3000
```

### 2. Test Frontend Locally

```bash
cd frontend
npx serve
# Frontend runs on http://localhost:3000
```

### 3. Deploy to Production

**Quick Deploy (Render + Vercel):**
- Backend: [Deploy to Render](https://render.com) - See [DEPLOY_RENDER_VERCEL.md](DEPLOY_RENDER_VERCEL.md)
- Frontend: [Deploy to Vercel](https://vercel.com) - See [DEPLOY_RENDER_VERCEL.md](DEPLOY_RENDER_VERCEL.md)

**Full Production Setup:**
- See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions with custom infrastructure.

## Components

### Frontend (Static UI)

- **Technology**: HTML, CSS, JavaScript (vanilla)
- **Hosting**: Vercel, Cloudflare Pages, or any static host
- **Purpose**: Public interface for the challenge
- **Features**:
  - Challenge description and rules
  - Interactive API testing
  - Live statistics (client-side)
  - No authentication required

### HCS-U7 Proxy (Standard)

- **Technology**: Cloudflare Worker (HCS-U7 standard proxy)
- **Configuration**: Via HCS-U7 Dashboard
- **Modifications**: NONE
- **Purpose**: Intercept requests, collect cognitive signals, enforce decisions

### HCS-U7 Backend (Production)

- **Technology**: HCS-U7 Core Engine
- **Modifications**: NONE
- **Purpose**: Process signals, calculate scores, make security decisions

### Challenge Backend Origin

- **Technology**: Node.js + Express
- **Hosting**: Render, Cloud Run, VPS, or any Node.js host
- **Protection**: NONE (relies 100% on HCS-U7)
- **Purpose**: Prove that HCS-U7 protects real backends
- **Endpoints**:
  - `GET /api/public/info` - Challenge information
  - `POST /api/public/interact` - Interactive endpoint
  - `GET /api/public/data` - Data retrieval

## Philosophy

The challenge does not test intelligence. It tests scalability.

The goal is not to block every attempt. The goal is to make automation economically non-viable.

**Humans should feel nothing.**  
**Automation should feel entropy.**

## Security Model

### What HCS-U7 Protects Against

- ✅ Scripted bots (curl, requests, etc.)
- ✅ Headless browsers (Puppeteer, Selenium)
- ✅ Traffic bursts (DDoS attempts)
- ✅ Automated tools (scrapers, crawlers)
- ✅ AI agents (GPT-powered automation)

### Cost Asymmetry

- **Human cost**: Near zero (natural interaction, no friction)
- **Bot cost**: Exponentially increasing (must simulate behavior, pass tests, avoid patterns)

### System Responses

The system will NEVER tell you if you passed or failed. It will only respond with:

- **200 OK** - Request allowed
- **429 Too Many Requests** - Throttled
- **403 Forbidden** - Blocked

No explanations. No hints. No scores.

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed system architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide (custom infrastructure)
- **[DEPLOY_RENDER_VERCEL.md](DEPLOY_RENDER_VERCEL.md)** - Quick deploy guide (Render + Vercel)
- **[frontend/README.md](frontend/README.md)** - Frontend documentation
- **[backend/README.md](backend/README.md)** - Backend documentation

## Deployment Checklist

- [ ] Deploy backend origin (private server)
- [ ] Deploy frontend (Cloudflare Pages)
- [ ] Create HCS-U7 tenant in dashboard
- [ ] Configure domain and routes
- [ ] Deploy HCS-U7 proxy worker
- [ ] Test all endpoints
- [ ] Monitor in dashboard
- [ ] Announce publicly

## Monitoring

- **HCS-U7 Dashboard**: Real-time analytics, attack patterns, security events
- **Backend Logs**: Request patterns, internal analysis
- **Cloudflare Analytics**: Traffic, performance, edge metrics

## The Reward

**€10,000** for anyone who successfully bypasses the system.

To claim:
1. Demonstrate automated access to protected endpoints
2. Prove it bypasses HCS-U7 detection
3. Show reproducible method
4. Contact: challenge@hcs-u7.com

## Support

- **Documentation**: https://docs.hcs-u7.com
- **Dashboard**: https://hcs-u7.com/dashboard
- **Support**: support@hcs-u7.com

## License

Proprietary - HCS-U7 © 2024
