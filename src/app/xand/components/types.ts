export interface XandData {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string; thumb: string };
  description: { en: string };
  links: {
    homepage: string[];
    whitepaper: string;
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    chat_url: string[];
  };
  contract_address: string;
  categories: string[];
  market_data: {
    current_price: { usd: number; btc: number; eth: number };
    market_cap: { usd: number };
    market_cap_rank: number;
    fully_diluted_valuation: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_change_percentage: { usd: number };
    atl_date: { usd: string };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  community_data: {
    telegram_channel_user_count: number;
  };
  last_updated: string;
}
