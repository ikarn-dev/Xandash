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
│   ┌─────────────────────────────────────────────────────────────────────┐       │
│   │              AI Assistant (XanDash AI - Floating Chat)               │       │
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
│   ┌──────────────┐  ┌─────────────────────────────────────────────────────┐     │
│   │ /api/ai-chat │  │                    React Query Cache Layer           │     │
│   │  (OpenRouter)│  └─────────────────────────────────────────────────────┘     │
│   └──────────────┘                                                               │
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
<img width="2816" height="1536" alt="compare-flow" src="https://github.com/user-attachments/assets/04f9e03b-fe6c-4845-93dc-9a647b0d3449" />

```

## Leaderboard Architecture


<img width="2816" height="1536" alt="leaderboard-system" src="https://github.com/user-attachments/assets/f16edd4b-3744-4a0b-ab61-472b70b1b865" />
<img width="2816" height="1536" alt="leaderboard-uml" src="https://github.com/user-attachments/assets/ab4a3e43-309c-4e89-9a8f-d4e10dba5356" />


## Governance Data Flow

<img width="2816" height="1536" alt="governance-flow" src="https://github.com/user-attachments/assets/a50a74c5-d518-4714-9ae4-3f159453ddc1" />
<img width="2816" height="1536" alt="governnance-uml" src="https://github.com/user-attachments/assets/ccd9171b-a242-4bd8-9774-32612803e7d8" />


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
│       │   ├── Managers (/managers)
│       │   │   ├── ManagerList
│       │   │   └── ManagerProfile (/manager/[pubkey])
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
| **Quick Compare from Tables** | Select nodes directly from pNodes/Dashboard tables |
| **Parallel API Fetching** | Promise.all for concurrent requests |
| **Batch Geolocation** | Single POST request for multiple IPs |
| **Sequential RPC for Governance** | Avoid rate limiting on governance RPC |
| **Network Context** | Global state for Mainnet/Devnet switching |
| **LocalStorage Bookmarks** | Per-network bookmark persistence |
| **Custom SVG Charts** | Lightweight, no external chart library for comparison |
| **AI Streaming Responses** | Real-time text streaming for better UX |
| **Auto AI Summaries** | Automatic analysis on node profiles and comparisons |

## AI Integration


<img width="2816" height="1536" alt="ai-flow" src="https://github.com/user-attachments/assets/c41b11d8-ac96-46c4-92d9-a35afd3b47c0" />
<img width="2816" height="1536" alt="ai-uml" src="https://github.com/user-attachments/assets/42b24e90-2100-4bf8-aaa3-39af4b56f122" />

AI Summary Components:
• Node Profile Page - Auto-generates analysis on page load
• Compare Results - Auto-generates comparison summary after results
• AI Assistant - Floating chat for interactive queries

