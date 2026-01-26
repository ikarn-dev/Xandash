'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { TurnstileWidget } from './TurnstileWidget';

interface CaptchaGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Optional unique identifier for session-based caching (e.g., page name or feature) */
  cacheKey?: string;
}

// Custom Shield Icon matching app theme
const ShieldIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" strokeWidth="2" />
  </svg>
);

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SESSION_KEY_PREFIX = 'xandash_captcha_';

export function CaptchaGate({ children, title, description, cacheKey }: CaptchaGateProps) {
  // Use 'checking' state to show minimal black screen until we know verification status
  const [verificationState, setVerificationState] = useState<'checking' | 'verified' | 'unverified'>('checking');
  const [error, setError] = useState<string | null>(null);

  // Generate session storage key based on cacheKey prop
  const sessionKey = cacheKey ? `${SESSION_KEY_PREFIX}${cacheKey}` : null;

  useEffect(() => {
    // Immediate check - no setTimeout to speed up verified user experience
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Skip on localhost
      // Skip on localhost or PageSpeed Insights
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        navigator.userAgent.includes('Chrome-Lighthouse') ||
        navigator.userAgent.includes('PageSpeedInsights')
      ) {
        setVerificationState('verified');
        return;
      }

      // Skip if no site key configured
      if (!SITE_KEY) {
        setVerificationState('verified');
        return;
      }

      // Check session storage for cached verification (if cacheKey is provided)
      if (sessionKey) {
        const verified = sessionStorage.getItem(sessionKey);
        if (verified === 'true') {
          setVerificationState('verified');
          return;
        }
      }

      // Not verified - show captcha
      setVerificationState('unverified');
    }
  }, [sessionKey]);

  const handleVerify = useCallback(async (token: string) => {
    setError(null);

    try {
      const res = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success) {
        // Cache verification in session storage if cacheKey is provided
        if (sessionKey) {
          sessionStorage.setItem(sessionKey, 'true');
        }
        setVerificationState('verified');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  }, [sessionKey]);

  // While checking verification status, show minimal black screen to prevent skeleton flash
  if (verificationState === 'checking') {
    return (
      <div className="min-h-screen bg-black" aria-hidden="true">
        {/* Minimal loading - no skeleton flash */}
      </div>
    );
  }

  // Verified - render children normally
  if (verificationState === 'verified') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-lg blur-xl opacity-50" />

        <div className="relative bg-black border border-white/10 rounded-lg p-8 max-w-md w-full">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/50 rounded-tl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/50 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/50 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/50 rounded-br" />

          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
                <ShieldIcon className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2 font-mono">
                {title || '// SECURITY_CHECK'}
              </h2>
              <p className="text-white/50 text-sm">
                {description || 'Complete verification to access XanDash'}
              </p>
            </div>

            {/* Captcha Widget */}
            <div className="w-full">
              <div className="flex justify-center">
                <TurnstileWidget
                  siteKey={SITE_KEY}
                  onVerify={handleVerify}
                  onError={() => setError('Captcha error. Please refresh.')}
                  onExpire={() => setError('Captcha expired. Please try again.')}
                  theme="dark"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded">
                <p className="text-red-400 text-sm font-mono">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>Protected by Cloudflare Turnstile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
