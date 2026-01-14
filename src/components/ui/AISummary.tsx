'use client';

import { useState, useEffect, useRef } from 'react';

interface AISummaryProps {
  prompt: string;
  title?: string;
  autoLoad?: boolean;
  className?: string;
  network?: 'devnet' | 'mainnet';
}

export function AISummary({ prompt, title = 'AI Analysis', autoLoad = true, className = '', network = 'devnet' }: AISummaryProps) {
  const [summary, setSummary] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Smooth typing animation - display text as it streams
  useEffect(() => {
    setDisplayedText(summary);
  }, [summary]);

  const generateSummary = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setSummary('');
    setDisplayedText('');

    try {
      // Include network context in the prompt
      const networkContext = `[Network: ${network.toUpperCase()}] `;
      const fullPrompt = networkContext + prompt;
      
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: fullPrompt }],
          network
        })
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullText += data.content;
                setSummary(fullText);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError('Failed to generate AI summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && !hasLoaded.current && prompt) {
      hasLoaded.current = true;
      generateSummary();
    }
  }, [prompt, autoLoad]);

  // Reset when network changes
  useEffect(() => {
    hasLoaded.current = false;
    setSummary('');
    setDisplayedText('');
  }, [network]);

  return (
    <div className={`bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-medium text-white">{title}</h3>
          </div>
          {isLoading && (
            <div className="flex gap-0.5 ml-2">
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isLoading && summary && (
            <button
              onClick={(e) => { e.stopPropagation(); hasLoaded.current = false; generateSummary(); }}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="Regenerate"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
            </button>
          )}
          <svg 
            className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 pb-3" ref={contentRef}>
          {isLoading && !displayedText && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs text-white/40">Analyzing...</span>
            </div>
          )}
          
          {error && (
            <div className="py-2 text-center">
              <p className="text-xs text-red-400 mb-1">{error}</p>
              <button
                onClick={() => { hasLoaded.current = false; generateSummary(); }}
                className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
          
          {displayedText && (
            <div className="text-xs text-white/60 leading-relaxed">
              <span className="whitespace-pre-wrap">{displayedText}</span>
              {isLoading && (
                <span className="inline-block w-1.5 h-3 bg-purple-400/80 animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          )}
          
          {!isLoading && !displayedText && !error && !autoLoad && (
            <button
              onClick={generateSummary}
              className="w-full py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded transition-colors"
            >
              Generate Summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
