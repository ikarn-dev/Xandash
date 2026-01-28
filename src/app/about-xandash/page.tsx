'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';

// Lazy load GSAP only when needed
let gsap: any;
let ScrollTrigger: any;

if (typeof window !== 'undefined') {
  import('gsap').then(mod => {
    gsap = mod.gsap;
    import('gsap/ScrollTrigger').then(stMod => {
      ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
    });
  });
}

// Custom SVG Icons
const NetworkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ServerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" />
  </svg>
);

const ShieldIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const DatabaseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const ZapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BellIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const EyeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const LayersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);

const MapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const TrophyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 22V8" /><path d="M14 22V8" />
    <rect x="6" y="2" width="12" height="6" rx="1" />
  </svg>
);

const CoinsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);

const BotIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M2 14h2" /><path d="M20 14h2" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
  </svg>
);

const CompareIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const WalletIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GitHubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ActivityIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// Corner Accent Component
const CornerAccents = ({ color = 'white' }: { color?: string }) => {
  const colorClass = color === 'purple' ? 'bg-purple-400' : 'bg-white/20';
  const hoverClass = color === 'purple' ? 'group-hover:bg-purple-300 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]';

  return (
    <>
      <div className="absolute top-0 left-0 w-4 h-4 z-10">
        <div className={`absolute top-0 left-0 w-2 h-px ${colorClass} ${hoverClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-px h-2 ${colorClass} ${hoverClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-10">
        <div className={`absolute top-0 right-0 w-2 h-px ${colorClass} ${hoverClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-px h-2 ${colorClass} ${hoverClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-10">
        <div className={`absolute bottom-0 left-0 w-2 h-px ${colorClass} ${hoverClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-px h-2 ${colorClass} ${hoverClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-10">
        <div className={`absolute bottom-0 right-0 w-2 h-px ${colorClass} ${hoverClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-px h-2 ${colorClass} ${hoverClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};

function AboutContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const capabilitiesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const parseAnswer = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        let colorClass = 'text-white font-bold';

        if (content === 'Online') colorClass = 'text-green-400 font-bold';
        else if (content === 'Offline') colorClass = 'text-red-400 font-bold';
        else if (content === 'Syncing') colorClass = 'text-amber-400 font-bold';
        else if (content.includes('Score') || content.includes('Credits') || content.includes('Storage')) colorClass = 'text-purple-400 font-bold';

        return <span key={index} className={colorClass}>{content}</span>;
      }
      return part;
    });
  };

  useEffect(() => {
    const initAnimations = async () => {
      if (!gsap) {
        const gsapModule = await import('gsap');
        gsap = gsapModule.gsap;
        const stModule = await import('gsap/ScrollTrigger');
        ScrollTrigger = stModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
      }

      const ctx = gsap.context(() => {
        gsap.fromTo(heroRef.current?.querySelectorAll('.hero-animate') || [],
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
        );

        gsap.fromTo(featuresRef.current?.querySelectorAll('.feature-card') || [],
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
            scrollTrigger: { trigger: featuresRef.current, start: 'top 85%', toggleActions: 'play none none none' }
          }
        );

        gsap.fromTo(benefitsRef.current?.querySelectorAll('.benefit-item') || [],
          { opacity: 0, x: -20 },
          {
            opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out',
            scrollTrigger: { trigger: benefitsRef.current, start: 'top 85%', toggleActions: 'play none none none' }
          }
        );

        gsap.fromTo(capabilitiesRef.current?.querySelectorAll('.capability-card') || [],
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out',
            scrollTrigger: { trigger: capabilitiesRef.current, start: 'top 85%', toggleActions: 'play none none none' }
          }
        );

        gsap.fromTo(ctaRef.current?.querySelectorAll('.cta-animate') || [],
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', toggleActions: 'play none none none' }
          }
        );
      }, containerRef);

      return () => ctx.revert();
    };

    initAnimations();
  }, []);

  const mainFeatures = [
    { icon: EyeIcon, title: 'Real-Time Node Monitoring', desc: 'Track all active pNodes with live status updates. Monitor online/offline states, uptime, storage usage, and credits in real-time.' },
    { icon: CompareIcon, title: 'Node Compare (Up to 4)', desc: 'Compare up to 4 nodes side-by-side with detailed metrics, historical charts, and AI-powered analysis. Select nodes directly from tables.' },
    { icon: MapIcon, title: 'Interactive Network Map', desc: 'Visualize global node distribution across multiple regions. Click on markers to view node details and navigate to profiles.' },
    { icon: TrophyIcon, title: 'Multi-Leaderboards', desc: 'Rankings by Credits, Uptime, and Storage. Track top performers and compete with other operators on the network.' },
    { icon: BotIcon, title: 'AI-Powered Analysis', desc: 'XanDash AI provides intelligent summaries on node profiles and comparisons. Chat with AI for network insights and recommendations.' },
    { icon: ShieldIcon, title: 'Governance Tracking', desc: 'Monitor proposals, treasury balance with real-time SOL conversion, voting statistics, and governance member activity.' },
    { icon: UsersIcon, title: 'Manager Profiles', desc: 'View detailed manager profiles with NFT/SBT holdings, XAND balance, managed nodes, and onchain data from Helius API.' },
    { icon: ActivityIcon, title: 'Endpoint Health', desc: 'Monitor the status and uptime of key network endpoints. Test RPC methods directly and view historical uptime graphs for Mainnet and Devnet.' },
    { icon: ChartIcon, title: 'Historical Analytics', desc: 'MongoDB-powered snapshots track node performance over time. Analyze trends, uptime patterns, and credit earnings with interactive charts.' },
    { icon: BellIcon, title: 'Node Notifications', desc: 'Get real-time alerts when your nodes go offline, come back online, or experience status changes. Dual-channel delivery via Email and Telegram.' },
  ];

  const operatorBenefits = [
    { text: 'Monitor your pNode status and uptime in real-time', icon: EyeIcon },
    { text: 'Compare your node performance against network averages', icon: CompareIcon },
    { text: 'Track credit accumulation and storage utilization', icon: CoinsIcon },
    { text: 'Receive AI-powered insights and optimization suggestions', icon: BotIcon },
    { text: 'View historical data to identify performance trends', icon: ChartIcon },
    { text: 'Stay informed about governance proposals and voting', icon: ShieldIcon },
    { text: 'Access detailed analytics for each of your nodes', icon: DatabaseIcon },
    { text: 'Benchmark against top performers on leaderboards', icon: TrophyIcon },
    { text: 'Monitor API endpoint connectivity and latency', icon: ActivityIcon },
    { text: 'Receive instant alerts via Email and Telegram', icon: BellIcon },
  ];

  const capabilities = [
    { label: 'Networks', value: 'Mainnet + Devnet', icon: NetworkIcon },
    { label: 'Auto Refresh', value: 'Live Updates', icon: ZapIcon },
    { label: 'Node Compare', value: 'Up to 4', icon: CompareIcon },
    { label: 'Historical Data', value: 'Deep History', icon: DatabaseIcon },
    { label: 'Countries', value: 'Global', icon: MapIcon },
    { label: 'AI Analysis', value: 'Powered', icon: BotIcon },
  ];

  const additionalFeatures = [
    { text: 'Country Analytics & Comparison', icon: MapIcon },
    { text: 'VPS Provider Statistics', icon: ServerIcon },
    { text: 'Version Distribution Charts', icon: ChartIcon },
    { text: 'Node Event Logs', icon: LayersIcon },
    { text: 'XAND Token Price Tracking', icon: CoinsIcon },
    { text: 'STOINC Calculator', icon: ZapIcon },
    { text: 'RPC Endpoint Tester', icon: ActivityIcon },
    { text: 'NFT/SBT Tracking', icon: TrophyIcon },
    { text: 'Quick Table Compare', icon: CompareIcon },
    { text: 'Manager Wallet Integration', icon: WalletIcon },
    { text: 'Email & Telegram Alerts', icon: BellIcon },
  ];

  const faqItems = [
    {
      question: "How is Node Status determined?",
      answer: "We use a precise heartbeat mechanism to track node activity. A node is considered **Online** if it has been seen within the last hour. If a node hasn't reported in for 1-2 hours, it is marked as **Syncing**. Nodes inactive for more than 2 hours are classified as **Offline**.",
      icon: ActivityIcon
    },
    {
      question: "How is the Node Score calculated?",
      answer: "The Node Score (0-100) is calculated identically on both **Mainnet** and **Devnet** using three components: **Uptime (40 points max)** - Scales linearly, earning 40 points for 30 days of uptime. **Storage (30 points max)** - Scales linearly, earning 30 points for committing 100GB of storage. **Online Status (30 points)** - Awards a flat 30 points if the node was seen within the last 60 minutes. Formula: Score = (Uptime ÷ 30 days × 40) + (Storage ÷ 100GB × 30) + (Online ? 30 : 0)",
      icon: TrophyIcon
    },
    {
      question: "What is STOINC?",
      answer: "STOINC (Storage Income) is our advanced revenue estimation model. It calculates potential earnings by combining your **Base Storage Credits** with **Boost Factors** from NFTs (e.g., Titan, Genesis) and Era multipliers. The formula adjusts for your share of the total network's boosted credits.",
      icon: CoinsIcon
    },
    {
      question: "How do we ensure Data Reliability?",
      answer: "XanDash employs a **Multi-Layer Failover System** for RPC connections. If a primary provider (like Helius) encounters rate limits or downtime, our API Manager automatically routes requests to backup keys and endpoints, ensuring continuous data availability without user interruption.",
      icon: ServerIcon
    },
    {
      question: "What is the High Watermark logic?",
      answer: "To ensure dashboard stability, we implement a 'High Watermark' system. If a network fetch returns an incomplete list of nodes due to temporary RPC issues, we retain the last known complete dataset. This prevents the dashboard from showing empty or flashing states.",
      icon: DatabaseIcon
    },
    {
      question: "How are Duplicate Nodes handled?",
      answer: "To maintain an accurate network view, we filter out duplicate entries based on Public Key and IP Address. If distinctions are found, we prioritize the most recently active instance, ensuring the dashboard reflects the true state of unique validators.",
      icon: UsersIcon
    },
    {
      question: "How is Geolocation determined?",
      answer: "We use IP-based geolocation to map nodes to their approximate physical locations. This allows for the interactive global map and country-based analytics without compromising operator privacy beyond standard IP resolution.",
      icon: MapIcon
    },
    {
      question: "How are Leaderboard Rankings determined?",
      answer: "Leaderboards rank nodes based on their **Node Score**. The list is sorted in descending order, showcasing the highest-performing nodes at the top. This allows operators to benchmark their performance against the network's best.",
      icon: TrophyIcon
    },
    {
      question: "How are Network Stats calculated?",
      answer: "Network-wide metrics like **Total Storage** and **Used Storage** are calculated by aggregating real-time data from all discovered pNodes. The **Average per Pod** is derived by dividing total committed storage by the validator count.",
      icon: NetworkIcon
    },
    {
      question: "How are Manager Stats aggregated?",
      answer: "Manager profiles provide a consolidated view by summing up the metrics (nodes, storage, assets) of all pNodes registered to their **Public Key**. This allows large-scale operators to monitor their entire fleet in one place.",
      icon: UsersIcon
    }
  ];

  return (
    <div ref={containerRef} className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div ref={heroRef} className="relative bg-black/50 border border-white/10 p-6 sm:p-8 md:p-10 group hover:border-white/20 transition-all overflow-hidden">
        <CornerAccents />

        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 hero-animate">
            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white/60 text-xs font-mono">v2.0</span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/60 text-sm font-mono">Mainnet + Devnet</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 hero-animate font-sans">
                XanDash
                <span className="block text-white/80 text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-1">Xandeum Network Dashboard</span>
              </h1>

              <p className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed hero-animate font-sans">
                The most comprehensive monitoring dashboard for the Xandeum decentralized storage network.
                Real-time insights, AI-powered analysis, historical tracking, and powerful comparison tools
                for node operators and community members.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 hero-animate">
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium hover:bg-white/90 transition-all font-sans">
              <ChartIcon className="w-4 h-4" />
              View Dashboard
            </Link>
            <Link href="/nodes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/10 font-sans">
              <ServerIcon className="w-4 h-4" />
              Browse Nodes
            </Link>
            <Link href="/compare" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/10 font-sans">
              <CompareIcon className="w-4 h-4" />
              Compare Nodes
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Capabilities */}
      <div ref={capabilitiesRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {capabilities.map((cap, i) => (
          <div key={i} className="capability-card relative bg-black/50 border border-white/10 p-4 group hover:border-white/20 transition-all text-center rounded-lg">
            <CornerAccents />
            <div className="p-2 bg-white/5 rounded-lg w-fit mx-auto mb-2">
              <cap.icon className="w-5 h-5 text-white/80" />
            </div>
            <div className="text-white font-bold text-sm font-sans">{cap.value}</div>
            <div className="text-white/50 text-xs font-sans">{cap.label}</div>
          </div>
        ))}
      </div>

      {/* Key Features Grid */}
      <div ref={featuresRef}>
        <div className="flex items-center gap-2 mb-4">
          <LayersIcon className="w-5 h-5 text-white/60" />
          <span className="text-white/80 text-sm font-semibold font-sans">Key Features</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainFeatures.map((feature, i) => (
            <div key={i} className="feature-card relative bg-black/50 border border-white/10 p-5 group hover:border-white/20 transition-all rounded-lg">
              <CornerAccents />
              <div className="p-2.5 bg-white/5 rounded-lg w-fit mb-3 group-hover:bg-white/10 transition-colors">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm font-sans">{feature.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed font-sans">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits for Node Operators */}
      <div ref={benefitsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative bg-black/50 border border-white/10 p-6 group hover:border-emerald-500/30 transition-all">
          <CornerAccents />

          <div className="flex items-center gap-2 mb-4">
            <ServerIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-white/80 text-sm font-semibold font-sans">For Node Operators</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 font-sans">
            Everything You Need to<br />
            <span className="text-emerald-400">Manage Your pNodes</span>
          </h2>

          <div className="space-y-0">
            {operatorBenefits.map((benefit, i) => (
              <div key={i} className="benefit-item flex items-center gap-3 p-3 bg-white/5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.08] transition-colors">
                <div className="p-1.5 bg-emerald-500/20">
                  <benefit.icon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-white/70 text-sm font-sans">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-black/50 border border-white/10 p-6 group hover:border-blue-500/30 transition-all">
          <CornerAccents />

          <div className="flex items-center gap-2 mb-4">
            <ZapIcon className="w-5 h-5 text-blue-400" />
            <span className="text-white/80 text-sm font-semibold font-sans">Additional Features</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 font-sans">
            Powerful Tools for<br />
            <span className="text-blue-400">Network Analysis</span>
          </h2>

          <div className="space-y-0">
            {additionalFeatures.map((feature, i) => (
              <div key={i} className="benefit-item flex items-center gap-3 p-3 bg-white/5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.08] transition-colors">
                <div className="p-1.5 bg-blue-500/20">
                  <feature.icon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-white/70 text-sm font-sans">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Xandeum */}
      <div className="relative bg-black/50 border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all rounded-lg">
        <CornerAccents />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DatabaseIcon className="w-5 h-5 text-white/60" />
              <span className="text-white/60 text-sm font-mono">// ABOUT_XANDEUM</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-sans">
              Decentralized Storage<br />
              <span className="text-purple-400">Built on Solana</span>
            </h2>

            <p className="text-white/70 leading-relaxed mb-4 font-sans">
              Xandeum is a next-generation decentralized storage network that enables anyone to
              contribute storage capacity through pNodes (personal nodes) and earn XAND tokens
              for participating in the network.
            </p>

            <p className="text-white/60 leading-relaxed text-sm font-sans">
              The network provides secure, distributed storage solutions that are censorship-resistant,
              highly available, and cost-effective compared to traditional cloud storage providers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ServerIcon, title: 'pNodes', desc: 'Personal storage nodes anyone can run', color: 'border-l-emerald-400' },
              { icon: ShieldIcon, title: 'Secure', desc: 'Encrypted & distributed data', color: 'border-l-blue-400' },
              { icon: ZapIcon, title: 'Fast', desc: 'Built on Solana blockchain', color: 'border-l-amber-400' },
              { icon: CoinsIcon, title: 'Rewards', desc: 'Earn XAND for contributing', color: 'border-l-purple-400' },
            ].map((item, i) => (
              <div key={i} className={`p-4 bg-white/5 rounded-lg border-l-2 ${item.color}`}>
                <item.icon className="w-5 h-5 text-white mb-2" />
                <h4 className="text-white font-semibold text-sm font-sans">{item.title}</h4>
                <p className="text-white/50 text-xs font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative bg-black border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-6">
          <ShieldIcon className="w-5 h-5 text-purple-400" />
          <span className="text-white/80 text-sm font-semibold font-sans">FAQs</span>
        </div>

        <div className="divide-y divide-white/10">
          {faqItems.map((item, i) => (
            <div key={i} className="overflow-hidden transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFaq(i);
                }}
                className="w-full flex items-center justify-between py-4 text-left transition-colors hover:bg-white/[0.02] group"
              >
                <span className={`text-sm font-medium font-sans transition-colors duration-300 ${activeFaq === i ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                  {item.question}
                </span>
                <div className={`w-5 h-5 flex items-center justify-center transition-transform duration-500 ease-spring ${activeFaq === i ? 'rotate-45' : 'rotate-0'}`}>
                  <svg className={`w-4 h-4 transition-colors duration-300 ${activeFaq === i ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-500 ease-out ${activeFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className={`text-sm text-white/50 leading-relaxed font-sans pr-8 pb-4 transition-opacity duration-300 ${activeFaq === i ? 'opacity-100' : 'opacity-0'}`}>
                    {parseAnswer(item.answer)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="relative bg-black/50 border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all text-center overflow-hidden">
        <CornerAccents />

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 cta-animate font-sans">Start Monitoring Today</h2>
        <p className="text-white/60 mb-6 max-w-xl mx-auto cta-animate font-sans">
          Join the Xandeum community and gain complete visibility into the decentralized storage network.
        </p>

        <div className="flex flex-wrap justify-center gap-3 cta-animate">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all font-sans">
            <ChartIcon className="w-4 h-4" />
            Analytics Dashboard
          </Link>
          <Link href="/managers" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/20 font-sans">
            <UsersIcon className="w-4 h-4" />
            View Managers
          </Link>
          <Link href="/governance" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/20 font-sans">
            <ShieldIcon className="w-4 h-4" />
            Governance
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 cta-animate">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="https://github.com/ikarn-dev/Xandash" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors font-sans">
              <GitHubIcon className="w-4 h-4" />
              GitHub Repository
            </a>
            <a href="https://www.xandeum.network" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors font-sans">
              <NetworkIcon className="w-4 h-4" />
              Xandeum Network
            </a>
            <a href="https://docs.xandeum.network" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors font-sans">
              <LayersIcon className="w-4 h-4" />
              Official Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <DashboardLayout>
      <AboutContent />
    </DashboardLayout>
  );
}
