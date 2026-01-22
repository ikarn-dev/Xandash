'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { useNetwork } from '@/libs/context/network-context';
import { useNetworkPageData } from '@/app/network/hooks/useNetworkPageData';
import { NodeSelector } from './components/NodeSelector';
import { CountrySelector } from './components/CountrySelector';
import { CompareButton } from './components/CompareButton';
import { ResultsView } from './components/ResultsView';
import { CountryResultsView } from './components/CountryResultsView';
import { CompareTypeSwitcher } from './components/CompareTypeSwitcher';
import { CornerAccents } from '@/components/ui';
import { toast } from 'sonner';
import { getNodeStatus } from '@/libs/utils/node-status';

import { useManagerAssets } from '@/app/nodes/hooks/useManagerAssets';

interface NodeData {
  pubkey: string;
  address: string;
  credits?: number;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  last_seen_timestamp?: number;
  country_code?: string;
  manager_pubkey?: string;
  score?: number;
}

interface NodeProfile {
  ip: string;
  pubkey: string;
  color: string;
  status: string;
  uptime: number;
  credits: number;
  storage_committed: number;
  storage_used: number;
  version: string;
  location?: { country: string; city: string; provider: string };
  history?: Array<{ timestamp: number; credits: number; uptime: number; storage_committed: number; storage_used: number }>;
  manager_pubkey?: string;
  score: number;
}

interface CountryData {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
  totalCredits: number;
}

interface CountryProfile extends CountryData {
  color: string;
  onlinePercent: number;
  storageEfficiency: number;
}

const NODE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];
const COUNTRY_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

// Icons for feature cards
const NodesIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const CountriesIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M20 12a8 8 0 0 1-4 6.9 8 8 0 0 1-8 0" opacity="0.5" />
  </svg>
);



function ComparePageContent() {
  const { network } = useNetwork();
  const searchParams = useSearchParams();
  const { countryDetailedStats: countryStats, loading: countryLoading } = useNetworkPageData(network);

  const { managerAssets, fetchManagerAssets } = useManagerAssets();

  const [compareType, setCompareType] = useState<'nodes' | 'countries'>('nodes');
  const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>([]);
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>([]);
  const [nodeProfiles, setNodeProfiles] = useState<NodeProfile[]>([]);
  const [countryProfiles, setCountryProfiles] = useState<CountryProfile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCountryResults, setShowCountryResults] = useState(false);
  const [autoCompareTriggered, setAutoCompareTriggered] = useState(false);
  const [autoCountryCompareTriggered, setAutoCountryCompareTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [allNodes, setAllNodes] = useState<NodeData[]>([]);
  const [serverTimestamp, setServerTimestamp] = useState<number>(0);

  useEffect(() => {
    setSelectedPubkeys([]);
    setNodeProfiles([]);
    setShowResults(false);
    setAutoCompareTriggered(false);
    setSelectedCountryCodes([]);
    setCountryProfiles([]);
    setShowCountryResults(false);
    setAutoCountryCompareTriggered(false);

    // Check for countries URL param
    const countriesParam = searchParams.get('countries');
    if (countriesParam) {
      setCompareType('countries');
    }

    const fetchNodes = async () => {
      setIsLoading(true);
      try {
        const [nodesRes, creditsRes] = await Promise.all([
          fetch(`/api/nodes?includeAll=true&network=${network}`),
          fetch(`/api/pod-credits?network=${network}`)
        ]);

        if (nodesRes.ok && creditsRes.ok) {
          const nodesData = await nodesRes.json();
          const creditsData = await creditsRes.json();
          const srvTimestamp = nodesData.serverTimestamp || Math.floor(Date.now() / 1000);
          setServerTimestamp(srvTimestamp);

          const creditsMap = new Map<string, number>();
          (creditsData.pods_credits || []).forEach((c: any) => creditsMap.set(c.pod_id, c.credits));

          const nodes = (nodesData.nodes || [])
            .map((n: any) => ({
              pubkey: n.pubkey, address: n.address, credits: creditsMap.get(n.pubkey) || 0,
              uptime: n.uptime || 0, storage_committed: n.storage_committed || 0,
              storage_used: n.storage_used || 0, version: n.version || '',
              last_seen_timestamp: n.last_seen_timestamp || 0,
              country_code: (n.country_code || '').toLowerCase(),
              manager_pubkey: n.manager_pubkey,
              score: n.score || 0,
            }))
            .sort((a: NodeData, b: NodeData) => (b.credits || 0) - (a.credits || 0));

          setAllNodes(nodes);

          const nodesParam = searchParams.get('nodes');
          const autoParam = searchParams.get('auto');

          if (nodesParam) {
            const pubkeysFromUrl = nodesParam.split(',').filter(Boolean);
            const validPubkeys = pubkeysFromUrl.filter(pk => nodes.some((n: NodeData) => n.pubkey === pk)).slice(0, 4);
            if (validPubkeys.length >= 2) {
              setSelectedPubkeys(validPubkeys);
              if (autoParam === 'true') triggerAutoCompare(validPubkeys, nodes, srvTimestamp);
            } else if (validPubkeys.length > 0) {
              setSelectedPubkeys(validPubkeys);
            }
          }
        }
      } catch { toast.error('Failed to load nodes'); }
      finally { setIsLoading(false); }
    };
    fetchNodes();
  }, [network, searchParams]);

  const triggerAutoCompare = async (pubkeys: string[], nodes: NodeData[], timestamp: number) => {
    if (pubkeys.length < 2 || autoCompareTriggered) return;
    setAutoCompareTriggered(true);
    setIsComparing(true);

    try {
      const profiles: NodeProfile[] = pubkeys.map((pubkey, i) => {
        const node = nodes.find(n => n.pubkey === pubkey);
        if (!node) return null;
        return {
          ip: node.address?.split(':')[0] || '', pubkey, color: NODE_COLORS[i % NODE_COLORS.length],
          status: getNodeStatus(node.last_seen_timestamp || 0, timestamp),
          uptime: node.uptime || 0, credits: node.credits || 0,
          storage_committed: node.storage_committed || 0, storage_used: node.storage_used || 0,
          version: node.version || '', location: undefined, history: [],
          manager_pubkey: node.manager_pubkey, score: node.score || 0,
        };
      }).filter(Boolean) as NodeProfile[];

      setNodeProfiles(profiles);
      setShowResults(true);
      setIsComparing(false);
      setIsHistoryLoading(true);

      // Fetch manager assets
      const managerPubkeys = profiles.map(p => p.manager_pubkey).filter(Boolean) as string[];
      if (managerPubkeys.length > 0) {
        fetchManagerAssets([...new Set(managerPubkeys)]);
      }

      const ips = profiles.map(p => p.ip);
      let historyByIp: Record<string, any[]> = {};
      try {
        const batchRes = await fetch(`/api/node-history?type=batch-stats&ips=${ips.join(',')}&hours=168&network=${network}`);
        if (batchRes.ok) historyByIp = (await batchRes.json()).results || {};
      } catch { }

      let locationMap: Record<string, any> = {};
      try {
        const locationRes = await fetch('/api/geolocation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ips }) });
        if (locationRes.ok) locationMap = await locationRes.json();
      } catch { }

      setNodeProfiles(prev => prev.map(profile => ({
        ...profile,
        location: locationMap[profile.ip] ? { country: locationMap[profile.ip].country, city: locationMap[profile.ip].city, provider: locationMap[profile.ip].provider } : undefined,
        history: (historyByIp[profile.ip] || []).map((h: any) => ({ timestamp: h.timestamp, credits: h.credits || 0, uptime: h.uptime || 0, storage_committed: h.storage_committed || 0, storage_used: h.storage_used || 0 }))
      })));
      setIsHistoryLoading(false);
    } catch {
      toast.error('Failed to compare nodes');
      setIsComparing(false);
      setIsHistoryLoading(false);
    }
  };

  const handleToggleNode = useCallback((pubkey: string) => {
    setSelectedPubkeys(prev => prev.includes(pubkey) ? prev.filter(p => p !== pubkey) : prev.length >= 4 ? prev : [...prev, pubkey]);
  }, []);

  const handleToggleCountry = useCallback((countryCode: string) => {
    setSelectedCountryCodes(prev => prev.includes(countryCode) ? prev.filter(c => c !== countryCode) : prev.length >= 4 ? prev : [...prev, countryCode]);
  }, []);

  const handleCompareNodes = useCallback(async () => {
    if (selectedPubkeys.length < 2) return;
    setIsComparing(true);

    try {
      const profiles: NodeProfile[] = selectedPubkeys.map((pubkey, i) => {
        const node = allNodes.find(n => n.pubkey === pubkey);
        if (!node) return null;
        return {
          ip: node.address?.split(':')[0] || '', pubkey, color: NODE_COLORS[i % NODE_COLORS.length],
          status: getNodeStatus(node.last_seen_timestamp || 0, serverTimestamp),
          uptime: node.uptime || 0, credits: node.credits || 0,
          storage_committed: node.storage_committed || 0, storage_used: node.storage_used || 0,
          version: node.version || '', location: undefined, history: [], score: node.score || 0,
        };
      }).filter(Boolean) as NodeProfile[];

      setNodeProfiles(profiles);
      setShowResults(true);
      setIsComparing(false);
      setIsHistoryLoading(true);

      // Fetch manager assets
      const managerPubkeys = profiles.map(p => p.manager_pubkey).filter(Boolean) as string[];
      if (managerPubkeys.length > 0) {
        fetchManagerAssets([...new Set(managerPubkeys)]);
      }

      const ips = profiles.map(p => p.ip);
      let historyByIp: Record<string, any[]> = {};
      try {
        const batchRes = await fetch(`/api/node-history?type=batch-stats&ips=${ips.join(',')}&hours=168&network=${network}`);
        if (batchRes.ok) historyByIp = (await batchRes.json()).results || {};
      } catch { }

      let locationMap: Record<string, any> = {};
      try {
        const locationRes = await fetch('/api/geolocation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ips }) });
        if (locationRes.ok) locationMap = await locationRes.json();
      } catch { }

      setNodeProfiles(prev => prev.map(profile => ({
        ...profile,
        location: locationMap[profile.ip] ? { country: locationMap[profile.ip].country, city: locationMap[profile.ip].city, provider: locationMap[profile.ip].provider } : undefined,
        history: (historyByIp[profile.ip] || []).map((h: any) => ({ timestamp: h.timestamp, credits: h.credits || 0, uptime: h.uptime || 0, storage_committed: h.storage_committed || 0, storage_used: h.storage_used || 0 }))
      })));
      setIsHistoryLoading(false);
    } catch {
      toast.error('Failed to compare nodes');
      setIsComparing(false);
      setIsHistoryLoading(false);
    }
  }, [selectedPubkeys, allNodes, serverTimestamp, network]);

  const handleCompareCountries = useCallback(() => {
    if (selectedCountryCodes.length < 2) return;
    setIsComparing(true);

    const profiles: CountryProfile[] = selectedCountryCodes.map((code, i) => {
      const country = countryStats.find(c => c.country_code === code);
      if (!country) return null;
      return {
        ...country, color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
        onlinePercent: country.totalNodes > 0 ? (country.onlineNodes / country.totalNodes) * 100 : 0,
        storageEfficiency: country.totalStorage > 0 ? (country.totalStorageUsed / country.totalStorage) * 100 : 0,
      };
    }).filter(Boolean) as CountryProfile[];

    setCountryProfiles(profiles);
    setShowCountryResults(true);
    setIsComparing(false);
  }, [selectedCountryCodes, countryStats]);

  const handleResetNodes = useCallback(() => { setSelectedPubkeys([]); setNodeProfiles([]); setShowResults(false); }, []);
  const handleResetCountries = useCallback(() => { setSelectedCountryCodes([]); setCountryProfiles([]); setShowCountryResults(false); }, []);
  const handleTypeChange = useCallback((type: 'nodes' | 'countries') => { setCompareType(type); handleResetNodes(); handleResetCountries(); }, [handleResetNodes, handleResetCountries]);

  const showNodeResults = compareType === 'nodes' && showResults;
  const showCountryResultsView = compareType === 'countries' && showCountryResults;
  const showSelector = !showNodeResults && !showCountryResultsView;


  return (
    <div className="space-y-6">
      {showSelector ? (
        <>
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Node Comparison Card */}
            <div
              onClick={() => handleTypeChange('nodes')}
              className={`relative bg-black border p-5 sm:p-6 cursor-pointer transition-all duration-300 group ${compareType === 'nodes'
                ? 'border-emerald-500/50'
                : 'border-white/10 hover:border-white/20'
                }`}
            >
              <CornerAccents />
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${compareType === 'nodes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                  <NodesIcon />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Node Comparison</h3>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Compare individual PNodes by credits, uptime, storage, and performance metrics
                  </p>
                </div>
                {compareType === 'nodes' && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  {['Credits', 'Uptime', 'Storage', 'History'].map(tag => (
                    <span key={tag} className="px-2 py-1 text-[10px] bg-white/5 text-white/50 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Country Comparison Card */}
            <div
              onClick={() => handleTypeChange('countries')}
              className={`relative bg-black border p-5 sm:p-6 cursor-pointer transition-all duration-300 group ${compareType === 'countries'
                ? 'border-purple-500/50'
                : 'border-white/10 hover:border-white/20'
                }`}
            >
              <CornerAccents />
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${compareType === 'countries' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40'}`}>
                  <CountriesIcon />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">Country Comparison</h3>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Compare regions by node distribution, total credits, and network health
                  </p>
                </div>
                {compareType === 'countries' && (
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  {['Nodes', 'Credits', 'Storage', 'Uptime'].map(tag => (
                    <span key={tag} className="px-2 py-1 text-[10px] bg-white/5 text-white/50 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Type Switcher */}
          <CompareTypeSwitcher activeType={compareType} onTypeChange={handleTypeChange} />

          {/* Selector Card */}
          <div className="relative bg-black border border-white/10 p-4 sm:p-6">
            <CornerAccents />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">
                {compareType === 'nodes' ? 'Select Nodes' : 'Select Countries'}
              </h2>
              {(compareType === 'nodes' ? selectedPubkeys.length : selectedCountryCodes.length) > 0 && (
                <button onClick={compareType === 'nodes' ? () => setSelectedPubkeys([]) : () => setSelectedCountryCodes([])} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {compareType === 'nodes' ? (
              <NodeSelector nodes={allNodes} selectedNodes={selectedPubkeys} onToggle={handleToggleNode} maxNodes={4} isLoading={isLoading} serverTimestamp={serverTimestamp} />
            ) : (
              <CountrySelector countries={countryStats} selectedCountries={selectedCountryCodes} onToggle={handleToggleCountry} maxCountries={4} isLoading={countryLoading} />
            )}
          </div>

          <CompareButton
            count={compareType === 'nodes' ? selectedPubkeys.length : selectedCountryCodes.length}
            minRequired={2}
            onClick={compareType === 'nodes' ? handleCompareNodes : handleCompareCountries}
            isLoading={isComparing}
            itemType={compareType}
          />
        </>
      ) : showNodeResults ? (
        <ResultsView nodes={nodeProfiles} onReset={handleResetNodes} network={network} managerAssets={managerAssets} isHistoryLoading={isHistoryLoading} />
      ) : showCountryResultsView ? (
        <CountryResultsView countries={countryProfiles} onReset={handleResetCountries} network={network} />
      ) : null}
    </div>
  );
}

export default function ComparePage() {
  return (
    <DashboardLayout>
      <ComparePageContent />
    </DashboardLayout>
  );
}
