import { CornerAccents } from '@/components/ui/CornerAccents';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { XandData } from './types';
import { LinkIcon, GlobeIcon, InfoIcon, TwitterIcon } from './XandIcons';

interface XandLinksProps {
  data: XandData;
}

export function XandLinks({ data }: XandLinksProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Contract */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          <span className="text-white/60 text-sm font-mono">// CONTRACT</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 rounded p-3 mb-3">
          <span className="text-white/40 text-xs">SOL:</span>
          <span className="text-white font-mono text-xs truncate flex-1">{data.contract_address}</span>
          <CopyButton text={data.contract_address} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`https://solscan.io/token/${data.contract_address}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
            Solscan
          </a>
          <a href={`https://www.geckoterminal.com/solana/tokens/${data.contract_address}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
            GeckoTerminal
          </a>
        </div>
      </div>

      {/* Links */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <GlobeIcon className="w-4 h-4 text-blue-400" />
          <span className="text-white/60 text-sm font-mono">// LINKS</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {data.links.homepage[0] && (
            <a href={data.links.homepage[0]} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
              <GlobeIcon className="w-3 h-3" />Website
            </a>
          )}
          {data.links.whitepaper && (
            <a href={data.links.whitepaper} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
              <InfoIcon className="w-3 h-3" />Docs
            </a>
          )}
          <a href="https://x.com/Xandeum" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
            <TwitterIcon className="w-3 h-3" />Twitter/X
          </a>
        </div>
      </div>
    </div>
  );
}
