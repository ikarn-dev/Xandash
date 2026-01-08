# XanDash Architecture

## Overview

XanDash is a real-time monitoring dashboard built with Next.js 16, following a modern serverless architecture optimized for performance and scalability. It supports both Mainnet and Devnet networks.

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
│   │    Node      │  │   Country    │  │  Governance  │  │    Node      │        │
│   │   Profile    │  │    Page      │  │    Page      │  │   Compare    │        │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │              Network Context (Mainnet/Devnet Switcher)               │       │
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
│   │  /api/node-  │  │ /api/geo-    │  │ /api/        │  │ /api/sync-   │        │
│   │   history    │  │  location    │  │  governance  │  │    nodes     │        │
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
│   │   • node_snapshots  │  │   • Devnet RPC      │  │   ───────────       │     │
│   │   • node_events     │  │   • Mainnet RPC     │  │   • Token verify    │     │
│   │   • Historical data │  │   • Governance RPC  │  │   • Bot protection  │     │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                  │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│   │   Pod Credits API   │  │   CoinGecko API     │  │   IP Geolocation    │     │
│   │   ─────────────     │  │   ───────────       │  │   ──────────────    │     │
│   │   • Devnet credits  │  │   • Token price     │  │   • ip-api.com      │     │
│   │   • Mainnet credits │  │   • Market data     │  │   • Batch lookup    │     │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Node Compare Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           NODE COMPARE FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

1. Page Load - Pre-fetch all node data
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  /api/nodes     │────▶│  Store in       │
│  (all nodes)    │     │  React State    │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  /api/pod-      │────▶│  Merge credits  │
│  credits        │     │  with nodes     │
└─────────────────┘     └─────────────────┘

2. User selects nodes (up to 4)
         │
         ▼
3. Click "Compare" button
         │
         ▼
┌─────────────────┐
│  Build profiles │ ◀── INSTANT (uses pre-fetched data)
│  from state     │     • IP, pubkey, status
└─────────────────┘     • uptime, credits, storage, version
         │
         ▼
┌─────────────────┐
│  Show Results   │ ◀── Immediate display
│  View           │
└─────────────────┘
         │
         ▼ (background)
┌─────────────────┐     ┌─────────────────┐
│  /api/node-     │────▶│  Update charts  │
│  history        │     │  with history   │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  /api/geo-      │────▶│  Update         │
│  location       │     │  locations      │
│  (batch POST)   │     │                 │
└─────────────────┘     └─────────────────┘
```

## Leaderboard Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           LEADERBOARD SYSTEM                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Data Sources                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /api/nodes ──────────────────┐                                             │
│  • uptime                     │                                             │
│  • storage_committed          ├──▶ Merged Data ──▶ Sorted by criteria       │
│  • storage_used               │                                             │
│  • address (IP:PORT)          │                                             │
│                               │                                             │
│  /api/pod-credits ────────────┘                                             │
│  • credits per pod_id                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Leaderboard Tabs                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  CREDITS    │  │   UPTIME    │  │   STORAGE   │                          │
│  │  ─────────  │  │  ─────────  │  │  ─────────  │                          │
│  │  Sorted by  │  │  Sorted by  │  │  Sorted by  │                          │
│  │  credits    │  │  uptime     │  │  storage_   │                          │
│  │             │  │  (seconds)  │  │  committed  │                          │
│  │  + Tier     │  │             │  │             │                          │
│  │  badges     │  │             │  │             │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
│                                                                              │
│  Tier System (Credits only):                                                 │
│  • Diamond:  ≥50,000 credits                                                │
│  • Platinum: ≥25,000 credits                                                │
│  • Gold:     ≥10,000 credits                                                │
│  • Silver:   ≥5,000 credits                                                 │
│  • Bronze:   <5,000 credits                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Governance Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           GOVERNANCE FLOW                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  /api/governance│
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Sequential RPC Batching (to avoid rate limits)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Fetch all proposal accounts                                              │
│  2. Batch decode (5 at a time with delays)                                  │
│  3. bs58 decode addresses for accurate comparison                           │
│  4. Fetch treasury balance                                                   │
│  5. Return combined data                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Treasury Tab                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  • Real-time SOL price from CoinGecko                                       │
│  • Exact token amounts (no abbreviation)                                    │
│  • formatExactNumber for thousand separators                                │
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
├── NetworkProvider (Mainnet/Devnet context)
│   │
│   └── DashboardLayout
│       │
│       ├── Navbar
│       │   ├── Logo
│       │   ├── Navigation Links
│       │   ├── Utilities Dropdown (Compare, XAND, STOINC, Endpoints)
│       │   ├── NetworkSelector (Mainnet/Devnet)
│       │   └── LiveRefresh (30s auto-refresh)
│       │
│       ├── Marquee (announcements banner)
│       │
│       ├── Page Content
│       │   │
│       │   ├── Compare (/compare)
│       │   │   ├── NodeSelector (multi-select with checkboxes)
│       │   │   ├── CompareButton
│       │   │   └── ResultsView
│       │   │       ├── Node Cards
│       │   │       ├── Comparison Table
│       │   │       └── ComparisonChart (x4)
│       │   │
│       │   ├── Leaderboard (/leaderboard)
│       │   │   ├── LeaderboardTabs (Credits, Uptime, Storage)
│       │   │   ├── RankingTable
│       │   │   └── BookmarksTable
│       │   │
│       │   ├── Governance (/governance)
│       │   │   ├── ProposalsTab
│       │   │   ├── TreasuryTab
│       │   │   └── VotingTab
│       │   │
│       │   └── ... other pages
│       │
│       └── Footer
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
│    created_at: Date,              // ISO date                                │
│    network: string                // "devnet" | "mainnet"                    │
│  }                                                                           │
│                                                                              │
│  Indexes: { ip: 1, network: 1 }, { timestamp: -1 }                          │
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
│    timestamp: number,             // Unix timestamp (indexed)                │
│    created_at: Date,              // ISO date                                │
│    network: string                // "devnet" | "mainnet"                    │
│  }                                                                           │
│                                                                              │
│  Event Types:                                                                │
│  • node_new        - New node discovered                                     │
│  • node_online     - Node came online                                        │
│  • node_offline    - Node went offline                                       │
│  • status_change   - Status changed                                          │
│  • version_change  - Node version updated                                    │
│  • storage_change  - Storage changed by >5%                                  │
│  • credits_change  - Credits changed by >100                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Pre-fetched Data for Compare** | Instant comparison results without API calls |
| **Parallel API Fetching** | Promise.all for concurrent requests |
| **Batch Geolocation** | Single POST request for multiple IPs |
| **Sequential RPC for Governance** | Avoid rate limiting on governance RPC |
| **Network Context** | Global state for Mainnet/Devnet switching |
| **LocalStorage Bookmarks** | Per-network bookmark persistence |
| **Custom SVG Charts** | Lightweight, no external chart library for comparison |
