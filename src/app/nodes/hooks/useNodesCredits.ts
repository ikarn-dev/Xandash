'use client';

import { useState, useEffect } from 'react';
import type { ValidatorData } from '@/libs/server';

interface PodCredit {
  pod_id: string;
  credits: number;
}

export function useNodesCredits(allValidators: ValidatorData[], network: string) {
  const [credits, setCredits] = useState<{ [pubkey: string]: number | null }>({});

  useEffect(() => {
    const fetchCredits = async () => {
      if (allValidators.length === 0) return;
      
      try {
        const response = await fetch(`/api/pod-credits?network=${network}`);
        if (response.ok) {
          const data = await response.json();
          if (data.pods_credits && Array.isArray(data.pods_credits)) {
            const creditsMap: { [pubkey: string]: number } = {};
            data.pods_credits.forEach((pod: PodCredit) => {
              creditsMap[pod.pod_id] = pod.credits;
            });
            setCredits(creditsMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };
    
    fetchCredits();
  }, [allValidators, network]);

  return { credits };
}
