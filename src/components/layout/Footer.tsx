'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/libs';

// XanDash Logo Component
export const XanDashLogo: React.FC<{ className?: string; textClassName?: string }> = ({
  className = "h-6",
  textClassName = "text-base"
}) => (
  <div className={cn("text-white font-bold flex items-center", textClassName)}>
    <span className="tracking-tight">XANDASH</span>
  </div>
);

// Custom SVG Icons
const TwitterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Analytics', href: '/' },
      { label: 'pNodes', href: '/nodes' },
      { label: 'Managers', href: '/managers' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Network', href: '/network' },
      { label: 'Governance', href: '/governance' },
    ],
    utilities: [
      { label: 'Node Compare', href: '/compare' },
      { label: 'XAND Token', href: '/xand' },
      { label: 'STOINC', href: '/stoinc' },
      { label: 'Endpoints', href: '/endpoints' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'About XanDash', href: '/about-xandash' },
      { label: 'Xandeum Docs', href: 'https://docs.xandeum.network/', external: true },
    ],
    community: [
      { label: 'Twitter/X', href: 'https://x.com/Xandeum', external: true },
      { label: 'Discord', href: 'https://discord.com/invite/mGAxAuwnR9', external: true },
      { label: 'Xandeum Website', href: 'https://www.xandeum.network/', external: true },
    ],
  };

  const socialLinks = [
    { icon: TwitterIcon, href: 'https://x.com/Xandeum', label: 'Twitter' },
    { icon: DiscordIcon, href: 'https://discord.com/invite/mGAxAuwnR9', label: 'Discord' },
    { icon: GlobeIcon, href: 'https://www.xandeum.network/', label: 'Website' },
  ];

  return (
    <footer className="bg-black border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <XanDashLogo className="h-6" textClassName="text-lg" />
              </Link>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Real-time monitoring dashboard for the Xandeum network. Track nodes, analytics, and network health.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">// Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Utilities Links */}
          <div>
            <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">// Utilities</h4>
            <ul className="space-y-2">
              {footerLinks.utilities.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">// Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, i) => (
                <li key={i}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={link.href} className="text-white/60 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-4">// Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <span>© {currentYear} XanDash</span>
            <span className="text-white/20">•</span>
            <span>v2.0.0</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1">
              Built by <a href="https://x.com/iKK6600" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">Karan</a>
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
