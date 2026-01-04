'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Custom SVG Icons
const BookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const CodeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ServerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const LayersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const DatabaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const TerminalIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const CpuIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

const LinkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronLeftIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// Corner Accent Component
const CornerAccents = ({ color = "white" }: { color?: string }) => {
  const colorClass = color === "emerald" ? "group-hover:bg-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)]";
  return (
    <>
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className={`absolute top-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className={`absolute top-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className={`absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className={`absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};

// Code block component
const CodeBlock = ({ code, language = 'typescript' }: { code: string; language?: string }) => (
  <div className="relative bg-black/60 border border-white/10 rounded-lg overflow-hidden my-4">
    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
      <span className="text-white/40 text-xs font-mono">{language}</span>
    </div>
    <pre className="p-4 overflow-x-auto">
      <code className="text-sm font-mono text-emerald-400">{code}</code>
    </pre>
  </div>
);

// Sidebar navigation structure
const sidebarSections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction', icon: BookIcon },
      { id: 'overview', title: 'Dashboard Overview', icon: LayersIcon },
      { id: 'quick-start', title: 'Quick Start', icon: ZapIcon },
    ]
  },
  {
    title: 'Features',
    items: [
      { id: 'analytics', title: 'Analytics Dashboard', icon: ChartIcon },
      { id: 'pnodes', title: 'pNodes Monitoring', icon: ServerIcon },
      { id: 'leaderboard', title: 'Leaderboard', icon: ChartIcon },
      { id: 'network', title: 'Network Map', icon: GlobeIcon },
      { id: 'xand-token', title: 'XAND Token Info', icon: DatabaseIcon },
      { id: 'endpoints', title: 'Endpoint Testing', icon: TerminalIcon },
    ]
  },
  {
    title: 'Technical',
    items: [
      { id: 'architecture', title: 'Architecture', icon: CpuIcon },
      { id: 'tech-stack', title: 'Tech Stack', icon: CodeIcon },
      { id: 'api-reference', title: 'API Reference', icon: LinkIcon },
      { id: 'data-flow', title: 'Data Flow', icon: LayersIcon },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { id: 'security', title: 'Security', icon: ShieldIcon },
      { id: 'performance', title: 'Performance', icon: ZapIcon },
      { id: 'contributing', title: 'Contributing', icon: CodeIcon },
    ]
  }
];

// Flatten all items for pagination
const allItems = sidebarSections.flatMap(s => s.items);

// Content components for each section
const IntroductionContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <BookIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// INTRODUCTION</span>
    </div>
    <h1 className="text-3xl font-bold text-white mb-4">Welcome to XanDash</h1>
    <p className="text-white/70 leading-relaxed mb-4">
      XanDash is a comprehensive real-time monitoring dashboard for the Xandeum network. It provides 
      network operators, validators, and community members with detailed insights into network health, 
      node performance, and token metrics.
    </p>
    <p className="text-white/70 leading-relaxed mb-4">
      Built with modern web technologies, XanDash offers a seamless experience across devices with 
      PWA support, real-time data updates, and an intuitive interface designed for both beginners 
      and advanced users.
    </p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {[
        { label: 'Real-time Updates', value: '30s' },
        { label: 'PWA Support', value: '✓' },
        { label: 'Mobile Ready', value: '✓' },
        { label: 'Open Source', value: '✓' },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-white font-mono text-lg">{item.value}</div>
          <div className="text-white/40 text-xs">{item.label}</div>
        </div>
      ))}
    </div>
  </div>
);

const OverviewContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <LayersIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// DASHBOARD OVERVIEW</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Dashboard Structure</h2>
    <p className="text-white/70 leading-relaxed mb-6">
      XanDash is organized into several key sections, each providing specific functionality:
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: 'Analytics', desc: 'Main dashboard with network statistics, charts, and real-time metrics', href: '/' },
        { title: 'pNodes', desc: 'Detailed view of all network nodes with status, resources, and performance data', href: '/nodes' },
        { title: 'Leaderboard', desc: 'Rankings of nodes by credits earned, uptime, and performance metrics', href: '/leaderboard' },
        { title: 'Network', desc: 'Geographic distribution of nodes with interactive map and country statistics', href: '/network' },
        { title: 'XAND', desc: 'Token information including price, market data, and supply metrics from CoinGecko', href: '/xand' },
        { title: 'Endpoints', desc: 'RPC endpoint testing tool for checking network connectivity and response times', href: '/endpoints' },
      ].map((item, i) => (
        <Link key={i} href={item.href} className="block bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors">
          <h3 className="text-white font-semibold mb-1">{item.title}</h3>
          <p className="text-white/50 text-sm">{item.desc}</p>
        </Link>
      ))}
    </div>
  </div>
);

const QuickStartContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ZapIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// QUICK START</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
    <div className="space-y-6">
      {[
        { step: 1, title: 'Navigate the Dashboard', desc: 'Use the top navigation bar to switch between different sections. On mobile, tap the menu icon to access navigation.' },
        { step: 2, title: 'Select Network', desc: 'Use the network selector in the top-right to switch between Mainnet and Testnet environments.' },
        { step: 3, title: 'Monitor Nodes', desc: 'Click on any node row in the pNodes table to view detailed information including location, resources, and historical data.' },
        { step: 4, title: 'Live Refresh', desc: 'Data automatically refreshes every 30 seconds. Use the refresh button to manually update data at any time.' },
      ].map((item) => (
        <div key={item.step}>
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-sm">{item.step}</span>
            {item.title}
          </h3>
          <p className="text-white/70 text-sm ml-8">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ChartIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// ANALYTICS DASHBOARD</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      The main analytics dashboard provides a comprehensive overview of the Xandeum network status:
    </p>
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Network Statistics Cards</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Total pNodes - Number of registered nodes on the network</li>
          <li>Online Nodes - Currently active and responding nodes</li>
          <li>Total Storage - Combined storage capacity across all nodes</li>
          <li>Network Uptime - Overall network availability percentage</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Interactive Charts</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Network activity over time with customizable time ranges</li>
          <li>Resource utilization graphs (CPU, Memory, Storage)</li>
          <li>Node distribution by country and region</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Global Node Map</h4>
        <p className="text-white/60 text-sm">
          Interactive world map showing geographic distribution of all network nodes with clustering for dense regions.
        </p>
      </div>
    </div>
  </div>
);

const PNodesContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ServerIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// PNODES MONITORING</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">pNodes Monitoring</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      The pNodes page provides detailed monitoring for all network nodes:
    </p>
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Node Table Features</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Sortable columns for all metrics</li>
          <li>Search and filter by IP, location, or status</li>
          <li>Real-time status indicators (Online/Offline)</li>
          <li>Click any row to view detailed node profile</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Node Metrics</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li><span className="text-white">IP Address</span> - Unique identifier for the node</li>
          <li><span className="text-white">Status</span> - Current online/offline state</li>
          <li><span className="text-white">Location</span> - Geographic location (City, Country)</li>
          <li><span className="text-white">CPU/RAM</span> - Current resource utilization</li>
          <li><span className="text-white">Storage</span> - Available and used storage</li>
          <li><span className="text-white">Uptime</span> - Time since last restart</li>
          <li><span className="text-white">Credits</span> - Earned rewards from network participation</li>
        </ul>
      </div>
    </div>
  </div>
);

const LeaderboardContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ChartIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// LEADERBOARD</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      The leaderboard ranks nodes based on their performance and contribution to the network:
    </p>
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="text-white font-semibold mb-2">Ranking Criteria</h4>
      <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
        <li><span className="text-white">Credits Earned</span> - Total rewards accumulated by the node</li>
        <li><span className="text-white">Uptime Score</span> - Percentage of time the node has been online</li>
        <li><span className="text-white">Response Time</span> - Average latency for network requests</li>
        <li><span className="text-white">Storage Contribution</span> - Amount of storage provided to the network</li>
      </ul>
    </div>
  </div>
);

const NetworkContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <GlobeIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// NETWORK MAP</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Network Map</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      Visualize the global distribution of Xandeum network nodes:
    </p>
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Interactive World Map</h4>
        <p className="text-white/60 text-sm">
          Custom SVG-based world map showing node locations with clustering for regions with multiple nodes. 
          Hover over markers to see node counts and click to zoom into specific regions.
        </p>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Country Statistics</h4>
        <p className="text-white/60 text-sm">
          Click on any country card to view detailed statistics including total nodes, online rate, 
          storage capacity, and a list of all nodes in that country.
        </p>
      </div>
    </div>
  </div>
);

const XandTokenContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <DatabaseIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// XAND TOKEN INFO</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">XAND Token Information</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      Real-time XAND token data fetched from the CoinGecko API:
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Price Data</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Current price in USD, BTC, and ETH</li>
          <li>24h, 7d, and 30d price changes</li>
          <li>All-time high and low records</li>
          <li>Mini price chart visualization</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Market Data</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Market cap and ranking</li>
          <li>24h trading volume</li>
          <li>Fully diluted valuation</li>
          <li>Community sentiment</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Supply Information</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Circulating supply with pie chart</li>
          <li>Total and max supply</li>
          <li>Supply distribution visualization</li>
        </ul>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Links & Contract</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Contract address with copy button</li>
          <li>Links to Solscan and GeckoTerminal</li>
          <li>Social media links</li>
        </ul>
      </div>
    </div>
  </div>
);

const EndpointsContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <TerminalIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// ENDPOINT TESTING</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Endpoint Testing</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      Test RPC endpoints and check network connectivity:
    </p>
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="text-white font-semibold mb-2">Features</h4>
      <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
        <li>Test multiple RPC endpoints simultaneously</li>
        <li>Measure response times and latency</li>
        <li>Check endpoint availability and health</li>
        <li>View detailed response data</li>
        <li>Background worker for non-blocking tests</li>
      </ul>
    </div>
  </div>
);

const ArchitectureContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <CpuIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// ARCHITECTURE</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">System Architecture</h2>
    <p className="text-white/70 leading-relaxed mb-4">
      XanDash follows a modern, scalable architecture designed for performance and reliability:
    </p>
    <div className="bg-white/5 rounded-lg p-6 mb-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">Client (Browser/PWA)</div>
          <span className="text-white/40">→</span>
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">Next.js App Router</div>
          <span className="text-white/40">→</span>
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">API Routes</div>
          <span className="text-white/40">→</span>
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">Xandeum RPC</div>
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Frontend Layer</h4>
        <p className="text-white/60 text-sm">React-based UI with server-side rendering (SSR) for initial page loads and client-side hydration for interactivity.</p>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">API Layer</h4>
        <p className="text-white/60 text-sm">Next.js API routes act as a proxy to the Xandeum RPC endpoints, handling authentication, rate limiting, and response transformation.</p>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Data Layer</h4>
        <p className="text-white/60 text-sm">Real-time data from Xandeum network RPC endpoints, CoinGecko API for token data, and IP geolocation services.</p>
      </div>
    </div>
  </div>
);

const TechStackContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <CodeIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// TECH STACK</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Technology Stack</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full"></span>Frontend
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Next.js 16', desc: 'React framework with App Router & Turbopack' },
            { name: 'React 19', desc: 'UI component library with Server Components' },
            { name: 'TypeScript 5', desc: 'Type-safe JavaScript' },
            { name: 'Tailwind CSS 4', desc: 'Utility-first CSS framework' },
            { name: 'React Query', desc: 'Data fetching and caching' },
            { name: 'GSAP', desc: 'Scroll animations and transitions' },
          ].map((tech, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
              <span className="text-white text-sm font-mono">{tech.name}</span>
              <span className="text-white/40 text-xs">{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-white/60 rounded-full"></span>Backend & APIs
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Next.js API Routes', desc: 'Serverless API endpoints' },
            { name: 'MongoDB Atlas', desc: 'Historical data & snapshots' },
            { name: 'JSON-RPC 2.0', desc: 'RPC protocol for Xandeum' },
            { name: 'CoinGecko API', desc: 'Token market data' },
            { name: 'GitHub Actions', desc: 'Cron jobs for data sync' },
            { name: 'Cloudflare Turnstile', desc: 'CAPTCHA protection' },
          ].map((tech, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
              <span className="text-white text-sm font-mono">{tech.name}</span>
              <span className="text-white/40 text-xs">{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-white/40 rounded-full"></span>UI Components
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Custom SVG Icons', desc: 'Lightweight icon system' },
            { name: 'Leaflet Maps', desc: 'Interactive world map' },
            { name: 'Recharts', desc: 'Data visualization charts' },
            { name: 'Sonner', desc: 'Toast notifications' },
            { name: 'Custom Charts', desc: 'SVG-based visualizations' },
          ].map((tech, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
              <span className="text-white text-sm font-mono">{tech.name}</span>
              <span className="text-white/40 text-xs">{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-white/20 rounded-full"></span>DevOps & Tools
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Vercel', desc: 'Deployment platform' },
            { name: 'GitHub Actions', desc: 'CI/CD & scheduled cron' },
            { name: 'ESLint', desc: 'Code linting' },
            { name: 'PWA Support', desc: 'Offline capabilities' },
          ].map((tech, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
              <span className="text-white text-sm font-mono">{tech.name}</span>
              <span className="text-white/40 text-xs">{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ApiReferenceContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <LinkIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// API REFERENCE</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">API Reference</h2>
    <p className="text-white/70 leading-relaxed mb-6">
      XanDash uses several internal API routes to fetch and process data:
    </p>
    <div className="space-y-4">
      {[
        { method: 'GET', path: '/api/rpc', desc: 'Proxy endpoint for Xandeum JSON-RPC calls' },
        { method: 'GET', path: '/api/nodes', desc: 'Fetches all network nodes with status and metrics' },
        { method: 'GET', path: '/api/node-profile?ip={ip}', desc: 'Fetches detailed profile for a specific node' },
        { method: 'GET', path: '/api/pod-credits', desc: 'Fetches credit/reward data for all pods' },
        { method: 'GET', path: '/api/geolocation?ip={ip}', desc: 'Returns geographic location data for an IP' },
        { method: 'GET', path: '/api/xand-info', desc: 'Fetches XAND token data from CoinGecko API' },
        { method: 'GET', path: '/api/node-response-times', desc: 'Tests and returns response times for RPC endpoints' },
      ].map((api, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-white/10 text-white text-xs font-mono rounded">{api.method}</span>
            <code className="text-white font-mono text-sm">{api.path}</code>
          </div>
          <p className="text-white/60 text-sm">{api.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const DataFlowContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <LayersIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// DATA FLOW</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Data Flow</h2>
    <p className="text-white/70 leading-relaxed mb-6">Understanding how data flows through XanDash:</p>
    <div className="space-y-4">
      {[
        { title: '1. Initial Page Load (SSR)', points: ['Server fetches initial data from Xandeum RPC', 'HTML is rendered with data and sent to client', 'Client hydrates React components', 'React Query initializes with server data'] },
        { title: '2. Real-time Updates', points: ['LiveRefresh component triggers every 30 seconds', 'React Query refetches stale data in background', 'UI updates seamlessly without page reload', 'Manual refresh available via refresh button'] },
        { title: '3. Caching Strategy', points: ['React Query caches responses with configurable stale time', 'API routes may implement server-side caching', 'Geolocation data cached to reduce API calls', 'Token data has 5-minute refresh cooldown'] },
        { title: '4. Error Handling', points: ['Graceful degradation when APIs are unavailable', 'Toast notifications for user feedback', 'Retry logic for failed requests', 'Fallback UI states for loading and errors'] },
      ].map((section, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">{section.title}</h4>
          <div className="text-white/60 text-sm space-y-1">
            {section.points.map((point, j) => <p key={j}>• {point}</p>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SecurityContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ShieldIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// SECURITY</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Security Considerations</h2>
    <div className="space-y-4">
      {[
        { title: 'API Proxy', desc: 'All RPC calls are proxied through Next.js API routes, hiding backend endpoints from the client and allowing for rate limiting and request validation.' },
        { title: 'Environment Variables', desc: 'Sensitive configuration like RPC endpoints and API keys are stored in environment variables and never exposed to the client.' },
        { title: 'Input Validation', desc: 'All user inputs (search queries, IP addresses) are validated and sanitized before being used in API calls.' },
        { title: 'HTTPS Only', desc: 'All communications are encrypted using HTTPS. The application enforces secure connections in production.' },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">{item.title}</h4>
          <p className="text-white/60 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const PerformanceContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <ZapIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// PERFORMANCE</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Performance Optimizations</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: 'Server-Side Rendering', desc: 'Initial page loads are server-rendered for fast First Contentful Paint (FCP) and better SEO.' },
        { title: 'Code Splitting', desc: 'Next.js automatically splits code by route, loading only necessary JavaScript for each page.' },
        { title: 'Custom SVG Icons', desc: 'Inline SVG icons instead of icon libraries reduce bundle size and eliminate additional network requests.' },
        { title: 'Web Workers', desc: 'Heavy computations like endpoint testing run in Web Workers to keep the main thread responsive.' },
        { title: 'Optimized Images', desc: 'Next.js Image component automatically optimizes images with lazy loading and responsive sizing.' },
        { title: 'PWA Caching', desc: 'Service worker caches static assets for offline access and faster subsequent page loads.' },
      ].map((item, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">{item.title}</h4>
          <p className="text-white/60 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const ContributingContent = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2 mb-4">
      <CodeIcon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// CONTRIBUTING</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">Contributing</h2>
    <p className="text-white/70 leading-relaxed mb-6">XanDash is open source and welcomes contributions from the community.</p>
    <div className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Getting Started</h4>
        <CodeBlock language="bash" code={`# Clone the repository
git clone https://github.com/xandeum/xandash.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev`} />
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Project Structure</h4>
        <CodeBlock language="text" code={`src/
├── app/           # Next.js App Router pages
├── components/    # React components
└── libs/          # Utilities and hooks`} />
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Contribution Guidelines</h4>
        <ul className="text-white/60 text-sm space-y-1 ml-4 list-disc">
          <li>Fork the repository and create a feature branch</li>
          <li>Follow the existing code style and conventions</li>
          <li>Write meaningful commit messages</li>
          <li>Test your changes thoroughly</li>
          <li>Submit a pull request with a clear description</li>
        </ul>
      </div>
    </div>
  </div>
);

// Content map
const contentMap: Record<string, React.FC> = {
  'introduction': IntroductionContent,
  'overview': OverviewContent,
  'quick-start': QuickStartContent,
  'analytics': AnalyticsContent,
  'pnodes': PNodesContent,
  'leaderboard': LeaderboardContent,
  'network': NetworkContent,
  'xand-token': XandTokenContent,
  'endpoints': EndpointsContent,
  'architecture': ArchitectureContent,
  'tech-stack': TechStackContent,
  'api-reference': ApiReferenceContent,
  'data-flow': DataFlowContent,
  'security': SecurityContent,
  'performance': PerformanceContent,
  'contributing': ContributingContent,
};

export function DocsClient() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedSections, setExpandedSections] = useState<string[]>(['Getting Started', 'Features', 'Technical', 'Advanced']);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
    );
  };

  const navigateTo = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  // Get current index for pagination
  const currentIndex = allItems.findIndex(item => item.id === activeSection);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  // Get current content component
  const ContentComponent = contentMap[activeSection] || IntroductionContent;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      {/* Mobile Nav Toggle */}
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
      >
        <BookIcon className="w-4 h-4" />
        <span>Documentation Menu</span>
        <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Sidebar Navigation - Fixed */}
      <aside className={`lg:w-64 flex-shrink-0 ${mobileNavOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="lg:sticky lg:top-20 space-y-2">
          <div className="relative bg-black border border-white/10 rounded-lg p-4 group hover:border-white/20 transition-all">
            <CornerAccents />
            <div className="flex items-center gap-2 mb-4">
              <BookIcon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Documentation</span>
            </div>
            
            <nav className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full text-left text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider mb-2 transition-colors"
                  >
                    <span>// {section.title}</span>
                    {expandedSections.includes(section.title) ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3" />
                    )}
                  </button>
                  
                  {expandedSections.includes(section.title) && (
                    <ul className="space-y-1 ml-2">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => navigateTo(item.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded text-sm transition-all ${
                              activeSection === item.id
                                ? 'bg-white/10 text-white border-l-2 border-white'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content - Changes based on selection */}
      <main className="flex-1 min-w-0">
        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all overflow-hidden min-h-[500px]">
          <CornerAccents />
          <ContentComponent />
        </div>

        {/* Pagination - Smaller buttons */}
        <div className="flex items-center justify-between mt-4 gap-4">
          {prevItem ? (
            <button
              onClick={() => navigateTo(prevItem.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group text-sm"
            >
              <ChevronLeftIcon className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
              <span className="text-white/60 group-hover:text-white">{prevItem.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextItem ? (
            <button
              onClick={() => navigateTo(nextItem.id)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group text-sm"
            >
              <span className="text-white/60 group-hover:text-white">{nextItem.title}</span>
              <ChevronRightIcon className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Page indicator */}
        <div className="flex items-center justify-center mt-3 gap-1">
          {allItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                activeSection === item.id 
                  ? 'bg-white w-3' 
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              title={item.title}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
