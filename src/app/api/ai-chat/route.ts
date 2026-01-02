import { NextRequest } from 'next/server';
import { connectToDatabase, COLLECTIONS, NodeSnapshot, NodeEventLog } from '@/libs/db/mongodb';
import { callDirectRPC } from '@/libs/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
    const headers: Record<string, string> = { 'User-Agent': 'XanDash/1.0' };
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
  } catch (e) {
    console.error('Token fetch error:', e);
    return null;
  }
}

// Fetch specific node by IP or pubkey
async function fetchNodeByIdentifier(identifier: string) {
  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;
    
    const nodes = (rpcResponse.data as any)?.pods || [];
    const node = nodes.find((n: any) => {
      const nodeIp = n.address?.split(':')[0];
      return nodeIp === identifier || 
             n.pubkey === identifier || 
             n.pubkey?.startsWith(identifier) ||
             n.address === identifier;
    });
    
    if (!node) return null;
    
    const ip = node.address?.split(':')[0];
    const timeDiff = Math.floor(Date.now() / 1000) - (node.last_seen_timestamp || 0);
    const status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    
    // Get credits for this node
    let credits = 0;
    try {
      const creditsUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/devnet-pod-credits';
      const creditsRes = await fetch(creditsUrl, { headers: { 'User-Agent': 'XanDash/1.0' } });
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        const creditEntry = creditsData.pods_credits?.find((c: any) => c.pod_id === node.pubkey);
        credits = creditEntry?.credits || 0;
      }
    } catch {}
    
    // Get historical data from MongoDB
    let history = null;
    let events = null;
    try {
      const db = await connectToDatabase();
      const snapshots = await db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS)
        .find({ ip })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      
      const nodeEvents = await db.collection<NodeEventLog>(COLLECTIONS.NODE_EVENTS)
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
    } catch {}
    
    return {
      ip,
      pubkey: node.pubkey,
      address: node.address,
      status,
      uptimeHours: (node.uptime / 3600).toFixed(1),
      uptimeDays: (node.uptime / 86400).toFixed(1),
      storageCommittedGB: (node.storage_committed / (1024**3)).toFixed(2),
      storageUsedGB: (node.storage_used / (1024**3)).toFixed(2),
      storageUsagePercent: (node.storage_usage_percent * 100).toFixed(2),
      version: node.version,
      isPublic: node.is_public,
      rpcPort: node.rpc_port,
      credits,
      activeStreams: node.active_streams || 0,
      lastSeen: new Date(node.last_seen_timestamp * 1000).toLocaleString(),
      history,
      recentEvents: events,
    };
  } catch (e) {
    console.error('Node fetch error:', e);
    return null;
  }
}

// Fetch country data
async function fetchCountryData(countryCode: string) {
  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;
    
    const nodes = (rpcResponse.data as any)?.pods || [];
    
    // Get geolocation for nodes
    const ips = nodes.map((n: any) => n.address?.split(':')[0]).filter(Boolean).slice(0, 100);
    
    let geoData: Record<string, any> = {};
    try {
      const batchUrl = process.env.NEXT_PUBLIC_IP_API_BATCH_URL || 'http://ip-api.com/batch';
      const geoRes = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ips.map((ip: string) => ({ query: ip, fields: 'countryCode,country,city' }))),
      });
      if (geoRes.ok) {
        const geoResults = await geoRes.json();
        geoResults.forEach((g: any, i: number) => {
          if (g.countryCode) geoData[ips[i]] = g;
        });
      }
    } catch {}
    
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
      totalStorageGB: (totalStorage / (1024**3)).toFixed(2),
      avgUptimeHours: (avgUptime / 3600).toFixed(1),
      cities: [...new Set(countryNodes.map((n: any) => geoData[n.address?.split(':')[0]]?.city).filter(Boolean))],
    };
  } catch (e) {
    console.error('Country fetch error:', e);
    return null;
  }
}

// Fetch network summary (compact)
async function fetchNetworkSummary() {
  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;
    
    const nodes = (rpcResponse.data as any)?.pods || [];
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter((n: any) => {
      const timeDiff = Math.floor(Date.now() / 1000) - (n.last_seen_timestamp || 0);
      return timeDiff < 300;
    }).length;
    
    const totalStorage = nodes.reduce((s: number, n: any) => s + (n.storage_committed || 0), 0);
    const usedStorage = nodes.reduce((s: number, n: any) => s + (n.storage_used || 0), 0);
    const avgUptime = nodes.reduce((s: number, n: any) => s + (n.uptime || 0), 0) / nodes.length;
    
    const versions: Record<string, number> = {};
    nodes.forEach((n: any) => { versions[n.version || 'unknown'] = (versions[n.version || 'unknown'] || 0) + 1; });
    
    return {
      totalNodes,
      onlineNodes,
      offlineNodes: totalNodes - onlineNodes,
      onlinePercent: ((onlineNodes / totalNodes) * 100).toFixed(1),
      totalStorageTB: (totalStorage / (1024**4)).toFixed(2),
      usedStorageTB: (usedStorage / (1024**4)).toFixed(2),
      avgUptimeDays: (avgUptime / 86400).toFixed(1),
      versions,
    };
  } catch { return null; }
}

// Fetch credits summary
async function fetchCreditsSummary() {
  try {
    const url = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/devnet-pod-credits';
    const res = await fetch(url, { headers: { 'User-Agent': 'XanDash/1.0' } });
    if (!res.ok) return null;
    
    const data = await res.json();
    const credits = data.pods_credits || [];
    const total = credits.reduce((s: number, c: any) => s + (c.credits || 0), 0);
    const sorted = [...credits].sort((a: any, b: any) => (b.credits || 0) - (a.credits || 0));
    
    return {
      totalCredits: total,
      avgCredits: Math.round(total / credits.length),
      totalPods: credits.length,
      topEarners: sorted.slice(0, 5).map((c: any) => ({
        pubkey: c.pod_id?.slice(0, 8) + '...',
        credits: c.credits,
      })),
    };
  } catch { return null; }
}

// Build context based on user message
async function buildContext(msg: string) {
  const lower = msg.toLowerCase();
  let ctx = '';
  let hints = '';
  
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
    if (data) ctx += `\nNODE ${pubkeyMatch[1].slice(0,8)}...: ${JSON.stringify(data)}`;
    else hints += `\n[NODE_NOT_FOUND: No node found with pubkey "${pubkeyMatch[1].slice(0,12)}...". Verify from dashboard.]`;
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
    const data = await fetchNetworkSummary();
    if (data) ctx += `\nNETWORK: ${JSON.stringify(data)}`;
  }
  
  // Credits queries
  if (/credit|earn|reward|top|leader|rank/.test(lower)) {
    const data = await fetchCreditsSummary();
    if (data) ctx += `\nCREDITS: ${JSON.stringify(data)}`;
  }
  
  // Health/analysis queries - get network data
  if (/health|analyze|analysis|performance|issue|problem|offline/.test(lower)) {
    if (!fullIpMatch && !pubkeyMatch) {
      const data = await fetchNetworkSummary();
      if (data) ctx += `\nNETWORK: ${JSON.stringify(data)}`;
    }
  }
  
  // Add hints if any
  if (hints) ctx += `\n\nVALIDATION HINTS:${hints}`;
  
  return ctx;
}

const SYSTEM = `You are XanDash AI, the intelligent assistant for XanDash - the official monitoring dashboard for Xandeum network.

ABOUT XANDEUM:
- Xandeum is a decentralized storage network built on Solana blockchain
- Storage nodes called "pods" or "pNodes" provide distributed storage capacity
- Pod operators earn XAND credits for contributing storage to the network
- XAND is the native token of the Xandeum ecosystem

ABOUT XANDASH:
- Real-time monitoring of all network pods (265+ nodes)
- Tracks: status, uptime, storage, credits, version, location
- Historical data stored for trend analysis
- Interactive network map showing global distribution

POD METRICS:
- Status: online (<5min seen), syncing (<1hr), offline (>1hr)
- Uptime: continuous running time
- Storage Committed: allocated to network
- Storage Used: actually utilized
- Credits: rewards earned
- Version: software version

VALID INPUT FORMATS (guide users if they use wrong format):
1. NODE LOOKUP:
   - IP Address: "173.249.54.191" or "analyze node 173.249.54.191"
   - Pubkey: Full base58 pubkey like "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
   
2. COUNTRY LOOKUP:
   - Country name: "Germany", "USA", "India", "Japan"
   - Country code: "DE", "US", "IN", "JP"
   - Example: "nodes in Germany" or "DE stats"

3. TOKEN INFO:
   - "XAND price", "token info", "market cap"

4. NETWORK OVERVIEW:
   - "network overview", "total nodes", "network stats"

5. CREDITS:
   - "top earners", "credits leaderboard", "pod credits"

RESPONSE GUIDELINES:
- Use the provided LIVE DATA to answer accurately
- Be specific with numbers and percentages
- For node analysis: comment on status, uptime, storage efficiency
- For token queries: provide price, market cap, changes
- For country queries: show node distribution and stats
- Keep responses concise but informative

IMPORTANT - HANDLE INVALID INPUTS:
- If user enters partial/invalid IP (like "173.249" or "192.168"), ask them to provide the complete IP address (e.g., "173.249.54.191")
- If user enters invalid pubkey, ask for the full base58 pubkey from the dashboard
- If user asks about a node but doesn't provide IP/pubkey, ask them to provide the node's IP address or pubkey
- If user mentions a country not recognized, suggest using country name (Germany) or code (DE)
- If no LIVE DATA is provided for a specific query, guide the user on correct format
- Always be helpful and suggest the correct format with examples`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!OPENROUTER_API_KEY) return new Response(JSON.stringify({ error: 'No API key' }), { status: 500 });
    
    const lastMsg = messages[messages.length - 1]?.content || '';
    const ctx = await buildContext(lastMsg);
    const sysPrompt = SYSTEM + (ctx ? `\n\n--- LIVE DATA ---${ctx}\n--- END DATA ---` : '');
    
    let response: Response | null = null;
    for (const model of MODELS) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 
            'Content-Type': 'application/json', 
            'HTTP-Referer': 'https://xandash.vercel.app' 
          },
          body: JSON.stringify({ 
            model, 
            messages: [{ role: 'system', content: sysPrompt }, ...messages], 
            stream: true 
          }),
        });
        if (r.ok) { response = r; break; }
      } catch {}
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
              } catch {}
            }
          }
        }
        ctrl.close();
      },
    });
    
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) {
    console.error('AI error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
