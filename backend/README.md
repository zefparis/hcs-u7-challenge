# HCS-U7 Challenge Backend Origin

**Protected backend origin using production HCS-U7 infrastructure.**

## Philosophy

This backend:
- Has **ZERO** internal bot protection logic
- Relies **100%** on HCS-U7 Proxy for security
- Demonstrates real-world protection under production conditions
- Logs all requests for internal analysis only
- Is topologically protected (network-level access control)

## Architecture

```
Visitor → HCS-U7 Proxy → THIS BACKEND
```

**This backend should NEVER be exposed directly to the internet.**

## Endpoints

### Public (Protected by HCS-U7)

- `GET /health` - Health check
- `GET /api/public/info` - Service information
- `POST /api/public/interact` - Interactive endpoint
- `GET /api/public/data` - Sample data retrieval

### Internal (Token-protected)

- `GET /api/internal/logs` - Request logs (requires `Authorization: Bearer <token>`)

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Running

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `INTERNAL_TOKEN` - Token for internal logs endpoint
- `PROXY_SECRET` - Shared secret for proxy authentication (optional but recommended)

## Request Headers (from HCS-U7 Proxy)

The proxy forwards these headers:

- `X-Real-IP` - Original visitor IP
- `X-HCS-Data` - HCS-U7 metadata (JSON)
- `X-CF-Data` - Cloudflare metadata (JSON)

## Logging

All requests are logged in-memory (last 1000 requests).

Access logs via:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/internal/logs
```

## Security Model

**This backend trusts the HCS-U7 Proxy completely.**

Network-level protection:
- Requires `CF-Connecting-IP` header (Cloudflare)
- Optional shared secret via `X-Proxy-Secret` header
- Should be deployed behind firewall or private network

The backend does NOT implement:
- Bot detection logic
- Cognitive signal validation
- Rate limiting
- Traffic analysis

**All security decisions are handled by HCS-U7 Proxy.**

## Deployment

This backend should be deployed:
- Behind HCS-U7 Proxy (mandatory)
- On a private network or with firewall rules
- With HTTPS (handled by proxy)
- With monitoring and logging

**Never expose this backend directly to the public internet.**

## Philosophy

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

This backend demonstrates that HCS-U7 protects real endpoints
using production infrastructure with zero modifications.

This is a real client implementation, not a demo system.
