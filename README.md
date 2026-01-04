# XanDash - Xandeum Network Dashboard

<div align="center">

![XanDash](public/logo/xandash.png)

**Real-time monitoring dashboard for the Xandeum pNode network**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)

[Live Demo](https://xandash.vercel.app) · [Documentation](https://xandash.vercel.app/about) · [Xandeum Network](https://www.xandeum.network)

</div>

---

## Overview

XanDash is a comprehensive monitoring dashboard for the Xandeum decentralized storage network. It provides real-time insights into pNode performance, network statistics, historical data tracking, and detailed analytics.

## Features

- **Real-time pNode Monitoring** - Track 265+ nodes with live status updates every 30 seconds
- **Interactive Network Map** - Visualize global node distribution across 38+ locations using Leaflet
- **Node Profiles** - Detailed performance metrics, uptime history, and event logs with CAPTCHA protection
- **Historical Data** - MongoDB-powered snapshots and trend analysis
- **Leaderboard** - Rankings based on pod credits and node performance
- **Token Analytics** - Live XAND token price, market cap, and 24h charts via CoinGecko
- **Country Analytics** - Node distribution and statistics by country
- **Endpoint Testing** - Built-in RPC endpoint health checker with Web Workers
- **Auto-Sync** - Automatic data synchronization every 5 minutes via GitHub Actions
- **CAPTCHA Protection** - Cloudflare Turnstile integration to prevent API abuse
- **GSAP Animations** - Smooth scroll animations on About page

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

# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_DB_NAME=xandash

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Cron Secret
CRON_SECRET=your-secure-random-string
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # Documentation page
│   ├── about-xandash/     # About page with GSAP animations
│   ├── api/               # API routes
│   │   ├── node-profile/  # Node profile data
│   │   ├── nodes/         # All nodes listing
│   │   ├── sync-nodes/    # Auto-sync endpoint
│   │   └── verify-turnstile/ # CAPTCHA verification
│   ├── country/[code]/    # Country profile pages
│   ├── leaderboard/       # Leaderboard page
│   ├── network/           # Network map page
│   ├── nodes/             # pNodes listing page
│   └── profile/[ip]/      # Node profile pages
├── components/
│   ├── dashboard/         # Dashboard cards and widgets
│   ├── layout/            # Layout components (Navbar, Footer)
│   └── ui/                # Reusable UI components
│       ├── CaptchaGate.tsx    # Per-page CAPTCHA
│       ├── AppCaptchaGate.tsx # App-wide CAPTCHA
│       └── InteractiveMap.tsx # Leaflet map
└── libs/
    ├── db/                # MongoDB integration
    └── services/          # External service integrations
```

## Documentation

| Document | Description |
|----------|-------------|
| [Tech Stack](docs/TECH_STACK.md) | Detailed technology overview |
| [API Reference](docs/API_REFERENCE.md) | API endpoints documentation |
| [Cron Setup](docs/CRON_SETUP.md) | GitHub Actions cron configuration |
| [CAPTCHA Setup](docs/CAPTCHA_SETUP.md) | Cloudflare Turnstile integration |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | Get all pNodes with stats |
| `/api/node-profile` | GET | Get detailed node profile with history |
| `/api/pod-credits` | GET | Get pod credits data |
| `/api/xand-info` | GET | Get XAND token info |
| `/api/sync-nodes` | POST | Sync all nodes to MongoDB |
| `/api/verify-turnstile` | POST | Verify CAPTCHA token |
| `/api/db-status` | GET | Check MongoDB connection |

## Auto-Sync with GitHub Actions

XanDash uses GitHub Actions to sync node data every 5 minutes:

1. Add `CRON_SECRET` to GitHub repository secrets
2. Add same `CRON_SECRET` to Vercel environment variables
3. Workflow runs automatically on push to main

See [Cron Setup](docs/CRON_SETUP.md) for details.

## CAPTCHA Protection

Node profile pages are protected with Cloudflare Turnstile:
- Prevents API abuse and scraping
- Smooth user experience (invisible challenge)
- Localhost automatically bypassed for development

See [CAPTCHA Setup](docs/CAPTCHA_SETUP.md) for configuration.

## Recent Updates

### January 2026
- Added Cloudflare Turnstile CAPTCHA protection
- Created About page with GSAP scroll animations
- Optimized MongoDB sync (batch operations, ~2s completion)
- Added GitHub Actions cron (every 5 minutes)
- Fixed mobile navbar z-index issues
- Made navbar more compact for mobile
- Added skeleton loading for profile pages
- Updated version card to show most popular version

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
