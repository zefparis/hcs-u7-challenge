# HCS-U7 Challenge - Deployment Guide

**Deployment guide for a real HCS-U7 client implementation using production infrastructure.**

## Architecture Overview

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

## Prerequisites

- Access to HCS-U7 Dashboard (hcs-u7.com)
- Cloudflare account with Pages access
- Server for backend origin (VPS, Cloud Run, etc.)
- Domain: `hcs-u7-challenge.com`

## Step 1: Deploy Backend Origin

### 1.1 Prepare Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
INTERNAL_TOKEN=<generate-secure-token>
PROXY_SECRET=<shared-secret-with-proxy>
```

### 1.2 Deploy Backend

**Option A: Cloud Run (Recommended)**
```bash
gcloud run deploy hcs-u7-challenge-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080,INTERNAL_TOKEN=<token>,PROXY_SECRET=<secret>
```

**Option B: VPS (Ubuntu)**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Deploy app
cd /opt
sudo git clone <repo> hcs-u7-challenge
cd hcs-u7-challenge/backend
sudo npm install
sudo cp .env.example .env
sudo nano .env  # Configure

# Setup systemd service
sudo nano /etc/systemd/system/hcs-u7-challenge.service
```

Service file:
```ini
[Unit]
Description=HCS-U7 Challenge Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hcs-u7-challenge/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl enable hcs-u7-challenge
sudo systemctl start hcs-u7-challenge
sudo systemctl status hcs-u7-challenge
```

### 1.3 Note Backend URL

Example: `https://backend-internal.hcs-u7-challenge.com:3000`

**IMPORTANT: This backend should NOT be publicly accessible. Use firewall rules or private networking.**

## Step 2: Deploy Frontend

### 2.1 Deploy to Cloudflare Pages

```bash
cd frontend

# Using Wrangler
wrangler pages deploy . --project-name=hcs-u7-challenge

# Or via Cloudflare Dashboard:
# 1. Go to Pages
# 2. Create project
# 3. Upload frontend/ folder
```

### 2.2 Configure Custom Domain

In Cloudflare Pages:
1. Go to Custom Domains
2. Add `hcs-u7-challenge.com`
3. Add `www.hcs-u7-challenge.com` (optional)
4. Wait for DNS propagation

## Step 3: Configure HCS-U7 Tenant

### 3.1 Create Tenant

Login to HCS-U7 Dashboard: `https://hcs-u7.com/dashboard`

1. Go to **Tenants** → **Create New Tenant**
2. Fill in:
   - **Name**: `HCS-U7 Challenge`
   - **Identifier**: `challenge`
   - **Type**: `Production`

### 3.2 Configure Domain

In tenant settings:

1. Go to **Domains**
2. Add domain: `hcs-u7-challenge.com`
3. Verify DNS (CNAME or A record)
4. Enable HTTPS

### 3.3 Configure Backend Origin

In tenant settings:

1. Go to **Backend Origins**
2. Add origin:
   - **Name**: `Challenge Backend`
   - **URL**: `https://backend-internal.hcs-u7-challenge.com:3000`
   - **Health Check**: `/health`
   - **Timeout**: `30s`

### 3.4 Configure Proxy Routes

In tenant settings:

1. Go to **Proxy Routes**
2. Add route:
   - **Pattern**: `/api/public/*`
   - **Origin**: `Challenge Backend`
   - **Method**: `ALL`
   - **Protection**: `Enabled` ✅

3. Add route:
   - **Pattern**: `/api/internal/*`
   - **Origin**: `Challenge Backend`
   - **Method**: `ALL`
   - **Protection**: `Enabled` 
   - **Auth**: `System Key Only`

### 3.5 Configure Security Settings

In tenant settings → Security:

- **Protection**: `Enabled` 
- **Rate Limiting**: `Adaptive`
- **Logging**: `Full` (for analysis)

Use standard production settings. No special configuration required.

### 3.6 Generate System Key

In tenant settings → API Keys:

1. Create new key:
   - **Name**: `Challenge System Key`
   - **Type**: `System`
   - **Permissions**: `Backend Access`
2. Copy the key (you'll need it for monitoring)

## Step 4: Deploy HCS-U7 Proxy

### 4.1 Deploy Proxy Worker

The HCS-U7 Proxy is standard production proxy. Zero modifications.

In HCS-U7 Dashboard:
1. Go to tenant → **Proxy**
2. Click **Deploy Proxy Worker**
3. Select route: `hcs-u7-challenge.com/*`
4. Deploy

This creates a standard Cloudflare Worker that:
- Intercepts all requests to `hcs-u7-challenge.com`
- Collects behavioral signals
- Forwards to HCS-U7 Backend
- Proxies to Backend Origin based on decisions

### 4.2 Verify Proxy

```bash
curl https://hcs-u7-challenge.com/api/public/info
```

Expected response:
```json
{
  "challenge": "HCS-U7 Security Challenge",
  "message": "This backend is protected by HCS-U7 cognitive biometric authentication",
  "protected": true,
  "timestamp": "2024-01-26T..."
}
```

## Step 5: Configure DNS

### 5.1 Frontend DNS

Point domain to Cloudflare Pages:

```
hcs-u7-challenge.com    CNAME    hcs-u7-challenge.pages.dev
www.hcs-u7-challenge.com CNAME   hcs-u7-challenge.pages.dev
```

### 5.2 Backend DNS (Private)

If using private backend:

```
backend-internal.hcs-u7-challenge.com    A    <private-ip>
```

**Do NOT expose backend publicly.**

## Step 6: Testing

### 6.1 Test Frontend

```bash
curl https://hcs-u7-challenge.com/
# Should return HTML
```

### 6.2 Test API (Human-like)

```bash
curl https://hcs-u7-challenge.com/api/public/info
# Should return 200 OK
```

### 6.3 Test API (Burst)

```bash
for i in {1..100}; do
  curl -s https://hcs-u7-challenge.com/api/public/data &
done
wait
# Should eventually return 503 or 403
```

### 6.4 Test Protection

Visit `https://hcs-u7-challenge.com` in a browser:
1. Click "Test Endpoint"
2. Should work normally (legitimate traffic)
3. Attempt automation via scripts
4. Observe system responses to different patterns

## Step 7: Monitoring

### 7.1 HCS-U7 Dashboard

Monitor in real-time:
- Go to tenant → **Analytics**
- View:
  - Total requests
  - Allowed/Throttled/Blocked
  - Security scores (internal only)
  - Traffic patterns

### 7.2 Backend Logs

Access internal logs:

```bash
curl -H "Authorization: Bearer <INTERNAL_TOKEN>" \
  https://backend-internal.hcs-u7-challenge.com:3000/api/internal/logs
```

### 7.3 Cloudflare Analytics

Monitor in Cloudflare:
- Pages analytics (frontend)
- Worker analytics (proxy)
- DNS analytics

## Step 8: Public Announcement

Once deployed and tested:

1. Announce on social media
2. Publish blog post
3. Add to HCS-U7 website
4. Monitor for attempts

## Troubleshooting

### Frontend not loading
- Check Cloudflare Pages deployment status
- Verify DNS propagation: `dig hcs-u7-challenge.com`
- Check SSL certificate

### API returning 502
- Verify backend is running: `curl http://backend:3000/health`
- Check HCS-U7 proxy configuration
- Verify origin URL in tenant settings

### All requests blocked
- Check HCS-U7 security settings
- Verify proxy is deployed
- Check tenant status in dashboard

### Backend not receiving requests
- Verify proxy routes in tenant settings
- Check backend firewall rules
- Verify HCS-U7 can reach backend origin

## Security Checklist

- ✅ Backend is NOT publicly accessible
- ✅ Backend has NO internal bot protection logic (relies on HCS-U7)
- ✅ Backend requires CF-Connecting-IP header
- ✅ Frontend contains NO secrets
- ✅ System key is stored securely
- ✅ HTTPS is enabled everywhere
- ✅ Logging is enabled for monitoring
- ✅ Standard HCS-U7 protection is enabled

## Maintenance

### Update Backend
```bash
cd backend
git pull
npm install
sudo systemctl restart hcs-u7-challenge
```

### Update Frontend
```bash
cd frontend
wrangler pages deploy .
```

### Monitor Stats
Check HCS-U7 Dashboard daily for:
- Attack patterns
- Bypass attempts
- System performance

## Philosophy

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

This deployment uses:
- ✅ Production HCS-U7 Backend (zero modifications)
- ✅ Standard HCS-U7 Proxy (zero modifications)
- ✅ Production tenant configuration
- ✅ Real protected backend origin

**This is exactly what customers get.**

No special modes. No parallel systems. Real protection.

## Support

For issues:
- HCS-U7 Dashboard: https://hcs-u7.com/dashboard
- Documentation: https://docs.hcs-u7.com
- Support: support@hcs-u7.com
