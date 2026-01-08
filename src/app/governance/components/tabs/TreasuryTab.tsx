'use client';

import { useState, useEffect } from 'react';
import { GovernanceData, TreasuryToken, TreasuryWallet } from '../../hooks/useGovernance';
import { formatNumber, formatExactNumber, formatUsd, shortenAddress } from '../../utils/helpers';
import { AddressDisplay } from '../AddressDisplay';

export function TreasuryTab({ data }: { data: GovernanceData }) {
  const tokens = data.dao.treasury.tokens || [];
  const wallets = data.dao.treasury.wallets || [];
  const totalValue = data.dao.treasury.valueUsd;

  return (
    <div className="space-y-6">
      {/* Header with Total Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Value & Token List */}
        <div>
          <p className="text-white/50 text-[10px] sm:text-xs uppercase mb-1">Total Treasury Value</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-mono mb-6">
            {formatUsd(totalValue)}
          </p>
          
          {/* Token Breakdown */}
          <div className="space-y-2">
            {tokens.map((token) => (
              <TokenBreakdownRow key={token.symbol} token={token} totalValue={totalValue} />
            ))}
          </div>
        </div>

        {/* Right: Animated Donut Chart */}
        <div className="flex items-center justify-center py-4">
          <DonutChart tokens={tokens} totalValue={totalValue} />
        </div>
      </div>

      {/* Token Holdings Cards */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-white font-mono mb-4">// TOKEN HOLDINGS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <TokenHoldingCard key={token.symbol} token={token} />
          ))}
        </div>
      </div>

      {/* Treasury Wallets */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-white font-mono mb-4">// TREASURY WALLETS ({wallets.length})</h3>
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">WALLET</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">XAND</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">xandSOL</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">SOL</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">VALUE</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <TreasuryWalletRow key={wallet.address} wallet={wallet} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token Addresses */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-white font-mono mb-4">// TOKEN ADDRESSES</h3>
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">Token</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">Price ↓</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">24h Change ↓</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">Balance ↓</th>
                <th className="text-right py-2 px-3 text-white/50 text-[10px] sm:text-xs font-medium">Value ↓</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <TokenAddressRow key={token.symbol} token={token} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ tokens, totalValue }: { tokens: TreasuryToken[]; totalValue: number }) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate segments
  const radius = 40;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercent = 0;
  const segments = tokens.map((token, index) => {
    const percent = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
    const dashArray = (percent / 100) * circumference;
    const dashOffset = -(cumulativePercent / 100) * circumference;
    cumulativePercent += percent;
    
    return {
      token,
      percent,
      dashArray,
      dashOffset,
      index,
    };
  });

  const hoveredToken = hoveredIndex !== null ? tokens[hoveredIndex] : null;

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Token segments */}
        {segments.map(({ token, dashArray, dashOffset, index, percent }) => (
          <circle
            key={token.symbol}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={token.color}
            strokeWidth={hoveredIndex === index ? strokeWidth + 4 : strokeWidth}
            strokeDasharray={`${animated ? dashArray : 0} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out cursor-pointer"
            style={{
              filter: hoveredIndex === index ? `drop-shadow(0 0 8px ${token.color})` : 'none',
              opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hoveredToken ? (
          <>
            <div 
              className="w-3 h-3 rounded-full mb-1"
              style={{ backgroundColor: hoveredToken.color }}
            />
            <p className="text-white font-bold text-sm">{hoveredToken.symbol}</p>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">
              {formatUsd(hoveredToken.value)}
            </p>
            <p className="text-white/50 text-[10px]">
              {((hoveredToken.value / totalValue) * 100).toFixed(1)}%
            </p>
          </>
        ) : (
          <>
            <p className="text-white/50 text-[10px] uppercase">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatUsd(totalValue)}
            </p>
            <p className="text-white/50 text-[10px]">{tokens.length} Assets</p>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        {tokens.map((token, index) => (
          <div 
            key={token.symbol}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity"
            style={{ opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: token.color }}
            />
            <span className="text-white/70 text-[10px]">{token.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenBreakdownRow({ token, totalValue }: { token: TreasuryToken; totalValue: number }) {
  const percent = totalValue > 0 ? (token.value / totalValue) * 100 : 0;
  
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: token.color }}
        />
        <span className="text-white text-sm">{token.symbol}</span>
      </div>
      <div className="text-right flex items-center gap-4">
        <span className="font-mono text-sm" style={{ color: token.color }}>
          {formatUsd(token.value)}
        </span>
        <span className="text-white/40 text-xs w-14 text-right">
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function TokenHoldingCard({ token }: { token: TreasuryToken }) {
  const isPositive = token.change24h >= 0;
  
  return (
    <div className="p-4 bg-white/5 rounded hover:bg-white/10 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${token.color}20` }}
          >
            <span className="font-bold text-sm" style={{ color: token.color }}>
              {token.symbol[0]}
            </span>
          </div>
          <div>
            <p className="text-white font-medium text-sm">{token.symbol}</p>
            <p className="text-white/40 text-[10px]">{token.name}</p>
          </div>
        </div>
        {token.change24h !== 0 && (
          <div className={`text-[10px] px-1.5 py-0.5 rounded ${
            isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-white/50 text-[10px]">Balance</span>
          <span className="text-white font-mono text-sm">{formatExactNumber(token.balance, token.balance < 1 ? 3 : 0)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-white/50 text-[10px]">Price</span>
          <span className="text-white/70 font-mono text-xs">${token.price.toFixed(token.price < 1 ? 5 : 2)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
          <span className="text-white/50 text-[10px]">Value</span>
          <span className="font-mono font-bold" style={{ color: token.color }}>
            {formatUsd(token.value)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TreasuryWalletRow({ wallet, index }: { wallet: TreasuryWallet; index: number }) {
  const hasBalance = wallet.totalValue > 0;
  
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
            <span className="text-white/50 text-[10px] font-mono">{index + 1}</span>
          </div>
          <AddressDisplay address={wallet.address} chars={4} label="Wallet address" />
        </div>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-mono text-sm ${wallet.xandBalance > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
          {wallet.xandBalance > 0 ? formatExactNumber(wallet.xandBalance, 0) : '-'}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-mono text-sm ${wallet.xandsolBalance > 0 ? 'text-purple-400' : 'text-white/30'}`}>
          {wallet.xandsolBalance > 0 ? formatExactNumber(wallet.xandsolBalance, 3) : '-'}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-mono text-sm ${wallet.solBalance > 0 ? 'text-blue-400' : 'text-white/30'}`}>
          {wallet.solBalance > 0 ? formatExactNumber(wallet.solBalance, 3) : '-'}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-mono text-sm ${hasBalance ? 'text-white' : 'text-white/30'}`}>
          {hasBalance ? formatUsd(wallet.totalValue) : '-'}
        </span>
      </td>
    </tr>
  );
}

function TokenAddressRow({ token }: { token: TreasuryToken }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${token.color}20` }}
          >
            <span className="text-[10px] font-bold" style={{ color: token.color }}>
              {token.symbol[0]}
            </span>
          </div>
          <div>
            <span className="text-white text-sm font-medium">{token.symbol}</span>
            <div className="flex items-center gap-1">
              {token.mint !== 'Native' && (
                <AddressDisplay address={token.mint} chars={4} label={`${token.symbol} token address`} />
              )}
              {token.mint === 'Native' && (
                <span className="text-white/40 text-[10px]">Native SOL</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right">
        <span className="text-white font-mono text-sm">
          ${token.price < 0.01 ? token.price.toFixed(5) : token.price.toFixed(token.price < 1 ? 4 : 3)}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        {token.change24h !== 0 ? (
          <span className={`text-sm ${token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {token.change24h >= 0 ? '↑' : '↓'} {Math.abs(token.change24h).toFixed(2)}%
          </span>
        ) : (
          <span className="text-white/30 text-sm">–</span>
        )}
      </td>
      <td className="py-3 px-3 text-right">
        <span className="text-white font-mono text-sm">
          {formatExactNumber(token.balance, token.balance < 1 ? 3 : 0)}
        </span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className="text-white font-mono text-sm font-medium">
          {formatUsd(token.value)}
        </span>
      </td>
    </tr>
  );
}
