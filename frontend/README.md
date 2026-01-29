# HCS-U7 Challenge Frontend

**Passive UI for interacting with protected endpoints.**

## Philosophy

This frontend:
- Is a simple static HTML/CSS/JS interface
- Sends standard HTTP requests to protected endpoints
- Does not control or trigger any verification logic
- Displays only generic HTTP responses
- Never exposes internal mechanisms

## Architecture

```
This Frontend → HCS-U7 Proxy → HCS-U7 Backend → Challenge Backend Origin
```

## Files

- `index.html` - Main challenge page
- `styles.css` - Styling (dark theme, responsive)
- `app.js` - Client-side logic (API calls, stats)

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

```bash
# Deploy to Cloudflare Pages
wrangler pages deploy frontend --project-name=hcs-u7-challenge
```

### Option 2: Static Hosting

Upload the `frontend/` folder to any static hosting:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### Option 3: Local Development

```bash
cd frontend
python -m http.server 8080
# or
npx serve
```

## Configuration

The frontend automatically uses the current domain as API base.

If you need to point to a different API:
```javascript
// In app.js, change:
const API_BASE = 'https://api.hcs-u7-challenge.com';
```

## Domain Setup

1. Deploy frontend to Cloudflare Pages
2. Add custom domain: `hcs-u7-challenge.com`
3. Configure HCS-U7 tenant with this domain
4. Standard HCS-U7 Proxy intercepts all `/api/*` requests

## User Experience

**What users see:**
- Service description
- €10,000 reward announcement
- Interactive endpoint testing interface
- Client-side request statistics
- Generic HTTP responses only

**What is NOT exposed:**
- Internal scoring mechanisms
- Decision reasons
- Proxy behavior
- Backend logic
- Timing patterns
- System flags or thresholds

## Philosophy

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

Users can:
- Send requests via browser or automation
- Observe system responses to different traffic patterns
- Test at any scale or frequency

The system responds with standard HTTP status codes:
- 200 OK
- 503 Service Unavailable
- 403 Forbidden

No internal details are exposed.

## Security

This frontend:
- Contains no secrets
- Contains no API keys
- Contains no sensitive logic
- Is completely public

All security is handled by HCS-U7 Proxy.

## Testing

Open `index.html` in a browser and test the endpoints:
1. Click "Test Endpoint" for GET requests
2. Modify JSON and click "Send Request" for POST
3. Watch the response boxes and stats update

## Integration with HCS-U7

This frontend works with:
- Standard HCS-U7 Proxy (zero modifications)
- Production HCS-U7 Backend
- Protected backend origin

This is a standard client implementation. Configure the domain in HCS-U7 dashboard as with any production tenant.
