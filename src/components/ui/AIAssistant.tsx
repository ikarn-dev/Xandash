'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Triangle Logo Icon (matching navbar)
const TriangleLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L23 26 L1 26 Z" />
  </svg>
);

const SendIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinimizeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                return newMessages;
              });
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Floating Button - Black/White theme */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-black/50 cursor-pointer ${
          isOpen
            ? 'bg-white/10 border border-white/30'
            : 'bg-white hover:bg-white/90 border border-white/20'
        }`}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <CloseIcon className="w-5 h-5 text-white" />
        ) : (
          <TriangleLogo className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
        )}
      </button>

      {/* Chat Panel - Black/White theme */}
      {isOpen && (
        <div className="fixed inset-4 sm:inset-auto sm:bottom-24 sm:right-6 z-50 sm:w-[380px] sm:h-[500px] sm:max-h-[calc(100vh-140px)] bg-black/95 border border-white/15 rounded-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="px-3 sm:px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <TriangleLogo className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">XanDash AI</h3>
                <p className="text-[10px] text-white/40 hidden sm:block">Ask about nodes, network stats & more</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                  title="Clear chat"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <MinimizeIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            
            {messages.length === 0 && (
              <div className="text-center py-4 sm:py-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <TriangleLogo className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                </div>
                <p className="text-white/40 text-sm">How can I help you today?</p>
                <div className="mt-3 sm:mt-4 space-y-2">
                  {['Network overview', 'Analyze node health', 'Top performing nodes'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full px-3 py-2 text-xs text-white/60 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'bg-white/5 text-white/80 border border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-[13px] sm:text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 sm:p-3 border-t border-white/10 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <SendIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
