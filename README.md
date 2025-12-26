# XanDash - Xandeum Network Dashboard

<div align="center">

![XanDash](public/logo/xandash.png)

**Real-time monitoring dashboard for the Xandeum pNode network**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Live Demo](https://xandash.vercel.app) · [Documentation](https://docs.xandeum.network) · [Xandeum Network](https://www.xandeum.network)

</div>

---

## Overview

XanDash is a comprehensive monitoring dashboard for the Xandeum decentralized storage network. It provides real-time insights into pNode performance, network statistics, and token information.

## Features

- **Real-time pNode Monitoring** - Track 265+ nodes with live status updates every 30 seconds
- **Interactive Network Map** - Visualize global node distribution across 38+ locations
- **Node Profiles** - Detailed performance metrics, uptime history, and response times
- **Leaderboard** - Rankings based on pod credits and node performance
- **Token Analytics** - Live XAND token price, market cap, and 24h charts via CoinGecko
- **Country Analytics** - Node distribution and statistics by country
- **Endpoint Testing** - Built-in RPC endpoint health checker

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Maps**: Leaflet
- **State Management**: React Hooks
- **API**: REST with JSON-RPC proxy

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

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
# RPC Endpoints (contact Xandeum team for access)
RPC_ENDPOINT_PRIMARY=your_primary_rpc_endpoint
RPC_ENDPOINT_FALLBACK=your_fallback_rpc_endpoint

# CoinGecko API
NEXT_PUBLIC_COINGECKO_API_URL=https://api.coingecko.com/api/v3/coins/xandeum
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key

# Geolocation
NEXT_PUBLIC_IP_API_COM_URL=http://ip-api.com

# Pod Credits
NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL=your_pod_credits_api_url
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # Documentation page
│   ├── api/               # API routes
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
└── libs/
    ├── cache/             # Local caching system
    ├── hooks/             # Custom React hooks
    ├── server/            # Server-side utilities
    └── services/          # External service integrations
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/nodes` | Get all pNodes with stats |
| `/api/node-profile` | Get detailed node profile |
| `/api/node-response-times` | Batch response time checks |
| `/api/pod-credits` | Get pod credits data |
| `/api/xand-info` | Get XAND token info |
| `/api/rpc` | JSON-RPC proxy |

## High-Level Design (HLD)

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │  Dashboard  │  │   pNodes    │  │   Network   │  │ Leaderboard │       │
│   │    Page     │  │    Page     │  │     Map     │  │    Page     │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
│   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐       │
│   │   Profile   │  │   Country   │  │  Endpoints  │  │    XAND     │       │
│   │    Page     │  │    Page     │  │    Page     │  │    Page     │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS API LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │ /api/nodes  │  │/api/node-   │  │ /api/pod-   │  │ /api/xand-  │       │
│   │             │  │  profile    │  │   credits   │  │    info     │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
│   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴────────────────┴──────┐       │
│   │  /api/rpc   │  │/api/node-   │  │        Local Cache           │       │
│   │   (proxy)   │  │response-time│  │     (In-Memory LRU)          │       │
│   └─────────────┘  └─────────────┘  └──────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│   │   Xandeum RPC       │  │    Pod Credits      │  │    CoinGecko     │   │
│   │   (Primary +        │  │       API           │  │       API        │   │
│   │    Fallback)        │  │                     │  │                  │   │
│   └─────────────────────┘  └─────────────────────┘  └──────────────────┘   │
│                                                                             │
│   ┌─────────────────────┐  ┌─────────────────────┐                         │
│   │   IP Geolocation    │  │    Map Tiles        │                         │
│   │   (ip-api.com)      │  │   (CartoDB CDN)     │                         │
│   └─────────────────────┘  └─────────────────────┘                         │
│                                                                             │
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
       │                    │             │    Cache     │            │
       │                    │             │   (LRU)      │◀───────────┘
       │                    │             └──────────────┘
       │                    ▼                    │
       │             ┌──────────────┐            │
       └─────────────│    React     │◀───────────┘
                     │    State     │
                     └──────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DashboardLayout                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Navbar                                │  │
│  │  [Logo] [Analytics] [pNodes] [Network] [Leaderboard] ...  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Breadcrumb                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                    Page Content                           │  │
│  │                                                           │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│  │  │  StatCard   │ │  StatCard   │ │  StatCard   │         │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────┐         │  │
│  │  │              DataTable / Map                 │         │  │
│  │  └─────────────────────────────────────────────┘         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Footer                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Server components for SEO, API routes for backend logic |
| **In-Memory Cache** | Fast access, no external dependencies, LRU eviction |
| **RPC Failover** | Primary + fallback endpoints for high availability |
| **30s Auto-Refresh** | Balance between real-time data and API rate limits |
| **Client-Side Geolocation** | Batch IP lookups to reduce API calls |
| **Duplicate Detection** | Dedup by pubkey + address for accurate node counts |

### Security Considerations

- API keys stored in environment variables
- No sensitive data exposed to client
- Rate limiting via caching layer
- Input validation on all API endpoints
- CORS configured for API routes

### Performance Optimizations

- **Caching**: LRU cache with TTL for API responses
- **Lazy Loading**: Maps and charts loaded on demand
- **Batch Requests**: Geolocation fetched in batches
- **Deduplication**: Node data deduplicated server-side
- **Skeleton Loading**: UI feedback during data fetches

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/xandash)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Build

```bash
npm run build
npm start
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
