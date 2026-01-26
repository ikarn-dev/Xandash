import React from 'react';
import Link from 'next/link';
import { DashboardSSR, DashboardSkeleton } from '@/components/dashboard';
import { DashboardLayout } from '@/components/layout';
import { Marquee } from '@/components/ui/Marquee';

export default function Home() {
  return (
    <DashboardLayout>
      {/* SEO H1 - Visually hidden but accessible to search engines */}
      <h1 className="sr-only">
        XanDash - Xandeum Network Dashboard for pNode Monitoring and Analytics
      </h1>

      <Marquee className="mb-4 sm:mb-6" />
      <React.Suspense fallback={<DashboardSkeleton />}>
        <DashboardSSR />
      </React.Suspense>

      {/* SEO Content Section - Visible content for search engines and users */}
      <section className="relative mt-8 sm:mt-12 p-4 sm:p-6 bg-black border border-white/10 group hover:border-white/20 transition-all duration-300">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4">
          <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-4 h-4">
          <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-4 h-4">
          <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4">
          <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>

        <h2 className="text-white/70 text-[10px] sm:text-xs font-medium tracking-wider mb-4">
          // ABOUT XANDASH
        </h2>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
          Your Xandeum Network Dashboard
        </h3>
        <div className="space-y-3 text-white/60 text-xs sm:text-sm leading-relaxed">
          <p>
            <strong className="text-white/80">XanDash</strong> is the comprehensive dashboard for the{' '}
            <a
              href="https://xandeum.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 underline decoration-emerald-400/50 hover:text-emerald-200 hover:decoration-emerald-300 transition-colors"
            >
              Xandeum Network
            </a>
            , providing real-time monitoring and analytics for pNodes across the ecosystem.
            Track node performance, uptime statistics, storage utilization, and credit earnings
            with our AI-powered analytics platform.
          </p>
          <p>
            Whether you're a node operator looking to optimize your pNode performance, or a community
            member interested in network health, XanDash provides the tools and insights you need.
            Our dashboard aggregates data from across the Xandeum network to deliver comprehensive
            statistics on node distribution, version adoption, and regional coverage.
          </p>
          <p>
            Key features include real-time pNode monitoring, geographic distribution mapping,
            XAND token price tracking, governance statistics, and detailed analytics for individual
            node performance. The platform supports both Xandeum Devnet and Mainnet, allowing you
            to switch between networks seamlessly.
          </p>
        </div>

        {/* Internal Links - Critical for SEO */}
        <nav className="mt-5 pt-4 border-t border-white/10" aria-label="Quick navigation">
          <h4 className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-3">
            EXPLORE XANDASH
          </h4>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/nodes"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              pNodes Directory
            </Link>
            <Link
              href="/leaderboard"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Leaderboard
            </Link>
            <Link
              href="/managers"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Managers
            </Link>
            <Link
              href="/network"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Network Stats
            </Link>
            <Link
              href="/governance"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Governance
            </Link>
            <Link
              href="/xand"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              XAND Token
            </Link>
            <Link
              href="/docs"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Documentation
            </Link>
            <Link
              href="/compare"
              className="px-2.5 py-1 text-[10px] sm:text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200"
            >
              Compare Nodes
            </Link>
          </div>
        </nav>
      </section>
    </DashboardLayout>
  );
}
