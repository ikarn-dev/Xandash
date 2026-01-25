'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { TurnstileWidget } from './TurnstileWidget';

interface AppCaptchaGateProps {
  children: ReactNode;
}

// Custom Shield Icon
const ShieldIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" strokeWidth="2" />
  </svg>
);

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SESSION_KEY = 'xandash_verified';

/**
 * Captcha Gate - Security-first approach with optimized LCP
 * 
 * Strategy: Render children immediately (visible content) while showing 
 * captcha overlay for unverified users. This improves LCP dramatically
 * while maintaining security - API endpoints still require verification.
 * 
 * For verified sessions (sessionStorage), no overlay is shown.
 */
export function AppCaptchaGate({ children }: AppCaptchaGateProps) {
  // Start with null to avoid hydration mismatch, then check on client
  const [verificationState, setVerificationState] = useState<'checking' | 'verified' | 'unverified'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Immediate check - no setTimeout to speed up verified user experience
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Skip on localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setVerificationState('verified');
        return;
      }

      // Skip if no site key configured
      if (!SITE_KEY) {
        setVerificationState('verified');
        return;
      }

      // Check session storage (persists until browser/tab closes)
      const verified = sessionStorage.getItem(SESSION_KEY);
      if (verified === 'true') {
        setVerificationState('verified');
      } else {
        setVerificationState('unverified');
      }
    }
  }, []);

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
        sessionStorage.setItem(SESSION_KEY, 'true');
        // Smooth transition
        setIsClosing(true);
        setTimeout(() => {
          setVerificationState('verified');
        }, 300);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  }, []);

  // Always render children - this is the key LCP optimization
  // The overlay only blocks interaction, not visibility
  const renderChildren = () => (
    <div className={verificationState === 'unverified' ? 'pointer-events-none select-none' : ''}>
      {children}
    </div>
  );

  // Verified or checking (SSR) - just render children
  if (verificationState === 'verified' || verificationState === 'checking') {
    return <>{children}</>;
  }

  // Unverified - show children with captcha overlay
  return (
    <>
      {/* Render content behind overlay - visible but not interactive */}
      <div className="opacity-30 blur-[2px]" aria-hidden="true">
        {renderChildren()}
      </div>

      {/* Captcha overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="captcha-title"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-xl blur-2xl" />

          <div className="relative bg-black border border-white/10 rounded-lg p-8 sm:p-10 max-w-md w-full">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500/40 rounded-br-lg" />

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldIcon className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 id="captcha-title" className="text-2xl font-bold text-white font-mono tracking-tight">
                  XanDash
                </h1>
                <p className="text-white/40 text-sm font-mono">
                  // HUMAN_VERIFICATION_REQUIRED
                </p>
              </div>

              <div className="w-full pt-2">
                <TurnstileWidget
                  siteKey={SITE_KEY}
                  onVerify={handleVerify}
                  onError={() => setError('Captcha error. Please refresh.')}
                  onExpire={() => setError('Captcha expired. Please try again.')}
                  theme="dark"
                />
              </div>

              {error && (
                <div className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 rounded">
                  <p className="text-red-400 text-sm font-mono">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-white/20 text-xs pt-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                <span>Cloudflare Turnstile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
