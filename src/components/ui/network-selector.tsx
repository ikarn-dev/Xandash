'use client';

import React, { useState } from 'react';
import { ChevronDown, Wifi } from 'lucide-react';

interface Network {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

const networks: Network[] = [
  { id: 'mainnet', name: 'Mainnet', status: 'online' },
  { id: 'devnet', name: 'Devnet', status: 'online' },
  { id: 'testnet', name: 'Testnet', status: 'online' },
  { id: 'localnet', name: 'Localnet', status: 'offline' },
];

export const NetworkSelector: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 cursor-pointer text-white/90 text-sm"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${selectedNetwork.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{selectedNetwork.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-50 min-w-[140px]">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => handleNetworkSelect(network)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/90 cursor-pointer first:rounded-t-lg last:rounded-b-lg hover:bg-white/5"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${network.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{network.name}</span>
              </div>
              {network.id === selectedNetwork.id && (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};