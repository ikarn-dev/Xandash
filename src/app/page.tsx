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
      <section className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white/[0.02] border border-white/10 rounded-xl">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
          About XanDash - Your Xandeum Network Dashboard
        </h2>
        <div className="space-y-4 text-white/70 text-sm leading-relaxed">
          <p>
            <strong className="text-white">XanDash</strong> is the comprehensive dashboard for the{' '}
            <a
              href="https://xandeum.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
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
        <nav className="mt-6 pt-4 border-t border-white/10" aria-label="Quick navigation">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
            Explore XanDash
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/nodes"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              pNodes Directory
            </Link>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/managers"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Managers
            </Link>
            <Link
              href="/network"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Network Stats
            </Link>
            <Link
              href="/governance"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Governance
            </Link>
            <Link
              href="/xand"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              XAND Token
            </Link>
            <Link
              href="/docs"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="/compare"
              className="px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              Compare Nodes
            </Link>
          </div>
        </nav>
      </section>
    </DashboardLayout>
  );
}
