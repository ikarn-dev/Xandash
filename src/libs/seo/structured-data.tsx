'use client';

import { SEO_CONFIG } from './config';

export function StructuredData() {
  const { baseUrl, siteName } = SEO_CONFIG;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": siteName,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Real-time monitoring dashboard for Xandeum decentralized storage network. Track pNodes, analyze performance, and monitor network health.",
    "url": baseUrl,
    "author": {
      "@type": "Organization",
      "name": "Xandeum",
      "url": "https://www.xandeum.network"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "featureList": [
      "Real-time node monitoring",
      "Interactive network map",
      "Historical analytics",
      "Node comparison tool",
      "AI-powered analysis",
      "Governance tracking",
      "Leaderboards",
      "Token analytics"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": baseUrl,
    "description": "Real-time monitoring dashboard for Xandeum network validators and nodes",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/nodes?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "pNodes",
        "item": `${baseUrl}/nodes`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Network Map",
        "item": `${baseUrl}/network`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Leaderboard",
        "item": `${baseUrl}/leaderboard`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
