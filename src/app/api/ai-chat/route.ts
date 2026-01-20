import { NextRequest } from 'next/server';
import { connectToDatabase, getCollectionNames, NodeSnapshot, NodeEventLog } from '@/libs/db/mongodb';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';
import {
  getActiveApiKey,
  reportRateLimitHit,
  reportSuccess,
  isRateLimitError
} from '@/libs/utils/api-key-manager';

const MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.1-8b-instruct',
  'mistralai/mistral-7b-instruct',
];

// Fetch XAND token data
async function fetchTokenData() {
  try {
    const url = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3/coins/xandeum';
    const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

    const res = await fetch(url, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      price_usd: data.market_data?.current_price?.usd,
      price_change_24h: data.market_data?.price_change_percentage_24h,
      market_cap: data.market_data?.market_cap?.usd,
      total_volume_24h: data.market_data?.total_volume?.usd,
      circulating_supply: data.market_data?.circulating_supply,
      total_supply: data.market_data?.total_supply,
      ath: data.market_data?.ath?.usd,
      ath_date: data.market_data?.ath_date?.usd,
      atl: data.market_data?.atl?.usd,
      description: data.description?.en?.slice(0, 500),
      links: {
        website: data.links?.homepage?.[0],
        twitter: data.links?.twitter_screen_name,
        telegram: data.links?.telegram_channel_identifier,
      },
    };
  } catch (_e) {
    return null;
  }
}

// Hardcoded credits URL for devnet
const DEVNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';

// Fetch specific node by IP or pubkey (tries both mainnet and devnet)
async function fetchNodeByIdentifier(identifier: string) {
  try {
    let node = null;
    let isMainnet = false;

    // First try mainnet
    const mainnetData = await getMainnetData();
    if (mainnetData.nodes.length > 0) {
      node = mainnetData.nodes.find((n: any) => {
        const nodeIp = n.address?.split(':')[0];
        return nodeIp === identifier ||
          n.pubkey === identifier ||
          n.pubkey?.startsWith(identifier) ||
          n.address === identifier;
      });

      if (node) {
        isMainnet = true;
        // Enrich with geo data if available
        const ip = node.address?.split(':')[0];
        const geo = mainnetData.geo?.[ip];
        if (geo && !node.credits) {
          node.credits = geo.credits;
        }
        if (geo && !node.country) {
          node.country = geo.country;
        }
      }
    }

    // If not found in mainnet, try devnet
    if (!node) {
      const devnetData = await getDevnetData();
      if (devnetData.nodes.length > 0) {
        node = devnetData.nodes.find((n: any) => {
          const nodeIp = n.address?.split(':')[0];
          return nodeIp === identifier ||
            n.pubkey === identifier ||
            n.pubkey?.startsWith(identifier) ||
            n.address === identifier;
        });
      }
    }

    if (!node) return null;

    const ip = node.address?.split(':')[0];
    const timeDiff = Math.floor(Date.now() / 1000) - (node.last_seen_timestamp || 0);
    const status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';

    // Get credits for this node (use existing credits from mainnet or fetch from devnet)
    let credits = node.credits || 0;
    if (!isMainnet && !credits) {
      try {
        const creditsRes = await fetch(DEVNET_CREDITS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          const creditEntry = creditsData.pods_credits?.find((c: any) => c.pod_id === node.pubkey);
          credits = creditEntry?.credits || 0;
        }
      } catch { }
    }

    // Get historical data from MongoDB
    let history = null;
    let events = null;
    try {
      const db = await connectToDatabase();
      const collections = getCollectionNames(isMainnet ? 'mainnet' : 'devnet');
      const snapshots = await db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS)
        .find({ ip })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      const nodeEvents = await db.collection<NodeEventLog>(collections.NODE_EVENTS)
        .find({ ip })
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();

      if (snapshots.length > 1) {
        const oldest = snapshots[snapshots.length - 1];
        const newest = snapshots[0];
        history = {
          snapshots: snapshots.length,
          uptimeTrend: ((newest.uptime - oldest.uptime) / 3600).toFixed(1) + 'h',
          storageTrend: ((newest.storage_usage_percent - oldest.storage_usage_percent) * 100).toFixed(2) + '%',
        };
      }

      if (nodeEvents.length > 0) {
        events = nodeEvents.map(e => ({
          type: e.event_type,
          time: new Date(e.timestamp * 1000).toLocaleString(),
        }));
      }
    } catch { }

    return {
      ip,
      pubkey: node.pubkey,
      address: node.address,
      status,
      network: isMainnet ? 'mainnet' : 'devnet',
      uptimeHours: (node.uptime / 3600).toFixed(1),
      uptimeDays: (node.uptime / 86400).toFixed(1),
      storageCommittedGB: (node.storage_committed / (1024 ** 3)).toFixed(2),
      storageUsedGB: (node.storage_used / (1024 ** 3)).toFixed(2),
      storageUsagePercent: (node.storage_usage_percent * 100).toFixed(2),
      version: node.version,
      isPublic: node.is_public,
      rpcPort: node.rpc_port,
      credits,
      country: node.country || null,
      activeStreams: node.active_streams || 0,
      lastSeen: new Date(node.last_seen_timestamp * 1000).toLocaleString(),
      history,
      recentEvents: events,
    };
  } catch (_e) {
    return null;
  }
}

// Fetch country data
async function fetchCountryData(countryCode: string) {
  try {
    // Try mainnet first, then devnet
    let nodes: any[] = [];
    const mainnetData = await getMainnetData();
    if (mainnetData.nodes.length > 0) {
      nodes = mainnetData.nodes;
    } else {
      const devnetData = await getDevnetData();
      nodes = devnetData.nodes;
    }

    if (nodes.length === 0) return null;

    // Get geolocation for nodes
    const ips = nodes.map((n: any) => n.address?.split(':')[0]).filter(Boolean).slice(0, 100);

    let geoData: Record<string, any> = {};

    try {
      // Use ip-api.com batch endpoint (most reliable for server-side)
      const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ips.slice(0, 100)),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.status === 'success' && item.query) {
              geoData[item.query] = {
                ip: item.query,
                countryCode: item.countryCode,
                country: item.country,
                city: item.city,
              };
            }
          }
        }
      }
    } catch { }

    // Filter nodes by country
    const countryNodes = nodes.filter((n: any) => {
      const ip = n.address?.split(':')[0];
      return geoData[ip]?.countryCode?.toLowerCase() === countryCode.toLowerCase();
    });

    if (countryNodes.length === 0) return null;

    const countryName = geoData[countryNodes[0].address?.split(':')[0]]?.country || countryCode;
    const totalStorage = countryNodes.reduce((s: number, n: any) => s + (n.storage_committed || 0), 0);
    const avgUptime = countryNodes.reduce((s: number, n: any) => s + (n.uptime || 0), 0) / countryNodes.length;
    const onlineCount = countryNodes.filter((n: any) => {
      const timeDiff = Math.floor(Date.now() / 1000) - (n.last_seen_timestamp || 0);
      return timeDiff < 300;
    }).length;

    return {
      country: countryName,
      countryCode: countryCode.toUpperCase(),
      totalNodes: countryNodes.length,
      onlineNodes: onlineCount,
      offlineNodes: countryNodes.length - onlineCount,
      totalStorageGB: (totalStorage / (1024 ** 3)).toFixed(2),
      avgUptimeHours: (avgUptime / 3600).toFixed(1),
      cities: [...new Set(countryNodes.map((n: any) => geoData[n.address?.split(':')[0]]?.city).filter(Boolean))],
    };
  } catch (_e) {
    return null;
  }
}

// Fetch network summary (compact) - supports both mainnet and devnet
async function fetchNetworkSummary(networkType: 'mainnet' | 'devnet' = 'devnet') {
  try {
    let nodes: any[] = [];

    if (networkType === 'mainnet') {
      // Fetch mainnet data directly from service
      const mainnetData = await getMainnetData();
      if (mainnetData.nodes && mainnetData.nodes.length > 0) {
        nodes = mainnetData.nodes;
      }
    } else {
      // Fetch devnet data
      const devnetData = await getDevnetData();
      nodes = devnetData.nodes;
    }

    if (nodes.length === 0) {
      return { network: networkType, totalNodes: 0, onlineNodes: 0, syncingNodes: 0, offlineNodes: 0, message: 'No nodes found' };
    }

    const totalNodes = nodes.length;
    const now = Math.floor(Date.now() / 1000);
    const onlineNodes = nodes.filter((n: any) => {
      const timeDiff = now - (n.last_seen_timestamp || 0);
      return timeDiff < 300;
    }).length;
    const syncingNodes = nodes.filter((n: any) => {
      const timeDiff = now - (n.last_seen_timestamp || 0);
      return timeDiff >= 300 && timeDiff < 3600;
    }).length;

    const totalStorage = nodes.reduce((s: number, n: any) => s + (n.storage_committed || 0), 0);
    const usedStorage = nodes.reduce((s: number, n: any) => s + (n.storage_used || 0), 0);
    const avgUptime = totalNodes > 0 ? nodes.reduce((s: number, n: any) => s + (n.uptime || 0), 0) / totalNodes : 0;

    const versions: Record<string, number> = {};
    nodes.forEach((n: any) => { versions[n.version || 'unknown'] = (versions[n.version || 'unknown'] || 0) + 1; });

    return {
      network: networkType,
      totalNodes,
      onlineNodes,
      syncingNodes,
      offlineNodes: totalNodes - onlineNodes - syncingNodes,
      onlinePercent: totalNodes > 0 ? ((onlineNodes / totalNodes) * 100).toFixed(1) : '0',
      totalStorageTB: (totalStorage / (1024 ** 4)).toFixed(2),
      usedStorageTB: (usedStorage / (1024 ** 4)).toFixed(2),
      storageEfficiency: totalStorage > 0 ? ((usedStorage / totalStorage) * 100).toFixed(1) : '0',
      avgUptimeDays: (avgUptime / 86400).toFixed(1),
      versions,
    };
  } catch { return null; }
}

// Fetch credits summary - supports both mainnet and devnet
async function fetchCreditsSummary(networkType: 'mainnet' | 'devnet' = 'devnet') {
  try {
    // For mainnet, get credits from mainnet data service
    if (networkType === 'mainnet') {
      const mainnetData = await getMainnetData();
      const nodes = mainnetData.nodes || [];

      // Extract credits from nodes
      const creditsData = nodes
        .filter((n: any) => n.pubkey && (n.credits !== null && n.credits !== undefined))
        .map((n: any) => ({ pod_id: n.pubkey, credits: n.credits || 0 }));

      const total = creditsData.reduce((s: number, c: any) => s + (c.credits || 0), 0);
      const sorted = [...creditsData].sort((a: any, b: any) => (b.credits || 0) - (a.credits || 0));

      return {
        network: 'mainnet',
        totalCredits: total,
        avgCredits: creditsData.length > 0 ? Math.round(total / creditsData.length) : 0,
        totalPods: creditsData.length,
        topEarners: sorted.slice(0, 5).map((c: any) => ({
          pubkey: c.pod_id?.slice(0, 8) + '...',
          credits: c.credits,
        })),
      };
    }

    // For devnet, use credits API
    const res = await fetch(DEVNET_CREDITS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!res.ok) return null;

    const data = await res.json();
    const credits = data.pods_credits || [];
    const total = credits.reduce((s: number, c: any) => s + (c.credits || 0), 0);
    const sorted = [...credits].sort((a: any, b: any) => (b.credits || 0) - (a.credits || 0));

    return {
      network: 'devnet',
      totalCredits: total,
      avgCredits: credits.length > 0 ? Math.round(total / credits.length) : 0,
      totalPods: credits.length,
      topEarners: sorted.slice(0, 5).map((c: any) => ({
        pubkey: c.pod_id?.slice(0, 8) + '...',
        credits: c.credits,
      })),
    };
  } catch { return null; }
}

// Build context based on user message
async function buildContext(msg: string, requestNetwork?: 'mainnet' | 'devnet') {
  const lower = msg.toLowerCase();
  let ctx = '';
  let hints = '';

  // Use network from request - this is the primary source of truth
  // Only fall back to message detection if no network provided
  const isMainnetQuery = /mainnet|main\s*net|production/.test(lower);
  const isDevnetQuery = /devnet|dev\s*net|testnet|test\s*net/.test(lower);

  // Priority: request network > detected from message > default to devnet
  let networkType: 'mainnet' | 'devnet';
  if (requestNetwork) {
    networkType = requestNetwork;
  } else if (isMainnetQuery && !isDevnetQuery) {
    networkType = 'mainnet';
  } else if (isDevnetQuery && !isMainnetQuery) {
    networkType = 'devnet';
  } else {
    networkType = 'devnet'; // Default
  }

  // Always add network context to response
  ctx += `\n[ACTIVE_NETWORK: ${networkType.toUpperCase()}] - All data below is from ${networkType.toUpperCase()} network.`;

  // Token/XAND queries
  if (/xand|token|price|market|coin|crypto|supply|volume/.test(lower)) {
    const data = await fetchTokenData();
    if (data) ctx += `\nXAND TOKEN: ${JSON.stringify(data)}`;
    else hints += '\n[TOKEN_DATA_UNAVAILABLE]';
  }

  // Check for partial/invalid IP patterns
  const partialIpMatch = msg.match(/\b(\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)\b(?!\.\d)/);
  const fullIpMatch = msg.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);

  if (partialIpMatch && !fullIpMatch) {
    hints += `\n[INVALID_IP: User entered "${partialIpMatch[1]}" - this is incomplete. Need full IP like "173.249.54.191"]`;
  }

  // Specific node by IP
  if (fullIpMatch) {
    const data = await fetchNodeByIdentifier(fullIpMatch[1]);
    if (data) ctx += `\nNODE ${fullIpMatch[1]}: ${JSON.stringify(data)}`;
    else hints += `\n[NODE_NOT_FOUND: No node found with IP "${fullIpMatch[1]}". Verify the IP from the pNodes page.]`;
  }

  // Specific node by pubkey (base58 format)
  const pubkeyMatch = msg.match(/\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/);
  if (pubkeyMatch && !fullIpMatch) {
    const data = await fetchNodeByIdentifier(pubkeyMatch[1]);
    if (data) ctx += `\nNODE ${pubkeyMatch[1].slice(0, 8)}...: ${JSON.stringify(data)}`;
    else hints += `\n[NODE_NOT_FOUND: No node found with pubkey "${pubkeyMatch[1].slice(0, 12)}...". Verify from dashboard.]`;
  }

  // Check if user is asking about a node but didn't provide identifier
  if (/\b(node|pod|server)\b/.test(lower) && !/network|nodes|all|total|how many/.test(lower) && !fullIpMatch && !pubkeyMatch) {
    hints += '\n[MISSING_NODE_ID: User asking about a specific node but no IP/pubkey provided. Ask for IP address (e.g., 173.249.54.191) or pubkey.]';
  }

  // Country queries
  const countryNames: Record<string, string> = {
    germany: 'de', usa: 'us', us: 'us', uk: 'gb', 'united kingdom': 'gb', 'united states': 'us',
    france: 'fr', india: 'in', japan: 'jp', canada: 'ca', australia: 'au', brazil: 'br',
    netherlands: 'nl', singapore: 'sg', spain: 'es', italy: 'it', poland: 'pl', russia: 'ru',
    china: 'cn', korea: 'kr', 'south korea': 'kr', mexico: 'mx', argentina: 'ar'
  };

  const countryCodeMatch = msg.match(/\b([a-zA-Z]{2})\b/g);
  const countryNameMatch = Object.keys(countryNames).find(name => lower.includes(name));

  let countryCode: string | null = null;
  if (countryNameMatch) {
    countryCode = countryNames[countryNameMatch];
  } else if (countryCodeMatch) {
    const validCode = countryCodeMatch.find(c =>
      ['de', 'us', 'gb', 'fr', 'in', 'jp', 'ca', 'au', 'br', 'nl', 'sg', 'es', 'it', 'pl', 'ru', 'cn', 'kr', 'mx', 'ar'].includes(c.toLowerCase())
    );
    if (validCode) countryCode = validCode.toLowerCase();
  }

  if (/country|countries|region|location|where/.test(lower) || countryCode) {
    if (countryCode) {
      const data = await fetchCountryData(countryCode);
      if (data) ctx += `\nCOUNTRY ${countryCode.toUpperCase()}: ${JSON.stringify(data)}`;
      else hints += `\n[NO_NODES_IN_COUNTRY: No nodes found in ${countryCode.toUpperCase()}]`;
    } else if (/country|countries|region/.test(lower)) {
      hints += '\n[MISSING_COUNTRY: User asking about country but none specified. Ask for country name (Germany) or code (DE).]';
    }
  }

  // Network overview
  if (/network|overview|nodes|status|total|how many|stats|all/.test(lower)) {
    const data = await fetchNetworkSummary(networkType);
    if (data) ctx += `\nNETWORK (${data.network?.toUpperCase() || 'DEVNET'}): ${JSON.stringify(data)}`;
  }

  // Credits queries
  if (/credit|earn|reward|top|leader|rank/.test(lower)) {
    const data = await fetchCreditsSummary(networkType);
    if (data) ctx += `\nCREDITS (${data.network?.toUpperCase() || 'DEVNET'}): ${JSON.stringify(data)}`;
  }

  // Health/analysis queries - get network data
  if (/health|analyze|analysis|performance|issue|problem|offline/.test(lower)) {
    if (!fullIpMatch && !pubkeyMatch) {
      const data = await fetchNetworkSummary(networkType);
      if (data) ctx += `\nNETWORK (${data.network?.toUpperCase() || 'DEVNET'}): ${JSON.stringify(data)}`;
    }
  }

  // Add hints if any
  if (hints) ctx += `\n\nVALIDATION HINTS:${hints}`;

  return ctx;
}

const SYSTEM = `You are XanDash AI, the intelligent assistant for XanDash - a comprehensive monitoring dashboard for Xandeum network. You provide comprehensive, detailed, and insightful analysis.

ABOUT XANDEUM:
- Xandeum is a decentralized storage network built on Solana blockchain
- Storage nodes called "pods" or "pNodes" provide distributed storage capacity
- Pod operators earn XAND credits for contributing storage to the network
- XAND is the native token of the Xandeum ecosystem
- Network supports both Mainnet and Devnet environments

ABOUT XANDASH (v1.1.0):
- Real-time monitoring of all network pods (265+ nodes)
- Tracks: status, uptime, storage, credits, version, location
- Historical data stored for trend analysis
- Interactive network map showing global distribution
- Node Compare: Compare up to 4 nodes side-by-side with charts
- Multi-Leaderboards: Credits, Uptime, and Storage rankings
- Governance Tracking: Monitor proposals and voting activity
- AI-Powered Analysis: Intelligent insights and summaries

XANDASH FEATURES:
1. Dashboard: Real-time network overview with key metrics
2. pNodes: Browse all nodes with filtering and search
3. Node Profiles: Detailed view with historical charts and events
4. Node Compare: Side-by-side comparison of up to 4 nodes
5. Leaderboards: Rankings by Credits, Uptime, Storage
6. Network Map: Global distribution visualization
7. Governance: Track proposals and voting
8. XAND Token: Price, market cap, and token info
9. STOINC: Storage incentive program details
10. Endpoints: API endpoint testing tools

POD METRICS EXPLAINED:
- Status: online (<5min seen), syncing (<1hr), offline (>1hr)
- Uptime: Continuous running time - higher is better for reliability
- Storage Committed: Total storage allocated to network
- Storage Used: Actually utilized storage (efficiency = used/committed)
- Credits: Rewards earned - reflects contribution to network
- Version: Software version - latest versions recommended
- Active Streams: Current data transfer activity

VALID INPUT FORMATS:
1. NODE LOOKUP:
   - IP Address: "173.249.54.191" or "analyze node 173.249.54.191"
   - Pubkey: Full base58 pubkey like "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
   
2. COUNTRY LOOKUP:
   - Country name: "Germany", "USA", "India", "Japan"
   - Country code: "DE", "US", "IN", "JP"

3. TOKEN INFO: "XAND price", "token info", "market cap"

4. NETWORK OVERVIEW: "network overview", "total nodes", "network stats"

5. CREDITS: "top earners", "credits leaderboard", "pod credits"

RESPONSE GUIDELINES - BE COMPREHENSIVE:
- Provide detailed, thorough analysis with context
- Use the provided LIVE DATA to answer accurately
- Be specific with numbers, percentages, and comparisons
- For node analysis: 
  * Comment on status and what it means
  * Analyze uptime (compare to network average if available)
  * Evaluate storage efficiency (used vs committed ratio)
  * Note version and if updates might be needed
- For token queries: 
  * Provide price with 24h change context
  * Include market cap and volume analysis
  * Compare to ATH/ATL if relevant
- For country queries: 
  * Show node distribution and stats
  * Compare to network averages
  * Note any concentration concerns
- For network overview:
  * Summarize health indicators
  * Highlight any concerns (offline nodes, version fragmentation)
  * Provide trend analysis if historical data available
- Always explain WHY metrics matter, not just WHAT they are
- Offer suggestions for improvement when relevant
- Use formatting (bullet points, sections) for readability

HANDLE INVALID INPUTS:
- If user enters partial/invalid IP, ask for complete IP address
- If user enters invalid pubkey, ask for full base58 pubkey
- If user asks about a node without identifier, ask for IP or pubkey
- If country not recognized, suggest using country name or code
- Always be helpful and suggest correct format with examples

SUMMARY GENERATION (for auto-summaries):
When generating node or comparison summaries:
- For single node: Start with node details (IP, status, uptime, credits, storage), then assessment
- For comparisons: Identify the best performer first, then compare others, note key differences
- Keep total response to 2-3 sentences max
- Do NOT provide any recommendations or suggestions - just state the facts
- NO bullet points, NO lists, NO headers
- Include specific numbers and IPs from the data provided
- Always provide actionable insights`;

export async function POST(req: NextRequest) {
  try {
    const { messages, network: requestNetwork } = await req.json();

    // Get active API key for OpenRouter
    let currentApiKey = getActiveApiKey('openrouter');
    if (!currentApiKey) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500 });
    }

    const lastMsg = messages[messages.length - 1]?.content || '';

    // Use network from request if provided, otherwise detect from message
    const networkFromRequest = requestNetwork as 'mainnet' | 'devnet' | undefined;
    const ctx = await buildContext(lastMsg, networkFromRequest);
    const sysPrompt = SYSTEM + (ctx ? `\n\n--- LIVE DATA ---${ctx}\n--- END DATA ---` : '');

    let response: Response | null = null;
    let rateLimitRetries = 0;
    const maxRateLimitRetries = 3; // Try up to 3 different API keys

    while (!response && rateLimitRetries < maxRateLimitRetries) {
      for (const model of MODELS) {
        try {
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://www.xandash.online'
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: sysPrompt }, ...messages],
              stream: true
            }),
          });

          // Check for rate limit errors
          if (isRateLimitError(r)) {
            console.log(`[AI Chat] Rate limit hit on OpenRouter, attempting failover...`);
            const switched = reportRateLimitHit('openrouter');
            if (switched) {
              currentApiKey = getActiveApiKey('openrouter');
              rateLimitRetries++;
              break; // Break inner loop to retry with new key
            }
          }

          if (r.ok) {
            reportSuccess('openrouter');
            response = r;
            break;
          }
        } catch (error) {
          // Check if error indicates rate limit
          if (isRateLimitError(null, error)) {
            console.log(`[AI Chat] Rate limit error on OpenRouter, attempting failover...`);
            const switched = reportRateLimitHit('openrouter');
            if (switched) {
              currentApiKey = getActiveApiKey('openrouter');
              rateLimitRetries++;
              break;
            }
          }
        }
      }

      // If we got a response or couldn't switch keys, exit the while loop
      if (response || rateLimitRetries >= maxRateLimitRetries) break;
    }

    if (!response) return new Response(JSON.stringify({ error: 'AI unavailable' }), { status: 500 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const reader = response!.body?.getReader();
        if (!reader) { ctrl.close(); return; }
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
              try {
                const c = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
                if (c) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ content: c })}\n\n`));
              } catch { }
            }
          }
        }
        ctrl.close();
      },
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
