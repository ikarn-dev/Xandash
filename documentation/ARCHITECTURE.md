# XanDash Architecture

## Overview

XanDash is a real-time monitoring dashboard built with Next.js 16, following a modern serverless architecture optimized for performance and scalability.

## High-Level Design (HLD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │  Analytics   │  │   pNodes     │  │   Network    │  │ Leaderboard  │        │
│   │   Dashboard  │  │    Page      │  │     Map      │  │    Page      │        │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │    Node      │  │   Country    │  │  Endpoints   │  │    XAND      │        │
│   │   Profile    │  │    Page      │  │    Tester    │  │    Token     │        │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │              Cloudflare Turnstile CAPTCHA Protection                 │       │
│   └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS API LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │  /api/nodes  │  │ /api/node-   │  │  /api/pod-   │  │  /api/xand-  │        │
│   │              │  │   profile    │  │   credits    │  │     info     │        │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │  /api/sync-  │  │  /api/rpc    │  │ /api/verify- │  │ /api/db-     │        │
│   │    nodes     │  │   (proxy)    │  │  turnstile   │  │   status     │        │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │                    React Query Cache Layer                           │       │
│   └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│   │   MongoDB Atlas     │  │   Xandeum RPC       │  │   Cloudflare        │     │
│   │   ─────────────     │  │   ───────────       │  │   Turnstile         │     │
│   │   • node_snapshots  │  │   • Primary RPC     │  │   ───────────       │     │
│   │   • node_events     │  │   • Fallback RPC    │  │   • Token verify    │     │
│   │   • Historical data │  │   • JSON-RPC 2.0    │  │   • Bot protection  │     │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                  │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│   │   Pod Credits API   │  │   CoinGecko API     │  │   IP Geolocation    │     │
│   │   ─────────────     │  │   ───────────       │  │   ──────────────    │     │
│   │   • Credit balances │  │   • Token price     │  │   • ip-api.com      │     │
│   │   • Reward tracking │  │   • Market data     │  │   • ipapi.co        │     │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SCHEDULED JOBS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │                    GitHub Actions Cron (Every 5 min)                 │       │
│   │   ─────────────────────────────────────────────────────────────     │       │
│   │   • Triggers POST /api/sync-nodes                                    │       │
│   │   • Saves all node snapshots to MongoDB                              │       │
│   │   • Logs events (status changes, version updates, etc.)              │       │
│   └─────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│  API Route  │────▶│  External  │
│   Client    │     │   SSR/CSR   │     │   Handler   │     │    APIs     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                   │                   │
       │                   │                   ▼                   │
       │                   │            ┌─────────────┐            │
       │                   │            │  MongoDB    │◀───────────┘
       │                   │            │  (History)  │
       │                   │            └─────────────┘
       │                   ▼                   │
       │            ┌─────────────┐            │
       └────────────│ React Query │◀───────────┘
                    │   Cache     │
                    └─────────────┘


┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  GitHub     │────▶│ /api/sync-  │────▶│  MongoDB    │
│  Actions    │     │   nodes     │     │  (Persist)  │
│  (5 min)    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Request Flow: Node Profile Page

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           NODE PROFILE REQUEST FLOW                           │
└──────────────────────────────────────────────────────────────────────────────┘

1. User clicks node in table
         │
         ▼
┌─────────────────┐
│  CaptchaGate    │ ◀── Cloudflare Turnstile verification
│  Component      │     (skipped on localhost)
└─────────────────┘
         │
         ▼ (on success)
┌─────────────────┐
│  /api/verify-   │ ◀── Server-side token validation
│  turnstile      │
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  /api/node-     │────▶│  Xandeum RPC    │ ◀── Current node data
│  profile        │     └─────────────────┘
│                 │     ┌─────────────────┐
│                 │────▶│  MongoDB        │ ◀── Historical snapshots
│                 │     └─────────────────┘
│                 │     ┌─────────────────┐
│                 │────▶│  IP Geolocation │ ◀── Location data
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  NodeProfile    │ ◀── Renders profile with charts,
│  Client         │     events, and location map
└─────────────────┘
```

## API Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              API ENDPOINTS                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PUBLIC ENDPOINTS (No Auth Required)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GET /api/nodes                                                              │
│  ├── Fetches all nodes from Xandeum RPC                                     │
│  ├── Returns: { nodes: [...], total: number }                               │
│  └── Caching: React Query (30s stale time)                                  │
│                                                                              │
│  GET /api/node-profile?ip={ip}&hours={hours}                                │
│  ├── Fetches node details + historical data                                 │
│  ├── Sources: RPC (current) + MongoDB (history)                             │
│  └── Protected by: Cloudflare Turnstile CAPTCHA                             │
│                                                                              │
│  GET /api/pod-credits                                                        │
│  ├── Fetches credit balances from Pod Credits API                           │
│  └── Returns: { credits: [...] }                                            │
│                                                                              │
│  GET /api/xand-info                                                          │
│  ├── Fetches XAND token data from CoinGecko                                 │
│  └── Caching: 5-minute cooldown                                             │
│                                                                              │
│  GET /api/db-status                                                          │
│  └── Returns MongoDB connection status                                       │
│                                                                              │
│  POST /api/rpc                                                               │
│  ├── Proxies JSON-RPC calls to Xandeum network                              │
│  └── Hides backend RPC endpoints from client                                │
│                                                                              │
│  POST /api/verify-turnstile                                                  │
│  ├── Validates Cloudflare Turnstile tokens                                  │
│  └── Returns: { success: boolean }                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PROTECTED ENDPOINTS (Auth Required)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /api/sync-nodes                                                        │
│  ├── Header: Authorization: Bearer {CRON_SECRET}                            │
│  ├── Syncs all nodes to MongoDB                                             │
│  ├── Logs events (status changes, version updates)                          │
│  └── Called by: GitHub Actions (every 5 min)                                │
│                                                                              │
│  GET /api/sync-nodes?action=init                                            │
│  └── Initializes MongoDB indexes (run once)                                 │
│                                                                              │
│  GET /api/sync-nodes?action=sync                                            │
│  └── Manual sync for testing                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MONGODB COLLECTIONS                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Collection: node_snapshots                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  {                                                                           │
│    _id: ObjectId,                                                            │
│    ip: string,                    // Node IP address (indexed)               │
│    pubkey: string,                // Node public key                         │
│    address: string,               // Full address (ip:port)                  │
│    status: string,                // "online" | "offline" | "syncing"        │
│    uptime: number,                // Uptime in seconds                       │
│    storage_committed: number,     // Storage in bytes                        │
│    storage_used: number,          // Used storage in bytes                   │
│    storage_usage_percent: number, // Usage percentage                        │
│    version: string,               // Node version                            │
│    credits: number,               // Current credits                         │
│    timestamp: number,             // Unix timestamp (indexed)                │
│    created_at: Date               // ISO date                                │
│  }                                                                           │
│                                                                              │
│  Indexes: { ip: 1 }, { timestamp: -1 }, { ip: 1, timestamp: -1 }            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Collection: node_events                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  {                                                                           │
│    _id: ObjectId,                                                            │
│    ip: string,                    // Node IP address (indexed)               │
│    pubkey: string,                // Node public key                         │
│    event_type: string,            // Event type (see below)                  │
│    previous_value: mixed,         // Previous value (optional)               │
│    new_value: mixed,              // New value (optional)                    │
│    previous_status: string,       // For status changes                      │
│    new_status: string,            // For status changes                      │
│    details: object,               // Additional event details                │
│    timestamp: number,             // Unix timestamp (indexed)                │
│    created_at: Date               // ISO date                                │
│  }                                                                           │
│                                                                              │
│  Event Types:                                                                │
│  • node_new        - New node discovered                                     │
│  • node_online     - Node came online                                        │
│  • node_offline    - Node went offline                                       │
│  • status_change   - Status changed (online/offline/syncing)                 │
│  • version_change  - Node version updated                                    │
│  • storage_change  - Storage changed by >5%                                  │
│  • credits_change  - Credits changed by >100                                 │
│                                                                              │
│  Indexes: { ip: 1 }, { timestamp: -1 }, { event_type: 1 }                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT HIERARCHY                                 │
└──────────────────────────────────────────────────────────────────────────────┘

RootLayout
│
├── AppCaptchaGate (App-wide CAPTCHA, session-based)
│   │
│   └── DashboardLayout
│       │
│       ├── Navbar
│       │   ├── Logo (Link to home)
│       │   ├── Navigation Links
│       │   ├── NetworkSelector (Mainnet/Devnet)
│       │   ├── LiveRefresh (30s auto-refresh)
│       │   └── Mobile Menu (hamburger)
│       │
│       ├── Breadcrumb
│       │
│       ├── Page Content
│       │   │
│       │   ├── Analytics (/)
│       │   │   ├── StatsCards
│       │   │   ├── VersionCard
│       │   │   └── Charts
│       │   │
│       │   ├── pNodes (/nodes)
│       │   │   ├── SearchBar
│       │   │   ├── NodesTable (virtualized)
│       │   │   └── Pagination
│       │   │
│       │   ├── Network (/network)
│       │   │   ├── InteractiveMap (Leaflet)
│       │   │   ├── StatsOverlay
│       │   │   └── CountryCards
│       │   │
│       │   ├── Leaderboard (/leaderboard)
│       │   │   ├── NetworkSwitch
│       │   │   └── LeaderboardTable
│       │   │
│       │   ├── Node Profile (/profile/[ip])
│       │   │   ├── CaptchaGate (strict, per-visit)
│       │   │   ├── ProfileHeader
│       │   │   ├── StatsCards
│       │   │   ├── Charts (uptime, credits, storage)
│       │   │   ├── EventsTable
│       │   │   └── LocationMap
│       │   │
│       │   └── About (/about-xandash)
│       │       └── GSAP ScrollTrigger animations
│       │
│       └── Footer
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 1: CAPTCHA Protection                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  AppCaptchaGate │────▶│  TurnstileWidget│────▶│  Cloudflare     │        │
│  │  (session-based)│     │  (generates     │     │  Verification   │        │
│  │                 │     │   token)        │     │                 │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐                                │
│  │  CaptchaGate    │────▶│  Per-visit      │ ◀── Node profiles require      │
│  │  (strict mode)  │     │  verification   │     fresh CAPTCHA each time    │
│  └─────────────────┘     └─────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 2: API Security                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • Environment Variables: All secrets stored server-side only                │
│  • RPC Proxy: Backend endpoints hidden from client                           │
│  • CRON_SECRET: Protects sync endpoint from unauthorized access              │
│  • Input Validation: All user inputs sanitized                               │
│  • HTTPS: All communications encrypted                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Rate Limiting                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • React Query: Client-side caching (30s stale time)                         │
│  • Token Data: 5-minute refresh cooldown                                     │
│  • Geolocation: 24-hour cache per IP                                         │
│  • Vercel: Built-in DDoS protection                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Environment Variables

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENT CONFIGURATION                              │
│                        (Never commit actual values!)                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Server-Side Only (not exposed to client)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RPC_ENDPOINT_PRIMARY      - Primary Xandeum RPC endpoint                    │
│  RPC_BASE_URL              - Base URL for RPC calls                          │
│  MONGODB_URI               - MongoDB connection string                       │
│  MONGODB_DB_NAME           - Database name                                   │
│  TURNSTILE_SECRET_KEY      - Cloudflare Turnstile secret                     │
│  CRON_SECRET               - Secret for cron job authentication              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Client-Side (NEXT_PUBLIC_ prefix)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NEXT_PUBLIC_TURNSTILE_SITE_KEY    - Cloudflare Turnstile site key          │
│  NEXT_PUBLIC_COINGECKO_API_URL     - CoinGecko API endpoint                 │
│  NEXT_PUBLIC_POD_CREDITS_URL       - Pod credits API endpoint               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT FLOW                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Vercel    │────▶│   Build     │────▶│  Deploy     │
│   Push      │     │   Webhook   │     │   (Next.js) │     │  (Edge)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                    Vercel Edge Network              │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
                    │  │   Static    │  │  Serverless │  │    Edge     │ │
                    │  │   Assets    │  │  Functions  │  │   Runtime   │ │
                    │  └─────────────┘  └─────────────┘  └─────────────┘ │
                    └─────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GitHub    │────▶│   Actions   │────▶│  /api/sync  │
│   Schedule  │     │   Runner    │     │   -nodes    │
│  (5 min)    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Server components for SEO, API routes for backend |
| **MongoDB Atlas** | Persistent storage, free tier, global distribution |
| **React Query** | Intelligent caching, background refetching |
| **GitHub Actions Cron** | Free, reliable, 5-minute intervals |
| **Cloudflare Turnstile** | Invisible CAPTCHA, better UX than reCAPTCHA |
| **Leaflet Maps** | Open source, customizable, no API key required |
| **Custom SVG Icons** | Smaller bundle, no external dependencies |
| **GSAP Animations** | Smooth scroll animations, performant |
