'use client';

import { CornerAccents } from '@/components/ui';
import { 
  BookIcon, CodeIcon, ServerIcon, LayersIcon, DatabaseIcon, 
  GlobeIcon, ChartIcon, ShieldIcon, ZapIcon, TerminalIcon, 
  CpuIcon, LinkIcon, ChevronRightIcon, ChevronDownIcon 
} from './DocsIcons';

export interface SidebarItem {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const sidebarSections: SidebarSection[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction', icon: BookIcon },
      { id: 'overview', title: 'Dashboard Overview', icon: LayersIcon },
      { id: 'quick-start', title: 'Quick Start', icon: ZapIcon },
    ]
  },
  {
    title: 'Features',
    items: [
      { id: 'analytics', title: 'Analytics Dashboard', icon: ChartIcon },
      { id: 'pnodes', title: 'pNodes Monitoring', icon: ServerIcon },
      { id: 'leaderboard', title: 'Leaderboard', icon: ChartIcon },
      { id: 'network', title: 'Network Map', icon: GlobeIcon },
      { id: 'xand-token', title: 'XAND Token Info', icon: DatabaseIcon },
      { id: 'endpoints', title: 'Endpoint Testing', icon: TerminalIcon },
    ]
  },
  {
    title: 'Technical',
    items: [
      { id: 'architecture', title: 'Architecture', icon: CpuIcon },
      { id: 'tech-stack', title: 'Tech Stack', icon: CodeIcon },
      { id: 'api-reference', title: 'API Reference', icon: LinkIcon },
      { id: 'data-flow', title: 'Data Flow', icon: LayersIcon },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { id: 'security', title: 'Security', icon: ShieldIcon },
      { id: 'performance', title: 'Performance', icon: ZapIcon },
      { id: 'contributing', title: 'Contributing', icon: CodeIcon },
    ]
  }
];

export const allItems = sidebarSections.flatMap(s => s.items);

interface DocsSidebarProps {
  activeSection: string;
  expandedSections: string[];
  onToggleSection: (title: string) => void;
  onNavigate: (id: string) => void;
}

export function DocsSidebar({ activeSection, expandedSections, onToggleSection, onNavigate }: DocsSidebarProps) {
  return (
    <div className="lg:sticky lg:top-20 space-y-2">
      <div className="relative bg-black border border-white/10 rounded-lg p-4 group hover:border-white/20 transition-all">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <BookIcon className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Documentation</span>
        </div>
        
        <nav className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-hide">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => onToggleSection(section.title)}
                className="flex items-center justify-between w-full text-left text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider mb-2 transition-colors"
              >
                <span>// {section.title}</span>
                {expandedSections.includes(section.title) ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
              </button>
              
              {expandedSections.includes(section.title) && (
                <ul className="space-y-1 ml-2">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded text-sm transition-all ${
                          activeSection === item.id ? 'bg-white/10 text-white border-l-2 border-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
