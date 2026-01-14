'use client';

import { SEO_CONFIG } from './config';

export function StructuredData() {
  const { baseUrl, siteName } = SEO_CONFIG;

  // Organization schema - for brand recognition and favicon
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "XanDash",
    "alternateName": ["Xandeum Dashboard", "pNode Dashboard", "Xandeum pNode Dashboard"],
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/icon.png`,
      "width": 512,
      "height": 512
    },
    "image": `${baseUrl}/icon.png`,
    "description": "XanDash is the official Xandeum dashboard for monitoring pNodes in real-time."
  };

  // WebSite schema - for site search and sitelinks
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "XanDash",
    "alternateName": ["Xandeum Dashboard", "pNode Dashboard", "Xandeum pNode Dashboard", "XanDash Dashboard"],
    "url": baseUrl,
    "description": "XanDash is the official Xandeum dashboard for monitoring pNodes. Track node performance, uptime, storage, and credits in real-time.",
    "publisher": {
      "@type": "Organization",
      "name": "XanDash",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/icon.png`
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/nodes?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "en-US"
  };

  // WebPage schema - for the homepage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "XanDash - Xandeum Dashboard | pNode Monitor & Network Analytics",
    "description": "XanDash is the official Xandeum dashboard for monitoring pNodes. Track node performance, uptime, storage, credits, and network statistics in real-time.",
    "url": baseUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "XanDash",
      "url": baseUrl
    },
    "about": {
      "@type": "Thing",
      "name": "Xandeum Network",
      "description": "Decentralized storage network"
    },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "XanDash",
      "applicationCategory": "WebApplication",
      "operatingSystem": "Web Browser"
    }
  };

  // SoftwareApplication schema - for the dashboard app
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "XanDash",
    "alternateName": ["Xandeum Dashboard", "pNode Dashboard"],
    "applicationCategory": "WebApplication",
    "applicationSubCategory": "Blockchain Dashboard",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "XanDash is the official Xandeum dashboard for monitoring pNodes. Track node performance, uptime, storage, and credits in real-time with AI-powered analytics.",
    "url": baseUrl,
    "image": `${baseUrl}/icon.png`,
    "screenshot": `${baseUrl}/icon.png`,
    "author": {
      "@type": "Organization",
      "name": "XanDash"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "200",
      "bestRating": "5",
      "worstRating": "1"
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
        "name": "XanDash Home",
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
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Compare Nodes",
        "item": `${baseUrl}/compare`
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
          "text": "XanDash is the official Xandeum dashboard for monitoring pNodes in real-time. It provides comprehensive analytics including node performance, uptime, storage metrics, credits tracking, and AI-powered insights for the Xandeum decentralized storage network."
        }
      },
      {
        "@type": "Question",
        "name": "What is Xandeum?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Xandeum is a decentralized storage network built on Solana that provides scalable, secure, and cost-effective data storage solutions using pNodes (storage nodes). XanDash is the official dashboard for monitoring the Xandeum network."
        }
      },
      {
        "@type": "Question",
        "name": "How do I monitor my pNode on XanDash?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Visit the pNodes page on XanDash and search for your node using its IP address or public key. The dashboard displays real-time status, uptime, storage capacity, credits earned, and historical performance data with interactive charts."
        }
      },
      {
        "@type": "Question",
        "name": "Is XanDash free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, XanDash is completely free to use. It provides real-time monitoring, analytics, and AI-powered insights for all Xandeum network pNodes without any cost."
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
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
