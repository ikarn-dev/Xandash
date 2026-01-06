import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { TrendUpIcon, TrendDownIcon } from './XandIcons';

interface XandSentimentProps {
  data: XandData;
}

export function XandSentiment({ data }: XandSentimentProps) {
  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <span className="text-white/60 text-sm">Community Sentiment</span>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          <span className="text-emerald-400 text-xs sm:text-sm font-mono flex items-center gap-1">
            <TrendUpIcon className="w-3 h-3" />{data.sentiment_votes_up_percentage}%
          </span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${data.sentiment_votes_up_percentage}%` }}/>
            <div className="h-full bg-red-500" style={{ width: `${data.sentiment_votes_down_percentage}%` }}/>
          </div>
          <span className="text-red-400 text-xs sm:text-sm font-mono flex items-center gap-1">
            {data.sentiment_votes_down_percentage}%<TrendDownIcon className="w-3 h-3" />
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-white/40">
          <span>Watchlist: <span className="text-white font-mono">{data.watchlist_portfolio_users}</span></span>
          <span>Telegram: <span className="text-white font-mono">{data.community_data.telegram_channel_user_count}</span></span>
        </div>
      </div>
    </div>
  );
}
