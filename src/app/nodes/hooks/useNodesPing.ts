'use client';

import { useState, useEffect, useRef } from 'react';
import type { ValidatorData } from '@/libs/server';

interface PingResult {
  ping: number | null;
  status: 'online' | 'offline' | 'timeout';
}

export function useNodesPing(validators: ValidatorData[], network: string = 'devnet') {
  const [pings, setPings] = useState<Record<string, PingResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Devnet ping logic disabled - return empty pings
  // Mainnet uses external ping data from geoData, not this hook
  
  return { pings, isLoading };
}
