import { toast } from 'sonner';

export const formatNumber = (num: number, decimals = 2) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

// Format number with exact value (no abbreviation) and thousand separators
export const formatExactNumber = (num: number, decimals = 0) => {
  if (num < 1) {
    return num.toFixed(Math.max(decimals, 3));
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatUsd = (num: number) => {
  return '$' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: num < 100 ? 2 : 0,
    maximumFractionDigits: num < 100 ? 2 : 0,
  }).format(num);
};

export const shortenAddress = (address: string, chars = 4) => 
  `${address.slice(0, chars)}...${address.slice(-chars)}`;

export const copyToClipboard = async (text: string, label: string) => {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied!`);
};

export const getSolscanUrl = (address: string, type: 'account' | 'tx' = 'account') => 
  `https://solscan.io/${type}/${address}`;

export const getRealmsUrl = (daoAddress: string, proposalPubkey?: string) => {
  const base = `https://v2.realms.today/dao/${daoAddress}`;
  return proposalPubkey ? `${base}/proposal/${proposalPubkey}` : base;
};

export const getStateColor = (state: string) => {
  const colors: Record<string, string> = {
    'Completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Succeeded': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Voting': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Executable': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Defeated': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Cancelled': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'Draft': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'SigningOff': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'ExecutingWithErrors': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[state] || 'bg-white/10 text-white/60 border-white/20';
};
