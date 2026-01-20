# XanDash Technology Stack

## Overview

XanDash is built with modern web technologies optimized for performance, developer experience, and scalability. The application supports both Mainnet and Devnet networks with real-time data synchronization.

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0 | React framework with App Router, Turbopack |
| React | 19.2 | UI component library with Server Components |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| React Query | 5.x | Data fetching, caching, and state management |
| GSAP | 3.x | Scroll animations and transitions |

## Backend & APIs

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless API endpoints |
| MongoDB Atlas | Historical data storage, node snapshots |
| JSON-RPC 2.0 | Communication with Xandeum network |
| CoinGecko API | XAND token market data |
| Helius API | Onchain wallet data (tokens, NFTs) for managers |
| OpenRouter API | AI Assistant (Gemini, Llama) for insights |
| IP Geolocation | Node location services (ip-api.com batch) |

## UI Components

| Component | Purpose |
|-----------|---------|
| Custom SVG Icons | Lightweight, inline icon system |
| Leaflet | Interactive world map |
| Recharts | Data visualization charts |
| Custom SVG Charts | Comparison charts, historical trends |
| Sonner | Toast notifications |

## Security

| Technology | Purpose |
|------------|---------|
| Cloudflare Turnstile | CAPTCHA protection for API endpoints |
| Environment Variables | Secure configuration management |
| HTTPS | Encrypted communications |

## DevOps & Deployment

| Technology | Purpose |
|------------|---------|
| Vercel | Hosting and deployment platform |
| GitHub Actions | CI/CD, scheduled cron jobs (every 5 min) |
| ESLint | Code linting and quality |
| PWA | Progressive Web App support |

## Key Features Implementation

### Node Compare
- Pre-fetched data for instant comparison results
- Parallel API fetching for historical data
- Batch geolocation lookup
- Custom SVG comparison charts

### Multi-Leaderboards
- Separate rankings for Credits, Uptime, Storage
- Tier system (Diamond, Platinum, Gold, Silver, Bronze)
- LocalStorage bookmarks per network
- Responsive tables with hidden scrollbars

### Governance Tracking
- Real-time proposal monitoring
- Treasury balance with SOL price conversion
- Sequential RPC batching to avoid rate limits
- bs58 address decoding for accurate comparison

### Manager Profiles
- Helius API integration for onchain wallet data
- Aggregated stats for manager's node fleet
- NFT/SBT visualization for community status
- Searchable by wallet or node IP

### AI Assistant
- Floating chat interface with streaming responses
- Context-aware prompts built from page data
- Automatic node analysis generation
- Fallback chain for AI models (Gemini -> Llama)

## Database Schema

### Node Snapshots Collection
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
  credits: number;
  timestamp: number;
  created_at: Date;
  network: 'devnet' | 'mainnet';
}
```

### Node Events Collection
```typescript
{
  ip: string;
  pubkey: string;
  event_type: 'node_new' | 'node_online' | 'node_offline' | 
              'status_change' | 'version_change' | 
              'storage_change' | 'credits_change';
  previous_value?: string | number;
  new_value?: string | number;
  timestamp: number;
  created_at: Date;
  network: 'devnet' | 'mainnet';
}
```

## Performance Optimizations

- **Server-Side Rendering (SSR)**: Initial page loads are server-rendered
- **React Query Caching**: Intelligent data caching with stale-while-revalidate
- **Pre-fetched Data**: Node comparison uses already-loaded data for instant results
- **Parallel API Calls**: Promise.all for concurrent data fetching
- **Batch Operations**: Geolocation batch API for multiple IPs
- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Maps and charts loaded on demand
- **Web Workers**: Background processing for endpoint testing
- **Skeleton Loading**: UI feedback during data fetches

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

See the main [README.md](../README.md) for full setup instructions.
