'use client';

import { useState } from 'react';
import { CornerAccents } from '@/components/ui';
import { BookIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './components/DocsIcons';
import { DocsSidebar, sidebarSections, allItems } from './components/DocsSidebar';
import { contentMap, IntroductionContent } from './components/DocsContent';

export function DocsClient() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [expandedSections, setExpandedSections] = useState<string[]>(sidebarSections.map(s => s.title));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
    );
  };

  const navigateTo = (id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  const currentIndex = allItems.findIndex(item => item.id === activeSection);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
  const ContentComponent = contentMap[activeSection] || IntroductionContent;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      {/* Mobile Navigation Toggle - Only visible on mobile */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors w-full"
        >
          <BookIcon className="w-4 h-4" />
          <span>Documentation Menu</span>
          <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <aside className={`lg:w-64 flex-shrink-0 ${mobileNavOpen ? 'block' : 'hidden lg:block'}`}>
        <DocsSidebar
          activeSection={activeSection}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onNavigate={navigateTo}
        />
      </aside>

      <main className="flex-1 min-w-0">
        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all overflow-hidden min-h-[500px]">
          <CornerAccents />
          <ContentComponent />
        </div>

        <div className="flex items-center justify-between mt-4 gap-4">
          {prevItem ? (
            <button onClick={() => navigateTo(prevItem.id)} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group text-sm">
              <ChevronLeftIcon className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
              <span className="text-white/60 group-hover:text-white">{prevItem.title}</span>
            </button>
          ) : <div />}
          {nextItem ? (
            <button onClick={() => navigateTo(nextItem.id)} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group text-sm">
              <span className="text-white/60 group-hover:text-white">{nextItem.title}</span>
              <ChevronRightIcon className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
            </button>
          ) : <div />}
        </div>

        <div className="flex items-center justify-center mt-3 gap-1">
          {allItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${activeSection === item.id ? 'bg-white w-3' : 'bg-white/20 hover:bg-white/40'}`}
              title={item.title}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
