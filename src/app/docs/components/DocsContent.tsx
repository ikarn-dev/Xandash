'use client';

import { BookIcon, CodeIcon, ServerIcon, LayersIcon, DatabaseIcon, GlobeIcon, ChartIcon, ShieldIcon, ZapIcon, TerminalIcon, CpuIcon, LinkIcon } from './DocsIcons';
import { SectionHeader, InfoCard, ListItem, LinkCard, StepItem, TechItem, ApiEndpoint, StatCard, CodeBlock } from './DocsComponents';

export const IntroductionContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={BookIcon} label="INTRODUCTION" title="Welcome to XanDash" />
    <p className="text-white/70 leading-relaxed mb-4">XanDash is a comprehensive real-time monitoring dashboard for the Xandeum network. It provides network operators, validators, and community members with detailed insights into network health, node performance, and token metrics.</p>
    <p className="text-white/70 leading-relaxed mb-4">Built with modern web technologies, XanDash offers a seamless experience across devices with PWA support, real-time data updates, and an intuitive interface designed for both beginners and advanced users.</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <StatCard label="Real-time Updates" value="30s" />
      <StatCard label="PWA Support" value="✓" />
      <StatCard label="Mobile Ready" value="✓" />
      <StatCard label="Open Source" value="✓" />
    </div>
  </div>
);

export const OverviewContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={LayersIcon} label="DASHBOARD OVERVIEW" title="Dashboard Structure" />
    <p className="text-white/70 leading-relaxed mb-6">XanDash is organized into several key sections, each providing specific functionality:</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LinkCard href="/" title="Analytics" desc="Main dashboard with network statistics, charts, and real-time metrics" />
      <LinkCard href="/nodes" title="pNodes" desc="Detailed view of all network nodes with status, resources, and performance data" />
      <LinkCard href="/leaderboard" title="Leaderboard" desc="Rankings of nodes by credits earned, uptime, and storage committed" />
      <LinkCard href="/compare" title="Node Compare" desc="Compare up to 4 nodes side-by-side with historical charts and AI analysis" />
      <LinkCard href="/managers" title="Managers" desc="View manager profiles with NFT holdings, XAND balance, and managed nodes" />
      <LinkCard href="/governance" title="Governance" desc="Track proposals, treasury balance, and voting statistics" />
      <LinkCard href="/network" title="Network" desc="Geographic distribution of nodes with interactive map and country statistics" />
      <LinkCard href="/xand" title="XAND" desc="Token information including price, market data, and supply metrics from CoinGecko" />
      <LinkCard href="/stoinc" title="STOINC" desc="Storage incentive rewards calculator for estimating earnings" />
      <LinkCard href="/endpoints" title="Endpoints" desc="RPC endpoint testing tool for checking network connectivity and response times" />
    </div>
  </div>
);

export const QuickStartContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ZapIcon} label="QUICK START" title="Getting Started" />
    <div className="space-y-6">
      <StepItem step={1} title="Navigate the Dashboard" desc="Use the top navigation bar to switch between different sections. On mobile, tap the menu icon to access navigation." />
      <StepItem step={2} title="Select Network" desc="Use the network selector in the top-right to switch between Mainnet and Testnet environments." />
      <StepItem step={3} title="Monitor Nodes" desc="Click on any node row in the pNodes table to view detailed information including location, resources, and historical data." />
      <StepItem step={4} title="Live Refresh" desc="Data automatically refreshes every 30 seconds. Use the refresh button to manually update data at any time." />
    </div>
  </div>
);

export const AnalyticsContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ChartIcon} label="ANALYTICS DASHBOARD" title="Analytics Dashboard" />
    <p className="text-white/70 leading-relaxed mb-4">The main analytics dashboard provides a comprehensive overview of the Xandeum network status:</p>
    <div className="space-y-4">
      <InfoCard title="Network Statistics Cards"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Total pNodes - Number of registered nodes on the network" /><ListItem desc="Online Nodes - Currently active and responding nodes" /><ListItem desc="Total Storage - Combined storage capacity across all nodes" /><ListItem desc="Network Uptime - Overall network availability percentage" /></ul></InfoCard>
      <InfoCard title="Interactive Charts"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Network activity over time with customizable time ranges" /><ListItem desc="Resource utilization graphs (CPU, Memory, Storage)" /><ListItem desc="Node distribution by country and region" /></ul></InfoCard>
      <InfoCard title="Global Node Map"><p className="text-white/60 text-sm">Interactive world map showing geographic distribution of all network nodes with clustering for dense regions.</p></InfoCard>
    </div>
  </div>
);

export const PNodesContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ServerIcon} label="PNODES MONITORING" title="pNodes Monitoring" />
    <p className="text-white/70 leading-relaxed mb-4">The pNodes page provides detailed monitoring for all network nodes:</p>
    <div className="space-y-4">
      <InfoCard title="Node Table Features"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Sortable columns for all metrics" /><ListItem desc="Search and filter by IP, location, or status" /><ListItem desc="Real-time status indicators (Online/Offline)" /><ListItem desc="Click any row to view detailed node profile" /></ul></InfoCard>
      <InfoCard title="Node Metrics"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="IP Address" desc="Unique identifier for the node" /><ListItem label="Status" desc="Current online/offline state" /><ListItem label="Location" desc="Geographic location (City, Country)" /><ListItem label="Storage" desc="Available and used storage" /><ListItem label="Uptime" desc="Time since last restart" /><ListItem label="Credits" desc="Earned rewards from network participation" /></ul></InfoCard>
    </div>
  </div>
);

export const LeaderboardContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ChartIcon} label="LEADERBOARD" title="Multi-Criteria Leaderboard" />
    <p className="text-white/70 leading-relaxed mb-4">The leaderboard ranks nodes based on multiple performance criteria with separate rankings for each:</p>
    <div className="space-y-4">
      <InfoCard title="Leaderboard Tabs"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Credits" desc="Rankings by total credits earned with tier badges (Diamond, Platinum, Gold, Silver, Bronze)" /><ListItem label="Uptime" desc="Rankings by total uptime duration" /><ListItem label="Storage" desc="Rankings by storage committed to the network" /></ul></InfoCard>
      <InfoCard title="Tier System (Credits Only)"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Diamond" desc="≥50,000 credits" /><ListItem label="Platinum" desc="≥25,000 credits" /><ListItem label="Gold" desc="≥10,000 credits" /><ListItem label="Silver" desc="≥5,000 credits" /><ListItem label="Bronze" desc="<5,000 credits" /></ul></InfoCard>
      <InfoCard title="Features"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Bookmark your favorite nodes for quick access" /><ListItem desc="Search by Pod ID to find specific nodes" /><ListItem desc="Pagination for browsing large datasets" /><ListItem desc="Per-network bookmarks (Mainnet/Devnet)" /></ul></InfoCard>
    </div>
  </div>
);

export const NodeCompareContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={LayersIcon} label="NODE COMPARE" title="Node Comparison Tool" />
    <p className="text-white/70 leading-relaxed mb-4">Compare up to 4 nodes side by side to analyze their performance metrics:</p>
    <div className="space-y-4">
      <InfoCard title="How to Use"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Select 2-4 nodes using checkboxes from the node list" /><ListItem desc="Use search to filter by IP address or Pod ID" /><ListItem desc="Click 'Compare' button to view results" /><ListItem desc="Results show instantly using pre-loaded data" /></ul></InfoCard>
      <InfoCard title="Comparison Metrics"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Status" desc="Online/Offline/Syncing state" /><ListItem label="Credits" desc="Total credits earned" /><ListItem label="Uptime" desc="Time since last restart" /><ListItem label="Storage" desc="Committed and used storage" /><ListItem label="Version" desc="Node software version" /><ListItem label="Location" desc="Geographic location and provider" /></ul></InfoCard>
      <InfoCard title="Historical Charts"><p className="text-white/60 text-sm">View 7-day historical trends for Credits, Uptime, Storage Committed, and Storage Used. Charts load in the background after initial results display.</p></InfoCard>
    </div>
  </div>
);

export const GovernanceContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ShieldIcon} label="GOVERNANCE" title="Governance Tracking" />
    <p className="text-white/70 leading-relaxed mb-4">Monitor Xandeum network governance proposals and treasury:</p>
    <div className="space-y-4">
      <InfoCard title="Proposals Tab"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="View active and completed governance proposals" /><ListItem desc="Track voting progress and results" /><ListItem desc="See proposal details and voting deadlines" /></ul></InfoCard>
      <InfoCard title="Treasury Tab"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Real-time treasury balance display" /><ListItem desc="SOL price conversion from CoinGecko" /><ListItem desc="Exact token amounts with thousand separators" /><ListItem desc="Treasury address with copy functionality" /></ul></InfoCard>
      <InfoCard title="Voting Stats"><p className="text-white/60 text-sm">Track overall voting participation, quorum requirements, and historical voting patterns across proposals.</p></InfoCard>
    </div>
  </div>
);

export const NetworkContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={GlobeIcon} label="NETWORK MAP" title="Network Map" />
    <p className="text-white/70 leading-relaxed mb-4">Visualize the global distribution of Xandeum network nodes:</p>
    <div className="space-y-4">
      <InfoCard title="Interactive World Map"><p className="text-white/60 text-sm">Custom SVG-based world map showing node locations with clustering for regions with multiple nodes. Hover over markers to see node counts and click to zoom into specific regions.</p></InfoCard>
      <InfoCard title="Country Statistics"><p className="text-white/60 text-sm">Click on any country card to view detailed statistics including total nodes, online rate, storage capacity, and a list of all nodes in that country.</p></InfoCard>
    </div>
  </div>
);

export const XandTokenContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={DatabaseIcon} label="XAND TOKEN INFO" title="XAND Token Information" />
    <p className="text-white/70 leading-relaxed mb-4">Real-time XAND token data fetched from the CoinGecko API:</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoCard title="Price Data"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Current price in USD, BTC, and ETH" /><ListItem desc="24h, 7d, and 30d price changes" /><ListItem desc="All-time high and low records" /></ul></InfoCard>
      <InfoCard title="Market Data"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Market cap and ranking" /><ListItem desc="24h trading volume" /><ListItem desc="Fully diluted valuation" /></ul></InfoCard>
      <InfoCard title="Supply Information"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Circulating supply with pie chart" /><ListItem desc="Total and max supply" /></ul></InfoCard>
      <InfoCard title="Links & Contract"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Contract address with copy button" /><ListItem desc="Links to Solscan and GeckoTerminal" /></ul></InfoCard>
    </div>
  </div>
);

export const EndpointsContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={TerminalIcon} label="ENDPOINT TESTING" title="Endpoint Testing" />
    <p className="text-white/70 leading-relaxed mb-4">Test RPC endpoints and check network connectivity:</p>
    <InfoCard title="Features"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Test multiple RPC endpoints simultaneously" /><ListItem desc="Measure response times and latency" /><ListItem desc="Check endpoint availability and health" /><ListItem desc="View detailed response data" /></ul></InfoCard>
  </div>
);

export const ArchitectureContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={CpuIcon} label="ARCHITECTURE" title="System Architecture" />
    <p className="text-white/70 leading-relaxed mb-4">XanDash follows a modern, scalable architecture designed for performance and reliability:</p>
    <div className="bg-white/5 rounded-lg p-6 mb-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {['Client (Browser/PWA)', 'Next.js App Router', 'API Routes', 'Xandeum RPC'].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm">{item}</div>
              {i < 3 && <span className="text-white/40">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="space-y-4">
      <InfoCard title="Frontend Layer"><p className="text-white/60 text-sm">React-based UI with server-side rendering (SSR) for initial page loads and client-side hydration for interactivity.</p></InfoCard>
      <InfoCard title="API Layer"><p className="text-white/60 text-sm">Next.js API routes act as a proxy to the Xandeum RPC endpoints, handling authentication, rate limiting, and response transformation.</p></InfoCard>
      <InfoCard title="Data Layer"><p className="text-white/60 text-sm">Real-time data from Xandeum network RPC endpoints, CoinGecko API for token data, and IP geolocation services.</p></InfoCard>
    </div>
  </div>
);

export const TechStackContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={CodeIcon} label="TECH STACK" title="Technology Stack" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full"></span>Frontend</h3>
        <div className="space-y-2"><TechItem name="Next.js 16" desc="React framework with App Router" /><TechItem name="React 19" desc="UI with Server Components" /><TechItem name="TypeScript 5" desc="Type-safe JavaScript" /><TechItem name="Tailwind CSS 4" desc="Utility-first CSS" /><TechItem name="React Query" desc="Data fetching and caching" /></div>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-white/60 rounded-full"></span>Backend & APIs</h3>
        <div className="space-y-2"><TechItem name="Next.js API Routes" desc="Serverless endpoints" /><TechItem name="MongoDB Atlas" desc="Historical data" /><TechItem name="JSON-RPC 2.0" desc="RPC protocol" /><TechItem name="CoinGecko API" desc="Token market data" /><TechItem name="Cloudflare Turnstile" desc="CAPTCHA protection" /></div>
      </div>
    </div>
  </div>
);

export const ApiReferenceContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={LinkIcon} label="API REFERENCE" title="API Reference" />
    <p className="text-white/70 leading-relaxed mb-6">XanDash uses several internal API routes to fetch and process data. All endpoints support both Mainnet and Devnet via the network query parameter:</p>
    <div className="space-y-4">
      <ApiEndpoint method="GET" path="/api/nodes" desc="Fetches all network nodes with status and metrics" />
      <ApiEndpoint method="GET" path="/api/node-profile?ip={ip}&network={network}" desc="Fetches detailed profile for a specific node including history" />
      <ApiEndpoint method="GET" path="/api/node-history?ip={ip}&type=stats&hours=168" desc="Fetches historical stats for a node" />
      <ApiEndpoint method="GET" path="/api/pod-credits?network={network}" desc="Fetches credit/reward data for all pods" />
      <ApiEndpoint method="POST" path="/api/geolocation" desc="Batch IP geolocation lookup (POST with {ips: [...]})" />
      <ApiEndpoint method="GET" path="/api/governance?network={network}" desc="Fetches governance proposals and treasury data" />
      <ApiEndpoint method="GET" path="/api/xand-info" desc="Fetches XAND token data from CoinGecko API" />
      <ApiEndpoint method="POST" path="/api/rpc" desc="Proxy endpoint for Xandeum JSON-RPC calls" />
      <ApiEndpoint method="POST" path="/api/sync-nodes" desc="Syncs all nodes to MongoDB (requires auth)" />
      <ApiEndpoint method="GET" path="/api/manager-assets?address={addr}" desc="Fetches manager Xandeum assets (XAND, XENO, NFTs, SBTs) - Primary endpoint" />
      <ApiEndpoint method="GET" path="/api/manager-wallet?address={addr}" desc="[Deprecated] Fetches manager wallet assets (SOL, Tokens, NFTs)" />
      <ApiEndpoint method="GET" path="/api/nodes-trend" desc="Fetches historical node count trends" />
      <ApiEndpoint method="GET" path="/api/rpc-status" desc="Real-time RPC endpoint health status" />
      <ApiEndpoint method="POST" path="/api/ai-chat" desc="AI assistant streaming endpoint" />
    </div>
  </div>
);

export const DataFlowContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={LayersIcon} label="DATA FLOW" title="Data Flow" />
    <p className="text-white/70 leading-relaxed mb-6">Understanding how data flows through XanDash:</p>
    <div className="space-y-4">
      {[{ title: '1. Initial Page Load (SSR)', points: ['Server fetches initial data from Xandeum RPC', 'HTML is rendered with data and sent to client', 'Client hydrates React components'] },
      { title: '2. Real-time Updates', points: ['LiveRefresh component triggers every 30 seconds', 'React Query refetches stale data in background', 'UI updates seamlessly without page reload'] },
      { title: '3. Caching Strategy', points: ['React Query caches responses with configurable stale time', 'Geolocation data cached to reduce API calls', 'Token data has 5-minute refresh cooldown'] },
      { title: '4. Error Handling', points: ['Graceful degradation when APIs are unavailable', 'Toast notifications for user feedback', 'Retry logic for failed requests'] }
      ].map((section, i) => (<InfoCard key={i} title={section.title}><div className="text-white/60 text-sm space-y-1">{section.points.map((point, j) => <p key={j}>• {point}</p>)}</div></InfoCard>))}
    </div>
  </div>
);

export const SecurityContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ShieldIcon} label="SECURITY" title="Security Considerations" />
    <div className="space-y-4">
      {[{ title: 'API Proxy', desc: 'All RPC calls are proxied through Next.js API routes, hiding backend endpoints from the client.' },
      { title: 'Environment Variables', desc: 'Sensitive configuration like RPC endpoints and API keys are stored in environment variables.' },
      { title: 'Input Validation', desc: 'All user inputs are validated and sanitized before being used in API calls.' },
      { title: 'HTTPS Only', desc: 'All communications are encrypted using HTTPS. The application enforces secure connections.' }
      ].map((item, i) => (<InfoCard key={i} title={item.title}><p className="text-white/60 text-sm">{item.desc}</p></InfoCard>))}
    </div>
  </div>
);

export const PerformanceContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ZapIcon} label="PERFORMANCE" title="Performance Optimizations" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[{ title: 'Server-Side Rendering', desc: 'Initial page loads are server-rendered for fast First Contentful Paint.' },
      { title: 'Code Splitting', desc: 'Next.js automatically splits code by route, loading only necessary JavaScript.' },
      { title: 'Custom SVG Icons', desc: 'Inline SVG icons reduce bundle size and eliminate additional network requests.' },
      { title: 'Web Workers', desc: 'Heavy computations run in Web Workers to keep the main thread responsive.' },
      { title: 'Optimized Images', desc: 'Next.js Image component automatically optimizes images with lazy loading.' },
      { title: 'PWA Caching', desc: 'Service worker caches static assets for offline access and faster loads.' }
      ].map((item, i) => (<InfoCard key={i} title={item.title}><p className="text-white/60 text-sm">{item.desc}</p></InfoCard>))}
    </div>
  </div>
);

export const ManagersContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={DatabaseIcon} label="MANAGERS" title="Manager Profiles" />
    <p className="text-white/70 leading-relaxed mb-4">View detailed information about network managers (node operators):</p>
    <div className="space-y-4">
      <InfoCard title="Manager Overview"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="View all network managers with their node counts" /><ListItem desc="Search managers by public key or node IP address" /><ListItem desc="See aggregated stats for managed nodes" /></ul></InfoCard>
      <InfoCard title="Profile Details"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Wallet Balance" desc="XAND token holdings from onchain data" /><ListItem label="NFT/SBT Holdings" desc="Titan, Genesis, and other NFT collections" /><ListItem label="Managed Nodes" desc="List of all nodes under the manager" /><ListItem label="Fleet Stats" desc="Total storage, uptime, and credits across all nodes" /></ul></InfoCard>
      <InfoCard title="Data Sources"><p className="text-white/60 text-sm">Manager data is aggregated from Helius API for onchain wallet data, and internal node tracking for fleet statistics.</p></InfoCard>
    </div>
  </div>
);

export const AIAssistantContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={CpuIcon} label="AI ASSISTANT" title="XanDash AI" />
    <p className="text-white/70 leading-relaxed mb-4">Interact with the AI-powered assistant for network insights and node analysis:</p>
    <div className="space-y-4">
      <InfoCard title="Features"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Floating chat interface accessible from any page" /><ListItem desc="Streaming responses for real-time text display" /><ListItem desc="Context-aware answers based on your queries" /></ul></InfoCard>
      <InfoCard title="Supported Queries"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Node Analysis" desc="'Analyze node 173.249.54.191'" /><ListItem label="Country Stats" desc="'Show nodes in Germany'" /><ListItem label="Network Overview" desc="'Network health summary'" /><ListItem label="Token Info" desc="'Current XAND price'" /><ListItem label="Credits" desc="'Top earning nodes'" /></ul></InfoCard>
      <InfoCard title="Auto Summaries"><p className="text-white/60 text-sm">AI automatically generates analysis summaries on Node Profile pages and after Node Comparison results, providing insights without manual prompts.</p></InfoCard>
    </div>
  </div>
);

export const ContributingContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={CodeIcon} label="CONTRIBUTING" title="Contributing" />
    <p className="text-white/70 leading-relaxed mb-6">XanDash is open source and welcomes contributions from the community.</p>
    <div className="space-y-4">
      <InfoCard title="Getting Started"><CodeBlock language="bash" code={`# Clone the repository\ngit clone https://github.com/ikarn-dev/Xandash.git\n\n# Install dependencies\nnpm install\n\n# Start development server\nnpm run dev`} /></InfoCard>
      <InfoCard title="Contribution Guidelines"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Fork the repository and create a feature branch" /><ListItem desc="Follow the existing code style and conventions" /><ListItem desc="Write meaningful commit messages" /><ListItem desc="Test your changes thoroughly" /><ListItem desc="Submit a pull request with a clear description" /></ul></InfoCard>
    </div>
  </div>
);

export const AlgorithmsContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={CpuIcon} label="ALGORITHMS" title="Algorithms & Logic" />
    <p className="text-white/70 leading-relaxed mb-4">Core algorithms and formulas used throughout XanDash:</p>
    <div className="space-y-4">
      <InfoCard title="Node Status Detection"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Online" desc="Last seen < 60 minutes" /><ListItem label="Syncing" desc="Last seen 60-120 minutes" /><ListItem label="Offline" desc="Last seen > 120 minutes" /></ul></InfoCard>
      <InfoCard title="Node Score (0-100)"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Uptime (40 pts)" desc="Linear scale, 40 points for 30 days uptime" /><ListItem label="Storage (30 pts)" desc="Linear scale, 30 points for 100GB committed" /><ListItem label="Online (30 pts)" desc="Flat 30 points if seen within 60 minutes" /></ul><p className="text-white/50 text-xs mt-2 font-mono">Formula: Score = (Uptime ÷ 30d × 40) + (Storage ÷ 100GB × 30) + (Online ? 30 : 0)</p></InfoCard>
      <InfoCard title="Leaderboard Tiers (Credits)"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem label="Diamond" desc="≥ 50,000 credits" /><ListItem label="Platinum" desc="≥ 25,000 credits" /><ListItem label="Gold" desc="≥ 10,000 credits" /><ListItem label="Silver" desc="≥ 5,000 credits" /><ListItem label="Bronze" desc="< 5,000 credits" /></ul></InfoCard>
      <InfoCard title="High Watermark Logic"><p className="text-white/60 text-sm">If a network fetch returns incomplete data, XanDash retains the last known complete dataset to prevent empty/flashing states.</p></InfoCard>
      <InfoCard title="Duplicate Handling"><p className="text-white/60 text-sm">Nodes are deduplicated by Public Key, prioritizing the most recently active instance when conflicts occur.</p></InfoCard>
    </div>
  </div>
);

export const FAQContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={BookIcon} label="FAQ" title="Frequently Asked Questions" />
    <div className="space-y-4">
      <InfoCard title="How is Node Status determined?"><p className="text-white/60 text-sm">Nodes are tracked via heartbeat mechanism. Online = seen within 1 hour, Syncing = 1-2 hours inactive, Offline = inactive for 2+ hours.</p></InfoCard>
      <InfoCard title="How is the Node Score calculated?"><p className="text-white/60 text-sm">Score (0-100) combines Uptime (40 pts for 30 days), Storage (30 pts for 100GB), and Online status (30 pts if active). Same formula on both Mainnet and Devnet.</p></InfoCard>
      <InfoCard title="What is STOINC?"><p className="text-white/60 text-sm">STOINC (Storage Income) estimates earnings by combining Base Storage Credits with NFT Boost Factors (Titan, Genesis) and Era multipliers.</p></InfoCard>
      <InfoCard title="How does Data Reliability work?"><p className="text-white/60 text-sm">XanDash uses a Multi-Layer Failover System. If primary API hits rate limits, requests automatically route to backup keys ensuring continuous availability.</p></InfoCard>
      <InfoCard title="How are Leaderboards ranked?"><p className="text-white/60 text-sm">Three separate leaderboards rank nodes by Credits (with tier badges), Uptime duration, and Storage committed. Each updates in real-time.</p></InfoCard>
      <InfoCard title="How is Geolocation determined?"><p className="text-white/60 text-sm">IP-based geolocation maps nodes to physical locations using ip-api.com batch lookups, cached for 24 hours.</p></InfoCard>
      <InfoCard title="How are Manager Stats aggregated?"><p className="text-white/60 text-sm">Manager profiles consolidate metrics from all nodes registered to their Public Key, including total storage, credits, and fleet status.</p></InfoCard>
    </div>
  </div>
);

export const NotificationsContent = () => (
  <div className="space-y-6">
    <SectionHeader icon={ZapIcon} label="NOTIFICATIONS" title="Notification System" />
    <p className="text-white/70 leading-relaxed mb-4">XanDash features a robust real-time notification system designed to keep node operators informed about critical events. It supports dual-channel alerts via Email and Telegram.</p>
    <div className="space-y-4">
      <InfoCard title="Key Features"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="Real-time alerts for Node Offline/Online status" /><ListItem desc="Notifications for Software Version changes" /><ListItem desc="Daily Credit earnings summary" /><ListItem desc="Dual-channel delivery (Email & Telegram)" /><ListItem desc="Smart throttling to prevent alert fatigue" /></ul></InfoCard>

      <InfoCard title="System Workflow"><CodeBlock language="mermaid" code={`graph TD
    User[User] -->|1. Login| Auth[Email OTP]
    Auth --> Dashboard
    Dashboard -->|2. Add Node| Bind[Bind IP]
    Dashboard -->|3. Link Telegram| Tele[Telegram Bot]
    
    System[Cron Job (5min)] -->|Check| Nodes
    Nodes -->|Status Change?| Dispatcher
    Dispatcher -->|Send| Email
    Dispatcher -->|Send| Telegram`} /></InfoCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Setting Up"><ul className="text-white/60 text-sm space-y-1 ml-4 list-disc"><ListItem desc="1. Navigate to the Notifications page" /><ListItem desc="2. Login with your email address" /><ListItem desc="3. Add your Node IP addresses" /><ListItem desc="4. (Optional) Link Telegram for instant mobile alerts" /></ul></InfoCard>
        <InfoCard title="Testing"><p className="text-white/60 text-sm">You can verify your configuration by clicking the 'Test' button on any bound node. This sends a one-time test alert to your configured channels.</p></InfoCard>
      </div>
    </div>
  </div>
);

export const contentMap: Record<string, React.FC> = {
  'introduction': IntroductionContent, 'overview': OverviewContent, 'quick-start': QuickStartContent,
  'analytics': AnalyticsContent, 'pnodes': PNodesContent, 'leaderboard': LeaderboardContent,
  'node-compare': NodeCompareContent, 'managers': ManagersContent, 'governance': GovernanceContent,
  'network': NetworkContent, 'xand-token': XandTokenContent, 'ai-assistant': AIAssistantContent, 'endpoints': EndpointsContent,
  'notifications': NotificationsContent,
  'architecture': ArchitectureContent, 'tech-stack': TechStackContent, 'api-reference': ApiReferenceContent,
  'data-flow': DataFlowContent, 'algorithms': AlgorithmsContent, 'faq': FAQContent,
  'security': SecurityContent, 'performance': PerformanceContent, 'contributing': ContributingContent,
};

