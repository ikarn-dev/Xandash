'use client';

import { useEffect, useRef, useState } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export function TurnstileWidget({ 
  siteKey, 
  onVerify, 
  onError, 
  onExpire,
  theme = 'dark' 
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Turnstile script
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      document.head.appendChild(script);
    }

    window.onTurnstileLoad = () => setIsLoaded(true);
    // Use setTimeout to avoid setState in effect
    if (window.turnstile) {
      const timer = setTimeout(() => setIsLoaded(true), 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: onVerify,
      'error-callback': onError,
      'expired-callback': onExpire,
    });
  }, [isLoaded, siteKey, theme, onVerify, onError, onExpire]);

  return (
    <div className="flex justify-center">
      {/* Fixed size container to prevent layout shift - Turnstile widget is 300x65 */}
      <div 
        ref={containerRef} 
        className="flex items-center justify-center"
        style={{ minWidth: '300px', minHeight: '65px' }}
      >
        {!isLoaded && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
