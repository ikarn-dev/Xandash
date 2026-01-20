# XanDash Algorithms & Logic Reference

This document details the core algorithms, formulas, and logic used throughout XanDash for calculating metrics, determining node status, and aggregating network statistics.

---

## Table of Contents

1. [Node Status Detection](#node-status-detection)
2. [Node Score Calculation](#node-score-calculation)
3. [Leaderboard Tier System](#leaderboard-tier-system)
4. [Network Statistics Aggregation](#network-statistics-aggregation)
5. [STOINC Calculation](#stoinc-calculation)
6. [High Watermark Logic](#high-watermark-logic)
7. [Duplicate Node Handling](#duplicate-node-handling)
8. [Data Reliability & Failover](#data-reliability--failover)
9. [Manager Stats Aggregation](#manager-stats-aggregation)
10. [Geolocation Mapping](#geolocation-mapping)

---

## Node Status Detection

XanDash uses a heartbeat-based mechanism to determine node status based on the `last_seen_timestamp`.

### Thresholds

| Status | Condition | Description |
|--------|-----------|-------------|
| **Online** | `timeDiff < 60 min` | Node has reported within the last hour |
| **Syncing** | `60 min ≤ timeDiff < 120 min` | Node hasn't reported in 1-2 hours |
| **Offline** | `timeDiff ≥ 120 min` | Node inactive for more than 2 hours |

### Formula

```typescript
function getNodeStatus(lastSeenTimestamp: number, now: number): NodeStatus {
  const timeDiff = now - lastSeenTimestamp;
  
  if (timeDiff < 3600) return 'online';      // < 1 hour
  if (timeDiff < 7200) return 'syncing';     // 1-2 hours
  return 'offline';                           // > 2 hours
}
```

### Implementation

- Located in: `src/libs/utils/node-status.ts`
- Used across: Node tables, Profile pages, Leaderboards, Network Map

---

## Node Score Calculation

The Node Score is a composite metric (0-100) representing overall node performance.

### Components

| Component | Max Points | Calculation |
|-----------|------------|-------------|
| **Uptime** | 40 | Linear scale: 40 points for 30 days (2,592,000 seconds) |
| **Storage** | 30 | Linear scale: 30 points for 100GB committed |
| **Online Status** | 30 | Flat 30 points if seen within 60 minutes |

### Formula

```
Score = (Uptime ÷ 2,592,000 × 40) + (Storage ÷ 107,374,182,400 × 30) + (IsOnline ? 30 : 0)
```

### Code

```typescript
function calculateNodeScore(node: {
  uptime: number;              // seconds
  storage_committed: number;   // bytes
  last_seen_timestamp: number;
}, now: number): number {
  const isOnline = (now - node.last_seen_timestamp) <= 3600;
  
  // Max 40 points for 30 days uptime
  const uptimeScore = Math.min(node.uptime / (30 * 24 * 3600), 1) * 40;
  
  // Max 30 points for 100GB storage
  const storageScore = Math.min(node.storage_committed / (100 * 1024 ** 3), 1) * 30;
  
  // 30 points for being online
  const onlineScore = isOnline ? 30 : 0;
  
  return uptimeScore + storageScore + onlineScore;
}
```

### Implementation

- Located in: `src/libs/utils/score-utils.ts`
- Identical calculation on both Mainnet and Devnet

---

## Leaderboard Tier System

Nodes are assigned tiers based on their total credits earned (Credits leaderboard only).

### Tier Thresholds

| Tier | Credits Required | Color |
|------|------------------|-------|
| **Diamond** | ≥ 50,000 | Blue (#60a5fa) |
| **Platinum** | ≥ 25,000 | Purple (#a78bfa) |
| **Gold** | ≥ 10,000 | Yellow (#fbbf24) |
| **Silver** | ≥ 5,000 | Gray (#9ca3af) |
| **Bronze** | < 5,000 | Orange (#f97316) |

### Code

```typescript
function getTier(credits: number) {
  if (credits >= 50000) return { name: 'Diamond', color: '#60a5fa' };
  if (credits >= 25000) return { name: 'Platinum', color: '#a78bfa' };
  if (credits >= 10000) return { name: 'Gold', color: '#fbbf24' };
  if (credits >= 5000) return { name: 'Silver', color: '#9ca3af' };
  return { name: 'Bronze', color: '#f97316' };
}
```

### Implementation

- Located in: `src/app/leaderboard/components/RankingTable.tsx`

---

## Network Statistics Aggregation

Network-wide metrics are calculated by aggregating data from all discovered nodes.

### Metrics Calculated

| Metric | Formula |
|--------|---------|
| **Total Nodes** | `count(nodes)` |
| **Online Nodes** | `count(nodes where status = 'online')` |
| **Online Percentage** | `(online / total) × 100` |
| **Total Storage** | `sum(storage_committed)` |
| **Used Storage** | `sum(storage_used)` |
| **Usage Percentage** | `(used / committed) × 100` |
| **Average Storage** | `total_committed / node_count` |

### Implementation

- Located in: `src/libs/utils/node-stats.ts`
- Functions: `calculateNodeStats()`, `calculateStorageStats()`, `calculateUptimeStats()`

---

## STOINC Calculation

STOINC (Storage Income) estimates potential earnings based on storage contribution.

### Components

1. **Base Storage Credits** - Credits earned from raw storage commitment
2. **NFT Boost Factors** - Multipliers from Titan, Genesis, or other NFTs
3. **Era Multipliers** - Time-based multipliers for different network phases
4. **Network Share** - Your proportion of total boosted network credits

### Formula

```
Your Income = (Your Boosted Credits ÷ Total Network Boosted Credits) × Era Rewards
```

### Implementation

- Located in: `src/app/stoinc/` components

---

## High Watermark Logic

To maintain dashboard stability during network issues, XanDash implements a High Watermark system.

### Logic

1. On each data fetch, compare new node count with previous count
2. If new count is significantly lower (potential incomplete data), retain previous dataset
3. Only update display when new data is complete or better than previous

### Purpose

- Prevents dashboard from flashing empty states
- Maintains user experience during temporary RPC issues
- Shows last known good data when current fetch is incomplete

---

## Duplicate Node Handling

To ensure accurate network representation, duplicates are filtered based on unique identifiers.

### Deduplication Strategy

1. **Primary Key**: Public Key (pubkey)
2. **Secondary Key**: IP Address
3. **Conflict Resolution**: Keep the most recently active instance

### Logic

```typescript
// Pseudocode
const uniqueNodes = new Map();
for (const node of allNodes) {
  const existing = uniqueNodes.get(node.pubkey);
  if (!existing || node.last_seen_timestamp > existing.last_seen_timestamp) {
    uniqueNodes.set(node.pubkey, node);
  }
}
```

---

## Data Reliability & Failover

XanDash implements a Multi-Layer Failover System for API reliability.

### Failover Chain

1. **Primary API Key** - Main Helius API key
2. **Backup API Keys** - Rotating pool of backup keys
3. **Rate Limit Detection** - Automatic detection of 429 responses
4. **Automatic Rotation** - Switch to next available key on failure

### Implementation

- Located in: `src/libs/utils/api-key-manager.ts`
- Functions: `getActiveApiKey()`, `reportRateLimitHit()`, `reportSuccess()`

---

## Manager Stats Aggregation

Manager profiles consolidate metrics from all nodes registered to a manager's public key.

### Aggregated Metrics

| Metric | Calculation |
|--------|-------------|
| **Total Nodes** | Count of nodes with matching manager pubkey |
| **Total Storage** | Sum of storage_committed across all managed nodes |
| **Total Credits** | Sum of credits across all managed nodes |
| **Fleet Status** | Breakdown of online/offline/syncing nodes |

### Data Sources

1. **Node Data** - From internal node tracking
2. **Wallet Data** - From Helius API (SOL balance, tokens)
3. **NFT Data** - From Helius DAS API (Titan, Genesis NFTs)

---

## Geolocation Mapping

IP-based geolocation maps nodes to physical locations.

### Process

1. Extract IP addresses from node data
2. Batch lookup via ip-api.com (up to 100 IPs per request)
3. Cache results for 24 hours
4. Map to country codes for aggregation

### Data Points

- Country name and code
- City and region
- Provider/ISP
- Latitude/Longitude coordinates

### Implementation

- API: `POST /api/geolocation`
- Service: `src/libs/services/geolocation.ts`
- Cache: 24-hour TTL

---

## Version Distribution

Tracks the distribution of node software versions across the network.

### Logic

1. Group nodes by version string
2. Count nodes per version
3. Calculate percentage of total
4. Sort by count (descending)
5. Mark the most common version as "latest"

### Implementation

- Located in: `src/libs/utils/node-stats.ts`
- Function: `calculateVersionStats()`

---

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System design and data flow
- [API Reference](./API_REFERENCE.md) - API endpoints
- [Tech Stack](./TECH_STACK.md) - Technologies used
