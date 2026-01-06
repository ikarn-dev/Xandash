'use client';

import React from 'react';
import { PNodeVersionCard, PNodeOnlineCard, PNodeStorageCard, PNodeUptimeCard } from '@/components/dashboard';

export const NodesStats: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-blur-reveal-1">
      <PNodeVersionCard />
      <PNodeOnlineCard />
      <PNodeStorageCard />
      <PNodeUptimeCard />
    </div>
  );
};
