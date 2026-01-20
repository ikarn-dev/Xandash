# XanDash SEO Documentation

## Overview

XanDash implements comprehensive SEO optimization for better search engine visibility and ranking. This document consolidates all SEO-related information including implementation details, routes, structure, and checklists.

## Implementation Status

### ✅ Completed Items

#### Core SEO
- [x] Root layout metadata with Open Graph and Twitter cards
- [x] Page-specific metadata for all static routes
- [x] Dynamic metadata for profile, country, and manager pages
- [x] Canonical URLs on all pages
- [x] Meta descriptions (150-160 characters)
- [x] Optimized title tags with brand name
- [x] Keywords strategy implemented

#### Technical SEO
- [x] Dynamic sitemap.ts with proper priorities
- [x] Dynamic robots.ts configuration
- [x] PWA manifest.ts
- [x] Structured data (Schema.org)
  - SoftwareApplication schema
  - WebSite schema with SearchAction
  - BreadcrumbList schema
- [x] Security.txt file

#### Performance
- [x] Next.js 16 with Turbopack
- [x] Image optimization (WebP, AVIF)
- [x] CSS optimization enabled
- [x] Package import optimization
- [x] Compression enabled
- [x] Powered-by header removed
- [x] Cache headers configured

#### Mobile & PWA
- [x] Mobile-responsive design
- [x] Viewport meta tags
- [x] Theme color configuration
- [x] Apple Web App meta tags
- [x] PWA manifest with shortcuts
- [x] Touch icons configured

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root metadata
│   ├── sitemap.ts              # Dynamic sitemap
│   ├── robots.ts               # Robots configuration
│   ├── manifest.ts             # PWA manifest
│   ├── structured-data.tsx     # Schema.org markup
│   ├── [route]/
│   │   ├── layout.tsx          # Route-specific metadata
│   │   ├── metadata.ts         # Separated metadata file
│   │   └── page.tsx            # Page component
│   └── [dynamic]/
│       ├── [param]/
│       │   ├── metadata.ts     # Dynamic metadata generator
│       │   └── page.tsx        # Dynamic page

public/
├── sitemap.xml                 # Static sitemap backup
├── robots.txt                  # Static robots backup
└── .well-known/
    └── security.txt            # Security contact

docs/
└── SEO.md                      # This file
```

---

## Route Metadata Reference

### Static Routes

| Route | Title | Priority | Change Freq |
|-------|-------|----------|-------------|
| `/` | XanDash - Real-Time Xandeum Network Dashboard | 1.0 | daily |
| `/nodes` | pNodes - Xandeum Network Validators | 0.9 | hourly |
| `/network` | Network Map - Global Node Distribution | 0.9 | hourly |
| `/leaderboard` | Leaderboard - Top pNodes Rankings | 0.8 | hourly |
| `/compare` | Node Compare - Compare pNode Performance | 0.8 | daily |
| `/governance` | Governance - Network Proposals & Voting | 0.7 | daily |
| `/xand` | XAND Token - Price & Analytics | 0.7 | daily |
| `/stoinc` | STOINC Calculator - Storage Incentive | 0.6 | weekly |
| `/endpoints` | API Endpoints - Test RPC Methods | 0.6 | weekly |
| `/docs` | Documentation - User Guide & API Reference | 0.7 | weekly |
| `/about-xandash` | About XanDash | 0.6 | monthly |
| `/managers` | Managers - Network Operators | 0.8 | hourly |

### Dynamic Routes

| Route Pattern | Metadata Type | Example |
|---------------|---------------|---------|
| `/profile/[ip]` | Dynamic (IP-based) | `/profile/192.168.1.1` |
| `/country/[code]` | Dynamic (Country-based) | `/country/us` |
| `/manager/[pubkey]` | Dynamic (Pubkey-based) | `/manager/abc123...` |

---

## Keywords Strategy

### Primary Keywords (High Priority)
- Xandeum
- pNodes
- network monitoring
- blockchain dashboard
- validators
- node tracker

### Secondary Keywords (Medium Priority)
- node comparison
- leaderboard
- governance
- XAND token
- storage network
- devnet / mainnet

### Long-tail Keywords (Low Competition)
- Xandeum network dashboard
- pNode monitoring tool
- Xandeum validator tracker
- blockchain node analytics
- decentralized storage monitoring

---

## Metadata Implementation Patterns

### Pattern 1: Separate Metadata File (Recommended)

```typescript
// src/app/[route]/metadata.ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | XanDash',
  description: 'Page description (150-160 characters)',
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
export { metadata } from './metadata';

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### Pattern 2: Dynamic Metadata

```typescript
// src/app/[dynamic]/[param]/metadata.ts
import type { Metadata } from 'next';

interface GenerateMetadataProps {
  params: Promise<{ param: string }>;
}

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { param } = await params;
  
  return {
    title: `${param} - Page Title | XanDash`,
    description: `Description for ${param}`,
  };
}
```

---

## SEO Configuration

### Base Configuration
- **Base URL**: https://www.xandash.online
- **Site Name**: XanDash
- **Twitter**: @xandeum
- **OG Image**: https://www.xandash.online/icon.png (512x512)

### Best Practices

#### Title Tags
- Keep under 60 characters
- Include primary keyword
- Add brand name (XanDash)
- Use pipe separator: `Page Title | XanDash`

#### Meta Descriptions
- Keep between 150-160 characters
- Include call-to-action
- Use primary and secondary keywords naturally

#### URL Structure
- Use lowercase
- Separate words with hyphens
- Keep URLs short and descriptive

#### Image Optimization
- Use descriptive alt text
- Implement lazy loading
- Use modern formats (WebP, AVIF)

---

## Monitoring & Tools

### Essential Tools
1. **Google Search Console** - Indexing and search performance
2. **Google Analytics 4** - Traffic and user behavior
3. **PageSpeed Insights** - Performance metrics
4. **Lighthouse** - Overall audit

### Key Metrics
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

---

## Checklist

### Testing
- [ ] Test all metadata in browser dev tools
- [ ] Validate structured data with Google's tool
- [ ] Check mobile-friendliness
- [ ] Test social media previews
- [ ] Verify sitemap accessibility
- [ ] Check robots.txt rules

### Post-Launch
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Monitor indexing status
- [ ] Check Core Web Vitals
- [ ] Monitor search rankings

---

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
