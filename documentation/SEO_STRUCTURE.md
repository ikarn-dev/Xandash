# SEO File Structure & Organization

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with global metadata
│   ├── sitemap.ts                    # Dynamic sitemap generation
│   ├── robots.ts                     # Dynamic robots.txt
│   ├── manifest.ts                   # PWA manifest
│   ├── structured-data.tsx           # Schema.org markup
│   ├── [route]/
│   │   ├── layout.tsx                # Route layout
│   │   ├── metadata.ts               # Route-specific metadata
│   │   └── page.tsx                  # Route page
│   └── [dynamic]/
│       └── [param]/
│           ├── metadata.ts           # Dynamic metadata generator
│           └── page.tsx              # Dynamic page
│
├── libs/
│   ├── seo/
│   │   ├── index.ts                  # SEO exports
│   │   └── config.ts                 # SEO configuration
│   ├── index.ts                      # Main libs exports
│   ├── services/
│   ├── hooks/
│   ├── context/
│   └── ...
│
└── components/
    └── ...

public/
├── sitemap.xml                       # Static sitemap backup
├── robots.txt                        # Static robots backup
└── .well-known/
    └── security.txt                  # Security contact

docs/
├── SEO_GUIDE.md                      # Comprehensive SEO guide
├── SEO_CHECKLIST.md                  # Implementation checklist
└── SEO_STRUCTURE.md                  # This file
```

## SEO Files Overview

### Core SEO Files

#### 1. **src/app/layout.tsx**
- Global metadata for all pages
- Open Graph configuration
- Twitter Card setup
- Viewport and theme configuration
- Structured data component import

#### 2. **src/app/sitemap.ts**
- Dynamic sitemap generation
- Automatic route discovery
- Priority and change frequency settings
- Revalidation strategy

#### 3. **src/app/robots.ts**
- Dynamic robots.txt generation
- Crawler rules configuration
- Sitemap reference

#### 4. **src/app/manifest.ts**
- PWA manifest configuration
- App shortcuts
- Icon configuration
- Display settings

#### 5. **src/app/structured-data.tsx**
- Schema.org markup
- SoftwareApplication schema
- WebSite schema with SearchAction
- BreadcrumbList schema

### Route-Specific Metadata

#### Static Routes
Each route has a `metadata.ts` file:
- `/about-xandash/metadata.ts`
- `/compare/metadata.ts`
- `/endpoints/metadata.ts`
- `/governance/metadata.ts`
- `/leaderboard/metadata.ts`
- `/network/metadata.ts`

#### Dynamic Routes
Dynamic metadata generators:
- `/profile/[ip]/metadata.ts` - Generates metadata based on IP
- `/country/[code]/metadata.ts` - Generates metadata based on country code

### SEO Configuration

#### **src/libs/seo/config.ts**
Central SEO configuration with:
- Base URL
- Site name
- Default title and description
- Twitter handle
- OG image defaults
- Default keywords
- `generateSEOMetadata()` helper function

#### **src/libs/seo/index.ts**
Exports SEO utilities for easy importing

### Documentation

#### **docs/SEO_GUIDE.md**
Comprehensive guide covering:
- Implementation details
- Best practices
- Monitoring tools
- Future improvements

#### **docs/SEO_CHECKLIST.md**
Implementation checklist with:
- Completed items
- SEO metrics
- Priority keywords
- Testing checklist
- Next steps

#### **docs/SEO_STRUCTURE.md**
This file - directory and file organization

### Security

#### **public/.well-known/security.txt**
Security contact information for responsible disclosure

## Import Patterns

### Using SEO Config
```typescript
// Option 1: Import from libs
import { SEO_CONFIG, generateSEOMetadata } from '@/libs/seo';

// Option 2: Import from libs (via index)
import { SEO_CONFIG } from '@/libs';

// Option 3: Direct import
import { SEO_CONFIG } from '@/libs/seo/config';
```

### Creating Metadata
```typescript
import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/libs/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Page Title',
  description: 'Page description',
  keywords: ['keyword1', 'keyword2'],
  path: '/page-path',
});
```

## File Relationships

```
src/app/layout.tsx
├── imports: structured-data.tsx
├── imports: @/libs/seo (for future use)
└── defines: global metadata

src/app/[route]/layout.tsx
├── imports: ./metadata.ts
└── re-exports: metadata

src/app/[route]/metadata.ts
├── defines: route-specific metadata
└── uses: SEO_CONFIG (optional)

src/app/[dynamic]/[param]/metadata.ts
├── defines: generateMetadata function
├── uses: SEO_CONFIG (optional)
└── generates: dynamic metadata

src/libs/seo/
├── config.ts: SEO constants and helpers
└── index.ts: exports
```

## Metadata Hierarchy

1. **Global** (src/app/layout.tsx)
   - Applied to all pages
   - Can be overridden by route-specific metadata

2. **Route-Specific** (src/app/[route]/metadata.ts)
   - Applied to specific routes
   - Overrides global metadata

3. **Dynamic** (src/app/[dynamic]/[param]/metadata.ts)
   - Generated based on URL parameters
   - Highest priority

## Best Practices

### 1. Metadata Files
- Keep metadata in separate `metadata.ts` files
- Import and re-export in `layout.tsx`
- Use `generateSEOMetadata()` helper for consistency

### 2. Configuration
- Use `SEO_CONFIG` for all base URLs and defaults
- Keep keywords in config for easy updates
- Update Twitter handle in config

### 3. Dynamic Routes
- Always implement `generateMetadata()` for dynamic routes
- Use URL parameters to generate relevant metadata
- Include fallback metadata

### 4. Structured Data
- Keep schema.org markup in `structured-data.tsx`
- Import in root layout
- Update schemas as features change

### 5. Documentation
- Keep SEO docs updated with changes
- Document new routes in checklist
- Monitor and update keywords

## Maintenance Checklist

- [ ] Update metadata when adding new routes
- [ ] Add keywords to SEO_CONFIG when relevant
- [ ] Test metadata with Google's tools
- [ ] Monitor search rankings
- [ ] Update documentation
- [ ] Review and optimize Core Web Vitals
- [ ] Check for broken links
- [ ] Validate structured data

## Related Files

- `next.config.ts` - Performance optimizations
- `public/sitemap.xml` - Static sitemap backup
- `public/robots.txt` - Static robots backup
- `public/manifest.json` - PWA manifest backup
- `docs/SEO_GUIDE.md` - Detailed implementation guide
- `docs/SEO_CHECKLIST.md` - Implementation status

## Quick Links

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
