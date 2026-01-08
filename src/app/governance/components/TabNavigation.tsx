'use client';

export type TabType = 'proposals' | 'treasury' | 'members' | 'info';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
        active 
          ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' 
          : 'text-white/50 border-transparent hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono ${active ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Custom icons for tabs
const ProposalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15l2 2 4-4"/>
  </svg>
);

const TreasuryTabIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M12 8v8"/>
    <path d="M8 12h8"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const MembersTabIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const InfoTabIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18"/>
    <path d="M5 21V7l7-4 7 4v14"/>
    <path d="M9 21v-6h6v6"/>
    <circle cx="12" cy="10" r="1"/>
  </svg>
);

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  proposalsCount: number;
  membersCount: number;
}

export function TabNavigation({ activeTab, setActiveTab, proposalsCount, membersCount }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { 
      id: 'proposals', 
      label: 'Proposals', 
      count: proposalsCount,
      icon: <ProposalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
    { 
      id: 'treasury', 
      label: 'Treasury',
      icon: <TreasuryTabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
    { 
      id: 'members', 
      label: 'Members', 
      count: membersCount,
      icon: <MembersTabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
    { 
      id: 'info', 
      label: 'DAO Info',
      icon: <InfoTabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    },
  ];

  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-white/10">
      {tabs.map(tab => (
        <TabButton
          key={tab.id}
          active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          icon={tab.icon}
          label={tab.label}
          count={tab.count}
        />
      ))}
    </div>
  );
}
