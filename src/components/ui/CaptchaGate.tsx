'use client';

import { useState, useCallback, ReactNode } from 'react';
import { TurnstileWidget } from './TurnstileWidget';
import { Shield, Loader2 } from 'lucide-react';

interface CaptchaGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const STORAGE_KEY = 'captcha_verified';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export function CaptchaGate({ children, title, description }: CaptchaGateProps) {
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { timestamp } = JSON.parse(stored);
    return Date.now() - timestamp < EXPIRY_TIME;
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
        setIsVerified(true);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // If no site key configured, skip captcha
  if (!SITE_KEY) {
    return <>{children}</>;
  }

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-black/90 border border-white/10 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {title || 'Security Check'}
            </h2>
            <p className="text-white/60 text-sm">
              {description || 'Please complete the verification to access this page.'}
            </p>
          </div>

          {isVerifying ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            <TurnstileWidget
              siteKey={SITE_KEY}
              onVerify={handleVerify}
              onError={() => setError('Captcha error. Please refresh.')}
              onExpire={() => setError('Captcha expired. Please try again.')}
              theme="dark"
            />
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <p className="text-white/40 text-xs">
            Protected by Cloudflare Turnstile
          </p>
        </div>
      </div>
    </div>
  );
}
