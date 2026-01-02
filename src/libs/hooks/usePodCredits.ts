'use client';

import { useQuery } from '@tanstack/react-query';

export interface PodCredit {
  credits: number;
  pod_id: string;
}

export interface PodCreditsResponse {
  data: PodCredit[];
  total: number;
  lastUpdated: number;
}

// Hook to fetch pod credits data
export const usePodCredits = (network: 'devnet' | 'mainnet' = 'devnet') => {
  return useQuery({
    queryKey: ['pod-credits', network],
    queryFn: async (): Promise<PodCreditsResponse> => {
      const response = await fetch(`/api/pod-credits?network=${network}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pod credits');
      }
      
      const data = await response.json();
      
      // Handle error responses
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Handle the actual API response structure
      const credits = data.pods_credits || [];
      
      return {
        data: credits,
        total: credits.length,
        lastUpdated: Date.now()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
};

// Hook to get leaderboard data sorted by credits
export const usePodCreditsLeaderboard = (network: 'devnet' | 'mainnet' = 'devnet') => {
  const { data: creditsData, isLoading, error } = usePodCredits(network);
  
  const leaderboard = creditsData?.data
    ?.sort((a, b) => b.credits - a.credits)
    ?.map((pod, index) => ({
      rank: index + 1,
      pod_id: pod.pod_id,
      credits: pod.credits,
      badge: getBadgeFromCredits(pod.credits),
      percentile: Math.round(((creditsData.data.length - index) / creditsData.data.length) * 100)
    })) || [];

  return {
    leaderboard,
    totalPods: creditsData?.total || 0,
    isLoading,
    error,
    lastUpdated: creditsData?.lastUpdated
  };
};

// Helper function to determine badge based on credits
const getBadgeFromCredits = (credits: number): string => {
  if (credits >= 50000) return 'Diamond';
  if (credits >= 25000) return 'Platinum';
  if (credits >= 10000) return 'Gold';
  if (credits >= 5000) return 'Silver';
  return 'Bronze';
};

// Hook to get statistics from credits data
export const usePodCreditsStats = (network: 'devnet' | 'mainnet' = 'devnet') => {
  const { data: creditsData, isLoading } = usePodCredits(network);
  
  if (!creditsData?.data || isLoading) {
    return {
      totalCredits: 0,
      averageCredits: 0,
      topCredits: 0,
      diamondTier: 0,
      isLoading
    };
  }
  
  const credits = creditsData.data.map(pod => pod.credits);
  const totalCredits = credits.reduce((sum, c) => sum + c, 0);
  const averageCredits = Math.round(totalCredits / credits.length);
  const topCredits = Math.max(...credits);
  const diamondTier = credits.filter(c => c >= 50000).length;
  
  return {
    totalCredits,
    averageCredits,
    topCredits,
    diamondTier,
    isLoading
  };
};