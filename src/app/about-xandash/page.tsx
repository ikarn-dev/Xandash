'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Custom SVG Icons
const NetworkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ServerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>
  </svg>
);

const ShieldIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const DatabaseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const ZapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const EyeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const LayersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const GitHubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// Corner Accent Component
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-6 h-6">
      <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-6 h-6">
      <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-6 h-6">
      <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-6 h-6">
      <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
  </>
);

function AboutContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation - subtle fade up
      gsap.fromTo(heroRef.current?.querySelectorAll('.hero-animate') || [],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );

      // Features cards animation - consistent fade up
      gsap.fromTo(featuresRef.current?.querySelectorAll('.feature-card') || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: featuresRef.current, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );

      // Why section animation - subtle fade up
      gsap.fromTo(whyRef.current?.querySelectorAll('.why-animate') || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: whyRef.current, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );

      // Stats counter animation - consistent fade up
      gsap.fromTo(statsRef.current?.querySelectorAll('.stat-card') || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );

      // CTA animation - subtle fade up
      gsap.fromTo(ctaRef.current?.querySelectorAll('.cta-animate') || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <div ref={heroRef} className="relative bg-black border border-white/10 p-6 sm:p-8 md:p-12 group hover:border-white/20 transition-all overflow-hidden">
        <CornerAccents />
        
        {/* Background grid effect */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 hero-animate">
            <NetworkIcon className="w-5 h-5 text-white/60" />
            <span className="text-white/60 text-sm font-mono">// ABOUT_XANDASH</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 hero-animate">
            Real-Time Monitoring for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">Xandeum Network</span>
          </h1>
          
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mb-6 hero-animate leading-relaxed">
            XanDash is a comprehensive dashboard providing real-time insights into the Xandeum 
            decentralized storage network. Monitor pNodes, track performance metrics, analyze 
            historical data, and stay informed about network health.
          </p>

          <div className="flex flex-wrap gap-3 hero-animate">
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all">
              <ChartIcon className="w-4 h-4" />
              View Dashboard
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20">
              <LayersIcon className="w-4 h-4" />
              Documentation
            </Link>
          </div>
        </div>
      </div>

      {/* What is Xandeum Section */}
      <div ref={whyRef} className="relative bg-black border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all">
        <CornerAccents />
        
        <div className="flex items-center gap-2 mb-6 why-animate">
          <DatabaseIcon className="w-5 h-5 text-white/60" />
          <span className="text-white/60 text-sm font-mono">// WHAT_IS_XANDEUM</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white why-animate">
              Decentralized Storage Network
            </h2>
            <p className="text-white/70 leading-relaxed why-animate">
              Xandeum is a next-generation decentralized storage network built on Solana. It enables 
              anyone to contribute storage capacity through pNodes (personal nodes) and earn rewards 
              for participating in the network.
            </p>
            <p className="text-white/70 leading-relaxed why-animate">
              The network provides secure, distributed storage solutions that are censorship-resistant, 
              highly available, and cost-effective compared to traditional cloud storage providers.
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              { icon: ServerIcon, title: 'pNodes', desc: 'Personal storage nodes that anyone can run to contribute to the network' },
              { icon: ShieldIcon, title: 'Secure', desc: 'Data is encrypted and distributed across multiple nodes for redundancy' },
              { icon: ZapIcon, title: 'Fast', desc: 'Built on Solana for high-speed transactions and low latency' },
              { icon: UsersIcon, title: 'Community', desc: 'Decentralized governance with rewards for network participants' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg why-animate">
                <div className="p-2 bg-white/10 rounded-lg">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                  <p className="text-white/50 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div ref={featuresRef}>
        <div className="flex items-center gap-2 mb-4">
          <LayersIcon className="w-5 h-5 text-white/60" />
          <span className="text-white/60 text-sm font-mono">// KEY_FEATURES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: EyeIcon, title: 'Real-Time Monitoring', desc: 'Track 265+ pNodes with live status updates every 30 seconds. See online/offline states, resource usage, and performance metrics instantly.' },
            { icon: NetworkIcon, title: 'Interactive Network Map', desc: 'Visualize global node distribution across 38+ locations. Explore nodes by country and region with detailed statistics.' },
            { icon: ChartIcon, title: 'Historical Analytics', desc: 'MongoDB-powered snapshots track node performance over time. Analyze trends, uptime patterns, and credit earnings.' },
            { icon: DatabaseIcon, title: 'Node Profiles', desc: 'Detailed profiles for each node including location, resources, uptime history, event logs, and credit tracking.' },
            { icon: ZapIcon, title: 'Leaderboard', desc: 'Rankings based on pod credits and node performance. See top earners and compare node statistics.' },
            { icon: ShieldIcon, title: 'CAPTCHA Protection', desc: 'Cloudflare Turnstile integration protects API endpoints from abuse while maintaining smooth user experience.' },
          ].map((feature, i) => (
            <div key={i} className="feature-card relative bg-black border border-white/10 p-5 group hover:border-white/20 transition-all">
              <CornerAccents />
              <div className="p-2.5 bg-white/10 rounded-lg w-fit mb-3">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div ref={statsRef} className="relative bg-black border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all">
        <CornerAccents />
        
        <div className="flex items-center gap-2 mb-6">
          <ChartIcon className="w-5 h-5 text-white/60" />
          <span className="text-white/60 text-sm font-mono">// PLATFORM_FEATURES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: 'Live', label: 'Real-Time Data', color: 'text-emerald-400' },
            { value: 'Global', label: 'Network Coverage', color: 'text-blue-400' },
            { value: '30s', label: 'Auto Refresh', color: 'text-amber-400' },
            { value: '7d+', label: 'Historical Data', color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="stat-card text-center p-4 bg-white/5 rounded-lg">
              <div className={`text-2xl sm:text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              <div className="text-white/50 text-xs sm:text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why XanDash Matters */}
      <div className="relative bg-black border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all">
        <CornerAccents />
        
        <div className="flex items-center gap-2 mb-6">
          <ZapIcon className="w-5 h-5 text-white/60" />
          <span className="text-white/60 text-sm font-mono">// WHY_IT_MATTERS</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Why XanDash Matters for Xandeum</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border-l-2 border-emerald-400">
              <h4 className="text-white font-semibold mb-2">Network Transparency</h4>
              <p className="text-white/60 text-sm">Provides complete visibility into network health, enabling operators and community members to make informed decisions.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border-l-2 border-blue-400">
              <h4 className="text-white font-semibold mb-2">Node Operator Tools</h4>
              <p className="text-white/60 text-sm">Helps node operators monitor their pNodes, track earnings, and identify issues before they impact performance.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border-l-2 border-amber-400">
              <h4 className="text-white font-semibold mb-2">Community Engagement</h4>
              <p className="text-white/60 text-sm">Leaderboards and statistics foster healthy competition and engagement within the Xandeum community.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border-l-2 border-purple-400">
              <h4 className="text-white font-semibold mb-2">Historical Insights</h4>
              <p className="text-white/60 text-sm">Track network growth over time with historical data, enabling trend analysis and performance optimization.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="relative bg-black border border-white/10 p-6 sm:p-8 group hover:border-white/20 transition-all text-center">
        <CornerAccents />
        
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 cta-animate">Start Exploring</h2>
        <p className="text-white/60 mb-6 max-w-xl mx-auto cta-animate">
          Dive into the Xandeum network data. Monitor nodes, track performance, and stay informed about the decentralized storage revolution.
        </p>

        <div className="flex flex-wrap justify-center gap-3 cta-animate">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all">
            <ChartIcon className="w-4 h-4" />
            Analytics Dashboard
          </Link>
          <Link href="/nodes" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20">
            <ServerIcon className="w-4 h-4" />
            View pNodes
          </Link>
          <Link href="/network" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/20">
            <NetworkIcon className="w-4 h-4" />
            Network Map
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 cta-animate">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="https://github.com/ikarn-dev/Xandash" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <GitHubIcon className="w-4 h-4" />
              GitHub Repository
            </a>
            <a href="https://www.xandeum.network" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <NetworkIcon className="w-4 h-4" />
              Xandeum Network
            </a>
            <a href="https://docs.xandeum.network" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
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
