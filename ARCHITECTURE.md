# HCS-U7 Challenge - Architecture Documentation

## Philosophy

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

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

**The only difference is the interface and the protected backend target.**

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VISITOR                                  │
│                    (Human or Bot)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  hcs-u7-challenge.com                            │
│              (Cloudflare Pages - Static Frontend)                │
│                                                                   │
│  - HTML/CSS/JS only                                              │
│  - No secrets, no logic                                          │
│  - Makes API calls to /api/*                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Worker Proxy (HCS-U7)                    │
│                    (STANDARD PROXY)                              │
│                                                                   │
│  - Intercepts /api/* requests                                    │
│  - Collects cognitive signals                                    │
│  - Forwards to HCS-U7 Backend                                    │
│  - NO MODIFICATIONS for challenge                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HCS-U7 Backend                                 │
│                 (PRODUCTION SYSTEM)                              │
│                                                                   │
│  - Cognitive signal processing                                   │
│  - Scoring and verification                                      │
│  - Decision engine (ALLOW/THROTTLE/BLOCK)                        │
│  - NO MODIFICATIONS for challenge                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Challenge Backend Origin                            │
│                  (Node.js/Express)                               │
│                                                                   │
│  - Simple API endpoints                                          │
│  - NO internal protection                                        │
│  - Relies 100% on HCS-U7                                         │
│  - Logs requests for analysis                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (Static UI)

**Location**: `frontend/`  
**Technology**: HTML, CSS, JavaScript (vanilla)  
**Hosting**: Cloudflare Pages  
**Domain**: `hcs-u7-challenge.com`

**Responsibilities**:
- Display service information
- Provide interactive endpoint testing interface
- Show client-side request statistics
- Send standard HTTP requests to protected endpoints

**What it does NOT do**:
- Control or trigger verification logic
- Store secrets or credentials
- Implement any security logic
- Expose internal mechanisms

### 2. HCS-U7 Proxy (Cloudflare Worker)

**Technology**: Cloudflare Worker (standard HCS-U7 proxy)  
**Configuration**: Via HCS-U7 Dashboard  
**Modifications**: NONE

**Responsibilities**:
- Intercept all `/api/*` requests
- Collect cognitive signals from browser
- Forward signals to HCS-U7 Backend
- Proxy responses back to client
- Apply decisions (ALLOW/THROTTLE/BLOCK)

**Signal Collection** (handled by standard proxy):
- Behavioral patterns
- Device characteristics
- Network metadata
- Request patterns

### 3. HCS-U7 Backend (Production)

**Technology**: HCS-U7 Core Engine  
**Modifications**: NONE

**Responsibilities**:
- Process incoming signals
- Calculate security scores
- Make access decisions
- Log events for tenant dashboard
- Update tenant statistics

**Decision Pipeline**:
```
Request → Signal Processing → Scoring → Decision
                                           ↓
                               ALLOW / THROTTLE / BLOCK
```

### 4. Challenge Backend Origin (Protected Target)

**Location**: `backend/`  
**Technology**: Node.js + Express  
**Hosting**: Private server (VPS, Cloud Run, etc.)  
**Protection**: NONE (relies on HCS-U7)

**Endpoints**:
- `GET /health` - Health check
- `GET /api/public/info` - Challenge info
- `POST /api/public/interact` - Interactive endpoint
- `GET /api/public/data` - Data retrieval
- `GET /api/internal/logs` - Request logs (token-protected)

**Responsibilities**:
- Accept any request structure
- Log requests internally
- Return generic responses
- Prove that HCS-U7 protects it

**What it does NOT do**:
- Check for bots
- Validate cognitive signals
- Enforce rate limits
- Block suspicious traffic

## Data Flow

### Normal Request (Human)

```
1. User clicks "Test Endpoint" in browser
2. JavaScript makes fetch() to /api/public/info
3. Cloudflare Worker Proxy intercepts request
4. Proxy collects behavioral signals
5. Proxy forwards to HCS-U7 Backend with metadata
6. HCS-U7 Backend processes request → Decision: ALLOW
7. Proxy forwards request to Backend Origin
8. Backend Origin returns data
9. Proxy returns 200 OK to user
10. User sees response
```

### Bot Request (Automated)

```
1. Script makes curl request to /api/public/info
2. Cloudflare Worker Proxy intercepts request
3. Proxy collects behavioral signals
4. Proxy forwards to HCS-U7 Backend with metadata
5. HCS-U7 Backend processes request → Decision: BLOCK
6. Proxy returns 403 Forbidden (generic message)
7. Request never reaches Backend Origin
8. Script sees 403 error
```

### Throttled Request (Burst)

```
1. User/bot makes 100 requests in 1 second
2. Proxy intercepts all requests
3. HCS-U7 Backend detects burst pattern
4. HCS-U7 Backend decides: THROTTLE
5. Proxy returns 503 Service Unavailable
6. Some requests are delayed
7. User/bot experiences service degradation
```

## Tenant Configuration

### Tenant: "challenge"

**Settings**:
- Name: `HCS-U7 Challenge`
- Domain: `hcs-u7-challenge.com`
- Type: `Production`
- Protection: `Enabled`
- Rate Limiting: `Adaptive`
- Logging: `Full`

**Backend Origin**:
- URL: `https://backend-internal.hcs-u7-challenge.com:3000`
- Health Check: `/health`
- Timeout: `30s`

**Proxy Routes**:
- `/api/public/*` → Challenge Backend (Protected)
- `/api/internal/*` → Challenge Backend (System Key Only)

**API Keys**:
- System Key (for internal monitoring)
- No public keys (visitors don't authenticate)

## Security Model

### What HCS-U7 Protects Against

- ✅ Scripted bots (curl, requests, etc.)
- ✅ Headless browsers (Puppeteer, Selenium)
- ✅ Traffic bursts (DDoS attempts)
- ✅ Automated tools (scrapers, crawlers)
- ✅ AI agents (GPT-powered automation)

### What HCS-U7 Does NOT Protect Against

- ❌ Legitimate human users (by design)
- ❌ Slow, careful automation (economically non-viable)
- ❌ Physical robots with real input devices (impractical)

### Cost Asymmetry

**Human cost**: Near zero
- Natural interaction
- No friction
- No delays

**Bot cost**: Exponentially increasing
- Must simulate human behavior
- Must pass cognitive tests
- Must avoid detection patterns
- Must scale slowly (expensive)

**Goal**: Make automation economically non-viable, not impossible.

## Dashboard Integration

The HCS-U7 Dashboard shows the challenge tenant as a standard production tenant.

**Visible in Dashboard** (internal only):
- Total requests
- Allowed/Throttled/Blocked counts
- Security score distributions
- Traffic patterns
- Geographic distribution
- Device types

**NOT Exposed Publicly**:
- Internal scores
- Decision reasons
- Detection thresholds
- System logic
- Timing patterns

## Differences from Regular Tenants

| Aspect | Regular Tenant | Challenge Tenant |
|--------|---------------|------------------|
| Backend | Customer's API | Challenge Origin |
| Users | Authenticated | Anonymous |
| Dashboard Access | Customer only | HCS team only |
| Public Stats | No | Yes (generic) |
| Reward | No | €10,000 |
| Purpose | Protection | Demonstration |

**Technical Implementation**: Identical  
**Security Logic**: Identical  
**Proxy Behavior**: Identical  
**Backend Integration**: Identical

## Opacity Requirements

The system must NEVER expose:
- ❌ Internal scores or flags
- ❌ Decision reasons
- ❌ Proxy behavior details
- ❌ Backend logic
- ❌ Tenant identifiers
- ❌ Timing patterns
- ❌ Dashboard or admin interfaces
- ❌ Pass/fail language
- ❌ Human/bot detection language

The system responds ONLY with:
- ✅ Standard HTTP status codes (200, 503, 403)
- ✅ Generic error messages
- ✅ No explanations or hints

## Success Criteria

The challenge is successful if:

1. ✅ It runs entirely on production HCS-U7 logic
2. ✅ No additional attack surface is introduced
3. ✅ The dashboard continues to work unchanged
4. ✅ It can be described as: "This is exactly what our customers get"
5. ✅ Humans feel nothing
6. ✅ Automation feels entropy
7. ✅ The €10,000 reward remains unclaimed

## Scalability

The challenge must handle:
- Thousands of concurrent visitors
- Millions of requests per day
- Coordinated attack attempts
- Traffic spikes from social media

**How**:
- Cloudflare's global network (frontend + proxy)
- HCS-U7's distributed backend
- Adaptive rate limiting
- Edge caching where appropriate

## Monitoring

**Real-time**:
- HCS-U7 Dashboard (tenant analytics)
- Cloudflare Analytics (traffic)
- Backend logs (request patterns)

**Alerts**:
- Unusual traffic patterns
- Backend health issues
- Potential bypass attempts

**Analysis**:
- Daily review of attack patterns
- Weekly security reports
- Monthly public statistics

## Philosophy

> "The HCS-U7 Challenge is not a test of humanity.  
> It is a demonstration of cost asymmetry."

**Key Principles**:
1. Use production infrastructure with zero modifications
2. No special modes, flags, or parallel systems
3. Never expose internal mechanisms
4. Make automation economically non-viable
5. Legitimate users experience no friction
6. Automation experiences increasing cost
7. Demonstrate real-world protection capabilities

This is a real client implementation demonstrating production-grade protection.
