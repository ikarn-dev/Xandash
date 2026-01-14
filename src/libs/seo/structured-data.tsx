'use client';

import { SEO_CONFIG } from './config';

export function StructuredData() {
  const { baseUrl, siteName } = SEO_CONFIG;

  // Organization schema - for brand recognition
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "XanDash",
    "url": baseUrl,
    "logo": `${baseUrl}/logo/xandash.png`,
    "description": "Real-time monitoring dashboard for Xandeum decentralized storage network"
  };

  // SoftwareApplication schema - for the dashboard app
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": siteName,
    "applicationCategory": "UtilitiesApplication",
    "applicationSubCategory": "Blockchain Dashboard",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Real-time monitoring dashboard for Xandeum decentralized storage network. Track pNodes, analyze performance, and monitor network health.",
    "url": baseUrl,
    "author": {
      "@type": "Organization",
      "name": "Xandeum"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "screenshot": `${baseUrl}/logo/xandash.png`
  };

  // WebSite schema - for site search
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "alternateName": "Xandeum Dashboard",
    "url": baseUrl,
    "description": "Real-time monitoring dashboard for Xandeum network pNodes and validators",
    "publisher": {
      "@type": "Organization",
      "name": "Xandeum"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/nodes?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // BreadcrumbList schema - for navigation
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

  // FAQPage schema - helps with rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is XanDash?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "XanDash is a real-time monitoring dashboard for the Xandeum decentralized storage network. It allows users to track pNodes, analyze performance metrics, view network health, and monitor validator statistics."
        }
      },
      {
        "@type": "Question",
        "name": "What is Xandeum?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Xandeum is a decentralized storage network built on Solana that provides scalable, secure, and cost-effective data storage solutions using pNodes (storage nodes)."
        }
      },
      {
        "@type": "Question",
        "name": "How do I monitor my pNode?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can monitor your pNode by visiting the Nodes page on XanDash and searching for your node's IP address or public key. The dashboard shows real-time status, uptime, storage, credits, and historical performance data."
        }
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
