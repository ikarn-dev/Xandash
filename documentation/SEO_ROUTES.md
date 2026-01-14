# SEO Routes Reference

## Complete Route Metadata Map

### Static Routes

| Route | File | Title | Priority | Change Freq |
|-------|------|-------|----------|-------------|
| `/` | `src/app/layout.tsx` | XanDash - Real-Time Xandeum Network Dashboard & Node Monitor | 1.0 | daily |
| `/about-xandash` | `src/app/about-xandash/metadata.ts` | About XanDash - Xandeum Network Monitoring Dashboard | 0.6 | monthly |
| `/compare` | `src/app/compare/metadata.ts` | Node Compare - Compare Xandeum pNode Performance | 0.8 | daily |
| `/docs` | `src/app/docs/page.tsx` | Documentation - XanDash User Guide & API Reference | 0.7 | weekly |
| `/endpoints` | `src/app/endpoints/metadata.ts` | API Endpoints - Test Xandeum RPC Methods | 0.6 | weekly |
| `/governance` | `src/app/governance/page.tsx` | Governance - Xandeum Network Proposals & Voting | 0.7 | daily |
| `/leaderboard` | `src/app/leaderboard/metadata.ts` | Leaderboard - Top Xandeum pNodes Rankings | 0.8 | hourly |
| `/network` | `src/app/network/metadata.ts` | Network Map - Global Xandeum Node Distribution | 0.9 | hourly |
| `/nodes` | `src/app/nodes/page.tsx` | pNodes - Xandeum Network Validators | 0.9 | hourly |
| `/stoinc` | `src/app/stoinc/page.tsx` | STOINC Calculator - Storage Incentive Program | 0.6 | weekly |
| `/xand` | `src/app/xand/page.tsx` | XAND Token - Price, Market Cap & Analytics | 0.7 | daily |

### Dynamic Routes

| Route Pattern | File | Metadata Type | Example |
|---------------|------|---------------|---------|
| `/profile/[ip]` | `src/app/profile/[ip]/metadata.ts` | Dynamic (IP-based) | `/profile/192.168.1.1` |
| `/country/[code]` | `src/app/country/[code]/metadata.ts` | Dynamic (Country-based) | `/country/us` |

## Metadata Files Location

### Root Level
```
src/app/
├── layout.tsx                    # Global metadata
├── sitemap.ts                    # Dynamic sitemap
├── robots.ts                     # Dynamic robots
├── manifest.ts                   # PWA manifest
└── structured-data.tsx           # Schema.org markup
```

### Route-Specific Metadata
```
src/app/
├── about-xandash/
│   ├── layout.tsx               # Re-exports metadata
│   ├── metadata.ts              # Route metadata
│   └── page.tsx
├── compare/
│   ├── layout.tsx               # Re-exports metadata
│   ├── metadata.ts              # Route metadata
│   └── page.tsx
├── endpoints/
│   ├── layout.tsx               # Re-exports metadata
│   ├── metadata.ts              # Route metadata
│   └── page.tsx
├── governance/
│   ├── page.tsx                 # Inline metadata
│   └── GovernanceClient.tsx
├── leaderboard/
│   ├── layout.tsx               # Re-exports metadata
│   ├── metadata.ts              # Route metadata
│   └── page.tsx
├── network/
│   ├── layout.tsx               # Re-exports metadata
│   ├── metadata.ts              # Route metadata
│   └── page.tsx
├── nodes/
│   ├── page.tsx                 # Inline metadata
│   └── NodesPageClient.tsx
├── stoinc/
│   ├── page.tsx                 # Inline metadata
│   └── StoincCalculatorClient.tsx
└── xand/
    ├── page.tsx                 # Inline metadata
    └── XandInfoClient.tsx
```

### Dynamic Routes
```
src/app/
├── profile/
│   ├── [ip]/
│   │   ├── metadata.ts          # Dynamic metadata generator
│   │   ├── page.tsx             # Dynamic page
│   │   └── components/
│   └── page.tsx                 # Redirect to /nodes
└── country/
    └── [code]/
        ├── metadata.ts          # Dynamic metadata generator
        ├── page.tsx             # Dynamic page
        └── components/
```

## Metadata Implementation Patterns

### Pattern 1: Separate Metadata File (Recommended)
```typescript
// src/app/[route]/metadata.ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    title: 'Page Title',
    description: 'Page description',
    url: 'https://www.xandash.online/route',
  },
  alternates: {
    canonical: 'https://www.xandash.online/route',
  },
};
```

```typescript
// src/app/[route]/layout.tsx
import type { Metadata } from 'next';
import { metadata } from './metadata';

export { metadata };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Pattern 2: Inline Metadata
```typescript
// src/app/[route]/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  // ... rest of metadata
};

export default function Page() {
  return <div>Content</div>;
}
```

### Pattern 3: Dynamic Metadata
```typescript
// src/app/[dynamic]/[param]/metadata.ts
import type { Metadata } from 'next';

interface GenerateMetadataProps {
  params: Promise<{ param: string }>;
}

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { param } = await params;
  
  return {
    title: `${param} - Page Title`,
    description: `Description for ${param}`,
    // ... rest of metadata
  };
}
```

## Keywords by Route

### High Priority Routes (0.8-1.0)
- **/** - Primary keywords: Xandeum, pNodes, network monitoring, dashboard
- **/nodes** - Keywords: pNodes, validators, network nodes, node list
- **/network** - Keywords: network map, node distribution, global nodes
- **/leaderboard** - Keywords: leaderboard, rankings, top validators

### Medium Priority Routes (0.6-0.7)
- **/compare** - Keywords: node comparison, performance comparison
- **/governance** - Keywords: governance, proposals, voting
- **/xand** - Keywords: XAND token, price, market cap
- **/docs** - Keywords: documentation, user guide, API reference

### Low Priority Routes (0.6)
- **/stoinc** - Keywords: STOINC, rewards calculator
- **/endpoints** - Keywords: API endpoints, RPC testing
- **/about-xandash** - Keywords: about, company info

## SEO Configuration

### Base Configuration
- **Base URL**: https://www.xandash.online
- **Site Name**: XanDash
- **Twitter**: @xandeum
- **OG Image**: https://www.xandash.online/icon.png (512x512)

### Default Keywords
```
Xandeum, pNodes, network monitoring, dashboard, validators,
blockchain, storage network, node tracker, devnet, mainnet
```

## Monitoring & Updates

### When to Update Metadata
- [ ] Adding new routes
- [ ] Changing page titles
- [ ] Updating descriptions
- [ ] Adding new keywords
- [ ] Changing URL structure
- [ ] Updating social media handles

### Tools for Validation
1. Google Search Console - Indexing status
2. Google PageSpeed Insights - Performance
3. Schema Markup Validator - Structured data
4. Open Graph Debugger - Social sharing
5. Twitter Card Validator - Twitter preview

## Related Documentation
- [SEO Guide](./SEO_GUIDE.md) - Detailed implementation
- [SEO Checklist](./SEO_CHECKLIST.md) - Implementation status
- [SEO Structure](./SEO_STRUCTURE.md) - File organization
