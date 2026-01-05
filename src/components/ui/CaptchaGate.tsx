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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4" strokeWidth="2"/>
  </svg>
);

// Custom Loader Icon
const LoaderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SESSION_KEY_PREFIX = 'xandash_captcha_';

export function CaptchaGate({ children, title, description, cacheKey }: CaptchaGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Generate session storage key based on cacheKey prop
  const sessionKey = cacheKey ? `${SESSION_KEY_PREFIX}${cacheKey}` : null;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setIsLocalhost(true);
        setIsVerified(true);
        return;
      }
      
      // Check session storage for cached verification (if cacheKey is provided)
      if (sessionKey) {
        const verified = sessionStorage.getItem(sessionKey);
        if (verified === 'true') {
          setIsVerified(true);
        }
      }
    }
  }, [sessionKey]);

  const handleVerify = useCallback(async (token: string) => {
    setIsVerifying(true);
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
        setIsVerified(true);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [sessionKey]);

  if (!SITE_KEY || isLocalhost) {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoaderIcon className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (isVerified) {
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
              {isVerifying ? (
                <div className="flex items-center justify-center gap-3 py-4 text-white/60">
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  <span className="font-mono text-sm">VERIFYING...</span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <TurnstileWidget
                    siteKey={SITE_KEY}
                    onVerify={handleVerify}
                    onError={() => setError('Captcha error. Please refresh.')}
                    onExpire={() => setError('Captcha expired. Please try again.')}
                    theme="dark"
                  />
                </div>
              )}
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
