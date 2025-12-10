'use client';

import React from 'react';
import { Users, DollarSign, Activity, Eye } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  bgColor: string;
  iconBgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  bgColor,
  iconBgColor,
}) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 shadow-lg border border-red-600/30`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-green-400 text-sm font-medium">
          {trend}
        </span>
      </div>
      <h3 className="text-white/90 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/60 text-xs">{subtitle}</p>
    </div>
  );
};

export const StatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Users"
        value="12,345"
        subtitle="+1,234 from last month"
        icon={Users}
        trend="+12%"
        bgColor="bg-[#CD1C18]"
        iconBgColor="bg-[#CD1C18]"
      />
      
      <StatCard
        title="Revenue"
        value="$89,432"
        subtitle="+$6,789 from last month"
        icon={DollarSign}
        trend="+8%"
        bgColor="bg-[#CD1C18]"
        iconBgColor="bg-[#CD1C18]"
      />
      
      <StatCard
        title="Active Sessions"
        value="2,847"
        subtitle="+127 from last hour"
        icon={Activity}
        trend="+5%"
        bgColor="bg-[#CD1C18]"
        iconBgColor="bg-[#CD1C18]"
      />
      
      <StatCard
        title="Page Views"
        value="45,678"
        subtitle="+5,432 from yesterday"
        icon={Eye}
        trend="+15%"
        bgColor="bg-[#CD1C18]"
        iconBgColor="bg-[#CD1C18]"
      />
    </div>
  );
};