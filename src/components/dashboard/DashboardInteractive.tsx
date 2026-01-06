'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SearchBox } from '@/components/ui';
import { NodeProfileCard } from '@/components/ui/NodeProfileCard';
import { nodeSearchService, type SearchableNode } from '@/libs/search/NodeSearchService';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';

export const DashboardInteractive: React.FC = () => {
  const { network } = useNetwork();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nodesData, setNodesData] = useState<SearchableNode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize search index - refetch when network changes
  const initializeSearchIndex = useCallback(async () => {
    try {
      const response = await fetch(`/api/nodes?includeAll=true&network=${network}`);
      const data = await response.json();
      
      if (data.nodes) {
        // Extract IPs for geolocation
        const ips: string[] = data.nodes
          .map((node: any) => extractIPFromAddress(node.address || ''))
          .filter((ip: string) => ip);
        
        // Fetch location data
        let locationMap: Record<string, any> = {};
        if (ips.length > 0) {
          try {
            locationMap = await getLocationsForIPs(ips);
          } catch (err) {
            console.warn('Failed to fetch location data:', err);
          }
        }

        const nodes = data.nodes.map((node: any) => {
          const ip = extractIPFromAddress(node.address || '');
          const locationData = locationMap[ip];
          
          // Pass through ALL fields from the API
          return {
            ...node, // Include all original fields first
            pod_id: node.pod_id || node.address || 'unknown',
            address: node.address || '',
            pubkey: node.pubkey || '',
            is_public: node.is_public || false,
            uptime: node.uptime || 0,
            version: node.version || 'unknown',
            rpc_port: node.rpc_port || 0,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            // CPU and memory from API
            cpu_percent: node.cpu_percent || 0,
            ram_used: node.ram_used || 0,
            ram_total: node.ram_total || 0,
            // Network stats from API
            packets_sent: node.packets_sent || 0,
            packets_received: node.packets_received || 0,
            total_bytes: node.total_bytes || 0,
            active_streams: node.active_streams || 0,
            last_seen_timestamp: node.last_seen_timestamp,
            // Add location from geolocation API
            location: locationData ? {
              country: locationData.country,
              city: locationData.city,
              region: locationData.region,
              country_code: locationData.country_code
            } : null,
          };
        });
        
        setNodesData(nodes);
        nodeSearchService.updateIndex(nodes);
      }
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      toast.error('Failed to load search data');
    }
  }, [network]);

  useEffect(() => {
    initializeSearchIndex();
  }, [initializeSearchIndex]);

  // Handle animation states
  useEffect(() => {
    if (showResults) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
    }
  }, [showResults]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (nodesData.length === 0) {
      setIsSearching(true);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = nodeSearchService.search(query.trim(), {
        limit: 10
      });
      
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [nodesData.length]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowResults(false);
      setSearchQuery('');
      setSearchResults([]);
    }, 300);
  }, []);

  const handleCopy = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showResults) {
        handleClose();
      }
    };

    if (showResults) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showResults, handleClose]);

  // Render the overlay with just the card(s)
  const renderOverlay = () => {
    if (!showResults || !mounted) return null;

    return createPortal(
      <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all"
          title="Close (Esc)"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content - Just the card(s), centered */}
        <div 
          className={`relative z-10 w-full max-w-md transition-all duration-300 ${
            isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-flex items-center space-x-3 bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/10">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                <span className="text-white/80">Searching...</span>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {/* Results count - minimal */}
              {searchResults.length > 1 && (
                <div className="text-center text-white/60 text-sm">
                  {searchResults.length} results found
                </div>
              )}
              
              {/* Cards */}
              <div className={`space-y-4 ${searchResults.length > 1 ? 'max-h-[80vh] overflow-y-auto pr-2' : ''}`}>
                {searchResults.map((node, index) => (
                  <NodeProfileCard
                    key={`${node.pod_id}-${index}`}
                    node={node}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-8 py-12 border border-white/10 text-center">
              <div className="text-white/60 text-lg mb-2">
                No results found
              </div>
              <div className="text-white/40 text-sm">
                Try searching by Pod ID, IP address, or public key
              </div>
            </div>
          ) : null}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full space-y-4">
      <SearchBox 
        onSearch={handleSearch}
        placeholder="Search by Pod ID, Address, or Public Key..."
      />

      {/* Render overlay */}
      {renderOverlay()}
    </div>
  );
};
