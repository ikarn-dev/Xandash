# XanDash - Xandeum Network Dashboard

<div align="center">

![XanDash](public/logo/xandash.png)

**Real-time monitoring dashboard for the Xandeum pNode network**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)

[Live Demo](https://xandash.vercel.app) · [Documentation](https://xandash.vercel.app/docs) · [Xandeum Network](https://www.xandeum.network)

</div>

---

## Overview

XanDash is a comprehensive monitoring dashboard for the Xandeum decentralized storage network. It provides real-time insights into pNode performance, network statistics, historical data tracking, governance monitoring, and detailed analytics for both Mainnet and Devnet.

## Features

### Core Features
- **Real-time pNode Monitoring** - Track 265+ nodes with live status updates every 30 seconds
- **Dual Network Support** - Full support for both Mainnet and Devnet with network switcher
- **Interactive Network Map** - Visualize global node distribution across 38+ locations using Leaflet
- **Node Profiles** - Detailed performance metrics, uptime history, and event logs

### Node Compare
- **Multi-Node Comparison** - Compare up to 4 nodes side by side
- **Quick Compare from Tables** - Select nodes directly from pNodes and Dashboard tables
- **Instant Results** - Uses pre-fetched data for immediate comparison
- **Historical Charts** - Credits, uptime, storage committed, and storage used trends
- **AI-Powered Analysis** - Automatic comparison summary with insights
- **Performance Metrics** - Side-by-side stats with "BEST" indicators

### Leaderboards
- **Multi-Criteria Rankings** - Separate leaderboards for Credits, Uptime, and Storage
- **Tier System** - Diamond, Platinum, Gold, Silver, Bronze tiers for Credits
- **Bookmarks** - Save and track your favorite nodes
- **Search & Pagination** - Find nodes quickly with search and pagination

### Governance
- **Proposal Tracking** - Monitor active and completed governance proposals
- **Treasury Overview** - Real-time treasury balance with SOL price conversion
- **Voting Stats** - Track voting participation and results

### Analytics
- **AI Assistant** - Chat with XanDash AI for node analysis and network insights
- **AI Node Summaries** - Automatic analysis on node profiles and comparisons
- **Token Analytics** - Live XAND token price, market cap, and 24h charts via CoinGecko
- **Country Analytics** - Node distribution and statistics by country
- **Network Stats** - Total storage, uptime averages, version distribution

### Tools
- **Endpoint Testing** - Built-in RPC endpoint health checker with Web Workers
- **XAND Calculator** - Token utility calculator
- **STOINC Rewards** - Staking rewards tracker

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | MongoDB Atlas |
| **State** | React Query (TanStack Query) |
| **Maps** | Leaflet |
| **Charts** | Recharts, Custom SVG |
| **Animations** | GSAP (ScrollTrigger) |
| **Security** | Cloudflare Turnstile |
| **Deployment** | Vercel |
| **Cron** | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- MongoDB Atlas account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/ikarn-dev/Xandash.git
cd xandash

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# RPC Endpoints
RPC_ENDPOINT_PRIMARY=http://161.97.97.41:6000/rpc
RPC_BASE_URL=http://161.97.97.41:6000

# CoinGecko API
NEXT_PUBLIC_COINGECKO_API_URL=https://api.coingecko.com/api/v3/coins/xandeum
NEXT_PUBLIC_COINGECKO_API_KEY=your_api_key

# Pod Credits
NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL=https://podcredits.xandeum.network/api/pods-credits
NEXT_PUBLIC_POD_CREDITS_MAINNET_URL=https://podcredits.xandeum.network/api/mainnet-pod-credits

# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB_NAME=xandash

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Cron Secret
CRON_SECRET=your-secure-random-string

# Governance RPC
GOVERNANCE_RPC_URL=your_governance_rpc_url
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── governance/    # Governance data API
│   │   ├── node-history/  # Historical node data
│   │   ├── node-profile/  # Node profile data
│   │   ├── nodes/         # All nodes listing
│   │   ├── pod-credits/   # Credits data
│   │   └── geolocation/   # IP geolocation batch API
│   ├── compare/           # Node comparison page
│   ├── governance/        # Governance tracking page
│   ├── leaderboard/       # Multi-criteria leaderboards
│   ├── network/           # Network map page
│   ├── nodes/             # pNodes listing page
│   └── profile/[ip]/      # Node profile pages
├── components/
│   ├── dashboard/         # Dashboard cards and widgets
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/                # Reusable UI components
└── libs/
    ├── db/                # MongoDB integration
    └── services/          # External service integrations
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design and data flow diagrams |
| [Tech Stack](docs/TECH_STACK.md) | Detailed technology overview |
| [API Reference](docs/API_REFERENCE.md) | API endpoints documentation |
| [Cron Setup](docs/CRON_SETUP.md) | GitHub Actions cron configuration |
| [CAPTCHA Setup](docs/CAPTCHA_SETUP.md) | Cloudflare Turnstile integration |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | Get all pNodes with stats |
| `/api/node-profile` | GET | Get detailed node profile with history |
| `/api/node-history` | GET | Get node historical data and events |
| `/api/pod-credits` | GET | Get pod credits data |
| `/api/governance` | GET | Get governance proposals and treasury |
| `/api/geolocation` | POST | Batch IP geolocation lookup |
| `/api/xand-info` | GET | Get XAND token info |
| `/api/sync-nodes` | POST | Sync all nodes to MongoDB |

## Recent Updates

### January 2026
- **AI-Powered Analysis** - AI summaries on node profiles and comparison results
- **Quick Compare from Tables** - Select nodes directly from pNodes and Dashboard tables
- **Node Compare** - Compare up to 4 nodes with instant results and historical charts
- **Multi-Leaderboards** - Separate rankings for Credits, Uptime, and Storage
- **Governance Tracking** - Monitor proposals, treasury, and voting
- **Performance Optimization** - Parallel API fetching, pre-loaded data for instant comparisons
- **Mainnet Support** - Full dual-network support with network switcher
- **Treasury Display** - Real-time SOL price conversion with exact token amounts
- **Discord Community** - Added Discord link in footer

### Previous Updates
- Cloudflare Turnstile CAPTCHA protection
- GSAP scroll animations on About page
- MongoDB sync optimization (~2s completion)
- GitHub Actions cron (every 5 minutes)
- Mobile-responsive navbar and tables

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ikarn-dev/Xandash)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Post-Deployment

```bash
# Initialize MongoDB indexes (run once)
curl "https://your-domain.vercel.app/api/sync-nodes?action=init"
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Submit a pull request

## Links

- [Xandeum Website](https://www.xandeum.network)
- [Xandeum Documentation](https://docs.xandeum.network)
- [Twitter/X](https://x.com/Xandeum)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for the Xandeum community
</div>
