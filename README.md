# XanDash - Xandeum Network Dashboard

<div align="center">

# **XANDASH**

**Real-time monitoring dashboard for the Xandeum pNode network**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-xandash.online-8A2BE2?style=for-the-badge&logo=vercel)](https://www.xandash.online)
[![GitHub Stars](https://img.shields.io/github/stars/ikarn-dev/Xandash?style=for-the-badge&logo=github&label=Stars)](https://github.com/ikarn-dev/Xandash)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
</div>


---

## Overview

XanDash is a comprehensive monitoring dashboard for the Xandeum decentralized storage network. It provides real-time insights into pNode performance, network statistics, historical data tracking, governance monitoring, and detailed analytics for both Mainnet and Devnet.

---

## Features

### Real-Time Monitoring
- **pNode Tracking** - Monitor all active nodes with live status updates every 30 seconds
- **Dual Network Support** - Full support for both Mainnet and Devnet with network switcher
- **Status Detection** - Online/Offline/Syncing status based on heartbeat mechanism
- **Node Score** - Performance scoring (0-100) based on uptime, storage, and online status

### Node Comparison
- **Multi-Node Compare** - Compare up to 4 nodes side by side
- **Quick Compare** - Select nodes directly from pNodes and Dashboard tables
- **Instant Results** - Uses pre-fetched data for immediate comparison
- **Historical Charts** - 7-day trends for credits, uptime, and storage
- **AI Analysis** - Automatic comparison summary with insights

### Leaderboards
- **Multi-Criteria Rankings** - Separate leaderboards for Credits, Uptime, and Storage
- **Tier System** - Diamond, Platinum, Gold, Silver, Bronze tiers (Credits only)
- **Bookmarks** - Save and track favorite nodes per network
- **Search & Pagination** - Find nodes quickly by IP or Pod ID

### Manager Profiles
- **Wallet Integration** - View manager profiles with XAND balance
- **NFT/SBT Tracking** - Display Titan, Genesis, and other NFT holdings
- **Fleet Overview** - Aggregated stats for all nodes under a manager
- **Onchain Data** - Data fetched from Helius API

### Governance
- **Proposal Tracking** - Monitor active and completed proposals
- **Treasury Overview** - Real-time balance with SOL price conversion
- **Voting Stats** - Track participation and results

### Analytics
- **AI Assistant** - Chat with XanDash AI for network insights
- **AI Node Summaries** - Automatic analysis on node profiles
- **Token Analytics** - Live XAND price via CoinGecko API
- **Country Analytics** - Node distribution by country
- **VPS Provider Stats** - Statistics by hosting provider
- **Version Distribution** - Node software version breakdown

### Network Map
- **Interactive Globe** - Leaflet-powered world map
- **Node Markers** - Click for node details
- **Country Pages** - Detailed stats per country

### Tools
- **Endpoint Testing** - RPC endpoint health checker with Web Workers
- **STOINC Calculator** - Storage incentive rewards calculator
- **RPC Tester** - Direct JSON-RPC method testing

### Notifications
- **Node Alerts** - Real-time notifications when nodes go offline, come back online, or change status
- **Dual Delivery** - Alerts via Email (Resend) and Telegram Bot
- **Email OTP Auth** - Passwordless login with email verification
- **Smart Throttling** - Only sends alerts for significant events
- **Test Notifications** - Verify configuration before going live

---

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
| **Cron** | GitHub Actions (every 5 min) |
| **AI** | OpenRouter API (Gemini/Llama/Mistral) |

---

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
RPC_ENDPOINT_PRIMARY=http://<pnodeip>:6000/rpc
RPC_BASE_URL=http://<pnodeip>:6000

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

# Helius API (Manager Data)
HELIUS_API_KEY=your_helius_api_key

# OpenRouter API (AI)
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai-chat/       # AI assistant endpoint
│   │   ├── governance/    # Governance data API
│   │   ├── node-history/  # Historical node data
│   │   ├── node-profile/  # Node profile data
│   │   ├── nodes/         # All nodes listing
│   │   ├── pod-credits/   # Credits data
│   │   ├── geolocation/   # IP geolocation batch API
│   │   └── sync-nodes/    # MongoDB sync (cron)
│   ├── compare/           # Node comparison page
│   ├── country/[code]/    # Country detail pages
│   ├── docs/              # Documentation page
│   ├── governance/        # Governance tracking
│   ├── leaderboard/       # Multi-criteria leaderboards
│   ├── manager/[pubkey]/  # Manager profile pages
│   ├── managers/          # Managers listing
│   ├── network/           # Network map page
│   ├── nodes/             # pNodes listing page
│   ├── profile/[ip]/      # Node profile pages
│   ├── stoinc/            # STOINC calculator
│   └── xand/              # XAND token info
├── components/
│   ├── dashboard/         # Dashboard cards and widgets
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/                # Reusable UI components
└── libs/
    ├── db/                # MongoDB integration
    ├── hooks/             # Custom React hooks
    ├── services/          # External service integrations
    └── utils/             # Utility functions
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](documentation/ARCHITECTURE.md) | System design, data flow diagrams, component hierarchy |
| [Tech Stack](documentation/TECH_STACK.md) | Detailed technology overview and database schema |
| [API Reference](documentation/API_REFERENCE.md) | API endpoints documentation with examples |
| [Algorithms](documentation/ALGORITHMS.md) | Core algorithms, formulas, and logic used in calculations |
| [SEO](documentation/SEO.md) | SEO implementation, metadata patterns, and optimization |
| [Cron Setup](documentation/CRON_SETUP.md) | GitHub Actions cron configuration for data sync |
| [CAPTCHA Setup](documentation/CAPTCHA_SETUP.md) | Cloudflare Turnstile integration guide |
| [Notifications](documentation/NOTIFICATIONS.md) | Node notification system architecture and setup |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | Get all pNodes with stats |
| `/api/node-profile` | GET | Get detailed node profile with history |
| `/api/node-history` | GET | Get node historical data and events |
| `/api/pod-credits` | GET | Get pod credits data |
| `/api/governance` | GET | Get governance proposals and treasury |
| `/api/geolocation` | POST | Batch IP geolocation lookup |
| `/api/xand-info` | GET | Get XAND token info from CoinGecko |
| `/api/ai-chat` | POST | AI assistant chat (SSE streaming) |
| `/api/sync-nodes` | POST | Sync all nodes to MongoDB (requires auth) |
| `/api/notifications/auth/*` | POST | Notification system authentication (login/verify/logout) |
| `/api/notifications/nodes` | GET/POST/DELETE | Manage node bindings for notifications |
| `/api/notifications/telegram/bind` | POST/PUT/DELETE | Telegram account linking |

---

## Node Score Calculation

The Node Score (0-100) is calculated using three components:

| Component | Max Points | Calculation |
|-----------|------------|-------------|
| **Uptime** | 40 | Scales linearly, 40 points for 30 days |
| **Storage** | 30 | Scales linearly, 30 points for 100GB committed |
| **Online Status** | 30 | Flat 30 points if seen within 60 minutes |

**Formula:** `Score = (Uptime ÷ 30 days × 40) + (Storage ÷ 100GB × 30) + (Online ? 30 : 0)`

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ikarn-dev/Xandash)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Submit a pull request

---

## Links

- [Xandeum Website](https://www.xandeum.network)
- [Xandeum Documentation](https://docs.xandeum.network)
- [Twitter/X](https://x.com/Xandeum)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built for the Xandeum community
</div>
