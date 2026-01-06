'use client';

import React from 'react';

interface ValidatorTableSkeletonProps {
  count?: number;
}

export const ValidatorTableSkeleton: React.FC<ValidatorTableSkeletonProps> = ({ count = 10 }) => {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Location</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">IP</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Pubkey</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Storage</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Version</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Uptime</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Credits</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: count }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-28"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-20"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-20"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-12"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </td>
                <td className="px-3 py-3">
                  <div className="h-4 bg-white/10 rounded w-16"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
