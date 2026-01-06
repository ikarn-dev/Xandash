'use client';

import Link from 'next/link';

export const CodeBlock = ({ code, language = 'typescript' }: { code: string; language?: string }) => (
  <div className="relative bg-black/60 border border-white/10 rounded-lg overflow-hidden my-4">
    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
      <span className="text-white/40 text-xs font-mono">{language}</span>
    </div>
    <pre className="p-4 overflow-x-auto">
      <code className="text-sm font-mono text-emerald-400">{code}</code>
    </pre>
  </div>
);

export const SectionHeader = ({ icon: Icon, label, title }: { icon: React.FC<{ className?: string }>; label: string; title: string }) => (
  <>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-white" />
      <span className="text-white/60 text-sm font-mono">// {label}</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
  </>
);

export const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white/5 rounded-lg p-4">
    <h4 className="text-white font-semibold mb-2">{title}</h4>
    {children}
  </div>
);

export const ListItem = ({ label, desc }: { label?: string; desc: string }) => (
  <li className="text-white/60 text-sm">
    {label && <span className="text-white">{label}</span>}
    {label ? ` - ${desc}` : desc}
  </li>
);

export const LinkCard = ({ href, title, desc }: { href: string; title: string; desc: string }) => (
  <Link href={href} className="block bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors">
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-white/50 text-sm">{desc}</p>
  </Link>
);

export const StepItem = ({ step, title, desc }: { step: number; title: string; desc: string }) => (
  <div>
    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
      <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white text-sm">{step}</span>
      {title}
    </h3>
    <p className="text-white/70 text-sm ml-8">{desc}</p>
  </div>
);

export const TechItem = ({ name, desc }: { name: string; desc: string }) => (
  <div className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
    <span className="text-white text-sm font-mono">{name}</span>
    <span className="text-white/40 text-xs">{desc}</span>
  </div>
);

export const ApiEndpoint = ({ method, path, desc }: { method: string; path: string; desc: string }) => (
  <div className="bg-white/5 rounded-lg p-4">
    <div className="flex items-center gap-3 mb-2">
      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded">{method}</span>
      <code className="text-white font-mono text-sm">{path}</code>
    </div>
    <p className="text-white/60 text-sm">{desc}</p>
  </div>
);

export const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 rounded-lg p-3 text-center">
    <div className="text-white font-mono text-lg">{value}</div>
    <div className="text-white/40 text-xs">{label}</div>
  </div>
);
