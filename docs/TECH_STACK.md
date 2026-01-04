# XanDash Technology Stack

## Overview

XanDash is built with modern web technologies optimized for performance, developer experience, and scalability.

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
| IP Geolocation | Node location services (ip-api.com, ipapi.co) |

## UI Components

| Component | Purpose |
|-----------|---------|
| Custom SVG Icons | Lightweight, inline icon system |
| Leaflet | Interactive world map |
| Recharts | Data visualization charts |
| Sonner | Toast notifications |
| Custom Charts | SVG-based line charts, status charts |

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
}
```

## Performance Optimizations

- **Server-Side Rendering (SSR)**: Initial page loads are server-rendered
- **React Query Caching**: Intelligent data caching with stale-while-revalidate
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
