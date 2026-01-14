'use client';

import dynamic from 'next/dynamic';

const AIAssistant = dynamic(
  () => import('./AIAssistant').then(mod => ({ default: mod.AIAssistant })),
  { ssr: false }
);

export function AIAssistantLoader() {
  return <AIAssistant />;
}
