'use client';

import React from 'react';
import { Navbar } from '@/components/layout';
import { StatsCards } from './StatsCards';

export const Dashboard: React.FC = () => {
  const handleRefresh = () => {
    // Placeholder for refresh functionality
    console.log('Dashboard refreshed');
  };

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navbar */}
      <Navbar onRefresh={handleRefresh} />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <StatsCards />
      </main>
    </div>
  );
};