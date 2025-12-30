# XanDash - Xandeum Network Dashboard

<div align="center">

![XanDash](public/logo/xandash.png)

**Real-time monitoring dashboard for the Xandeum pNode network**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)

[Live Demo](https://xandash.vercel.app) · [Documentation](https://docs.xandeum.network) · [Xandeum Network](https://www.xandeum.network)

</div>

---

## Overview

XanDash is a comprehensive monitoring dashboard for the Xandeum decentralized storage network. It provides real-time insights into pNode performance, network statistics, historical data tracking, and AI-powered analytics.

## Features

- **Real-time pNode Monitoring** - Track 265+ nodes with live status updates every 30 seconds
- **Interactive Network Map** - Visualize global node distribution across 38+ locations
- **Node Profiles** - Detailed performance metrics, uptime history, and event logs
- **Historical Data** - MongoDB-powered snapshots and trend analysis
- **AI Assistant** - Intelligent chatbot for network analysis and insights (Gemini/Llama)
- **Leaderboard** - Rankings based on pod credits and node performance
- **Token Analytics** - Live XAND token price, market cap, and 24h charts via CoinGecko
- **Country Analytics** - Node distribution and statistics by country
- **Endpoint Testing** - Built-in RPC endpoint health checker
- **Auto-Sync** - Automatic data synchronization every 30 seconds via Vercel Cron

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **AI**: OpenRouter (Gemini 2.0 Flash, Llama 3.1, Mistral)
- **Charts**: Recharts
- **Maps**: Leaflet
- **State Management**: React Hooks
- **API**: REST with JSON-RPC proxy
- **Deployment**: Vercel with Cron Jobs

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- MongoDB Atlas account (free tier works)
- OpenRouter API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/xandash.git
cd xandash

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# RPC Endpoints
RPC_ENDPOINT_PRIMARY=http://161.97.97.41:6000/rpc
RPC_BASE_URL=http://161.97.97.41:6000
GEO_HISTORY_API_URL=http://161.97.97.41:6000

# CoinGecko API
NEXT_PUBLIC_COINGECKO_API_URL=https://api.coingecko.com/api/v3/coins/xandeum
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key

# Geolocation
NEXT_PUBLIC_IP_API_COM_URL=http://ip-api.com
NEXT_PUBLIC_IPAPI_CO_URL=https://ipapi.co

# Pod Credits
NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL=https://podcredits.xandeum.network/api/pods-credits

# MongoDB (Required for historical data)
MONGODB_URI=mongodb+srv:mongodb url
appName=xandash
MONGODB_DB_NAME=xandash

# OpenRouter AI (Required for AI Assistant)
OPENROUTER_API_KEY=sk-or-v1-your-api-key

# Cron Secret (Optional - for Vercel cron security)
CRON_SECRET=your-secret-key
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # Documentation page
│   ├── api/               # API routes
│   │   ├── ai-chat/       # AI Assistant endpoint
│   │   ├── db-status/     # Database status check
│   │   ├── node-profile/  # Node profile data
│   │   ├── nodes/         # All nodes listing
│   │   ├── pod-credits/   # Pod credits data
│   │   ├── sync-nodes/    # Auto-sync endpoint (Cron)
│   │   └── xand-info/     # Token information
│   ├── country/[code]/    # Country profile pages
│   ├── endpoints/         # Endpoint testing page
│   ├── leaderboard/       # Leaderboard page
│   ├── network/           # Network map page
│   ├── nodes/             # pNodes listing page
│   ├── profile/[ip]/      # Node profile pages
│   └── xand/              # Token info page
├── components/
│   ├── dashboard/         # Dashboard cards and widgets
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/                # Reusable UI components
│       └── AIAssistant.tsx # Floating AI chat widget
└── libs/
    ├── cache/             # Local caching system
    ├── db/                # MongoDB integration
    │   ├── mongodb.ts     # Database connection
    │   └── node-service.ts # Node data operations
    ├── hooks/             # Custom React hooks
    ├── server/            # Server-side utilities
    └── services/          # External service integrations
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | Get all pNodes with stats |
| `/api/node-profile` | GET | Get detailed node profile with history |
| `/api/node-response-times` | GET | Batch response time checks |
| `/api/pod-credits` | GET | Get pod credits data |
| `/api/xand-info` | GET | Get XAND token info |
| `/api/rpc` | POST | JSON-RPC proxy |
| `/api/sync-nodes` | POST | Sync all nodes to MongoDB (Cron) |
| `/api/sync-nodes?action=init` | GET | Initialize database indexes |
| `/api/sync-nodes?action=sync` | GET | Manual single sync |
| `/api/ai-chat` | POST | AI Assistant chat endpoint |
| `/api/db-status` | GET | Check MongoDB connection status |

## MongoDB Schema

### Node Snapshots
Stores periodic snapshots of all node data:
```typescript
{
  ip: string;
  pubkey: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  credits: number;
  active_streams: number;
  timestamp: number;
  created_at: Date;
}
```

### Node Events
Tracks all node state changes:
```typescript
{
  ip: string;
  pubkey: string;
  event_type: 'node_new' | 'node_online' | 'node_offline' | 
              'status_change' | 'version_change' | 
              'storage_change' | 'credits_change';
  previous_value?: string | number;
  new_value?: string | number;
  previous_status?: string;
  new_status?: string;
  details?: Record<string, any>;
  timestamp: number;
  created_at: Date;
}
```

## AI Assistant

The floating AI assistant (bottom-right corner) provides intelligent analysis:

- **Network Overview** - Real-time stats on nodes, storage, uptime
- **Node Analysis** - Detailed analysis of specific nodes by IP
- **Credits Insights** - Top earners and credit distribution
- **Historical Trends** - Event history and status changes
- **Health Checks** - Identify offline nodes and issues

### AI Models (with automatic fallback)
1. **Primary**: Google Gemini 2.0 Flash
2. **Fallback 1**: Meta Llama 3.1 8B
3. **Fallback 2**: Mistral 7B

## Auto-Sync System

XanDash automatically syncs node data to MongoDB every 30 seconds:

1. **Vercel Cron** triggers `/api/sync-nodes` every minute
2. **Sync endpoint** runs twice with 30s delay (effective 30s intervals)
3. **Data saved**: All node metrics + credits
4. **Events logged**: Status changes, version updates, storage changes (>5%), credit changes (>100)

### Manual Sync
```bash
# Initialize indexes (run once)
curl "https://your-domain.vercel.app/api/sync-nodes?action=init"

# Manual sync
curl "https://your-domain.vercel.app/api/sync-nodes?action=sync"
```

## High-Level Design (HLD)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │  Dashboard  │  │   pNodes    │  │   Network   │  │ Leaderboard │       │
│   │    Page     │  │    Page     │  │     Map     │  │    Page     │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Profile   │  │   Country   │  │  Endpoints  │  │    XAND     │       │
│   │    Page     │  │    Page     │  │    Page     │  │    Page     │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    AI Assistant (Floating Widget)                │      │
│   └─────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS API LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │ /api/nodes  │  │/api/node-   │  │ /api/pod-   │  │ /api/xand-  │       │
│   │             │  │  profile    │  │   credits   │  │    info     │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │/api/ai-chat │  │/api/sync-   │  │  /api/rpc   │  │ Local Cache │       │
│   │  (Gemini)   │  │   nodes     │  │   (proxy)   │  │  (LRU)      │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA & EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│   │   MongoDB Atlas     │  │   Xandeum RPC       │  │    OpenRouter    │   │
│   │   (Snapshots &      │  │   (Primary +        │  │   (AI Models)    │   │
│   │    Events)          │  │    Fallback)        │  │                  │   │
│   └─────────────────────┘  └─────────────────────┘  └──────────────────┘   │
│                                                                             │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│   │    Pod Credits      │  │    CoinGecko        │  │   IP Geolocation │   │
│   │       API           │  │       API           │  │   (ip-api.com)   │   │
│   └─────────────────────┘  └─────────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VERCEL CRON JOBS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │  Every minute: POST /api/sync-nodes                              │      │
│   │  - Fetches all nodes from RPC                                    │      │
│   │  - Fetches credits data                                          │      │
│   │  - Saves snapshots to MongoDB                                    │      │
│   │  - Logs events (status changes, version updates, etc.)           │      │
│   │  - Runs twice with 30s delay for effective 30s intervals         │      │
│   └─────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│   Next.js    │────▶│   API Route  │────▶│   External   │
│   Browser    │     │    Client    │     │   Handler    │     │     API      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       ▲                    │                    │                    │
       │                    │                    ▼                    │
       │                    │             ┌──────────────┐            │
       │                    │             │   MongoDB    │◀───────────┘
       │                    │             │  (History)   │
       │                    │             └──────────────┘
       │                    ▼                    │
       │             ┌──────────────┐            │
       └─────────────│    React     │◀───────────┘
                     │    State     │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Vercel Cron  │────▶│ /api/sync-   │────▶│   MongoDB    │
│  (1 min)     │     │    nodes     │     │  (Persist)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Server components for SEO, API routes for backend logic |
| **MongoDB Atlas** | Persistent storage for historical data, free tier available |
| **OpenRouter AI** | Multi-model support with automatic fallback |
| **Vercel Cron** | Serverless scheduled tasks, no infrastructure needed |
| **In-Memory Cache** | Fast access for frequently requested data |
| **30s Auto-Refresh** | Balance between real-time data and API rate limits |
| **Event Logging** | Track node lifecycle for trend analysis |

### Security Considerations

- API keys stored in environment variables
- No sensitive data exposed to client
- Rate limiting via caching layer
- Input validation on all API endpoints
- CORS configured for API routes
- Cron endpoint protected with secret header

### Performance Optimizations

- **Caching**: LRU cache with TTL for API responses
- **MongoDB Indexes**: Optimized queries for IP and timestamp
- **Lazy Loading**: Maps and charts loaded on demand
- **Batch Requests**: Geolocation fetched in batches
- **Streaming**: AI responses streamed for faster UX
- **Skeleton Loading**: UI feedback during data fetches

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/xandash)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Cron jobs auto-configured via `vercel.json`

### Manual Build

```bash
npm run build
npm start
```

### Post-Deployment Setup

```bash
# Initialize MongoDB indexes
curl "https://your-domain.vercel.app/api/sync-nodes?action=init"
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Links

- [Xandeum Website](https://www.xandeum.network)
- [Documentation](https://docs.xandeum.network)
- [Twitter/X](https://x.com/Xandeum)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ for the Xandeum community
</div>
