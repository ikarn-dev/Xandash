# XanDash API Reference

## Overview

XanDash provides several internal API routes for fetching and processing network data. All endpoints support both Mainnet and Devnet via the `network` query parameter.

## Endpoints

### GET /api/nodes

Fetches all network nodes with status and metrics.

**Query Parameters:**
- `includeAll` (optional): Include all nodes regardless of status
- `network` (optional): `devnet` or `mainnet` (default: `devnet`)
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page (max: 1000)

**Response:**
```json
{
  "nodes": [
    {
      "pubkey": "string",
      "address": "string",
      "status": "online|offline|syncing",
      "uptime": 123456,
      "storage_committed": 1073741824,
      "storage_used": 536870912,
      "version": "1.2.0",
      "last_seen_timestamp": 1704672000
    }
  ],
  "total": 265,
  "serverTimestamp": 1704672000,
  "network": "devnet"
}
```

---

### GET /api/node-profile

Fetches detailed profile for a specific node including historical data.

**Query Parameters:**
- `ip` (required): Node IP address
- `network` (optional): `devnet` or `mainnet` (default: `devnet`)
- `hours` (optional): Hours of history to fetch (default: 168)
- `quick` (optional): Skip credits fetch for faster response

**Response:**
```json
{
  "ip": "192.168.1.1",
  "network": "devnet",
  "location": {
    "country": "United States",
    "country_code": "us",
    "city": "New York",
    "region": "NY",
    "provider": "AWS",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "currentNode": {
    "pubkey": "string",
    "status": "online",
    "uptime": 123456,
    "credits": 1000,
    "storage_committed": 1073741824,
    "storage_used": 536870912,
    "version": "1.2.0"
  },
  "dbHistory": [...],
  "dbEvents": [...]
}
```

---

### GET /api/node-history

Fetches historical data for a specific node.

**Query Parameters:**
- `ip` (required): Node IP address
- `type` (optional): `history`, `events`, `latest`, `stats`, `all-events`
- `limit` (optional): Number of records (default: 100)
- `hours` (optional): Hours of history for stats type (default: 24)

**Response (type=stats):**
```json
{
  "ip": "192.168.1.1",
  "stats": [
    {
      "timestamp": 1704672000,
      "credits": 1000,
      "uptime": 123456,
      "storage_committed": 1073741824,
      "storage_used": 536870912
    }
  ],
  "hours": 168,
  "count": 100
}
```

---

### GET /api/pod-credits

Fetches credit/reward data for all pods.

**Query Parameters:**
- `network` (optional): `devnet` or `mainnet` (default: `devnet`)

**Response:**
```json
{
  "pods_credits": [
    {
      "pod_id": "string",
      "credits": 1000
    }
  ]
}
```

---

### GET /api/governance

Fetches governance proposals and treasury data.

**Query Parameters:**
- `network` (optional): `devnet` or `mainnet` (default: `devnet`)

**Response:**
```json
{
  "proposals": [
    {
      "id": "string",
      "title": "string",
      "status": "active|completed|rejected",
      "votesFor": 1000,
      "votesAgainst": 500,
      "startTime": 1704672000,
      "endTime": 1704758400
    }
  ],
  "treasury": {
    "balance": 1000000,
    "address": "string"
  }
}
```

---

### POST /api/geolocation

Batch IP geolocation lookup.

**Body:**
```json
{
  "ips": ["192.168.1.1", "192.168.1.2"]
}
```

**Response:**
```json
{
  "192.168.1.1": {
    "country": "United States",
    "country_code": "us",
    "city": "New York",
    "region": "NY",
    "provider": "AWS",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "192.168.1.2": null
}
```

---

### GET /api/xand-info

Fetches XAND token data from CoinGecko API.

**Response:**
```json
{
  "price": 0.002829,
  "price_change_24h": 5.2,
  "market_cap": 1000000,
  "volume_24h": 50000,
  "circulating_supply": 1000000000
}
```

---

### POST /api/sync-nodes

Syncs all nodes to MongoDB. Used by cron jobs.

**Headers:**
- `Authorization`: `Bearer YOUR_CRON_SECRET`

**Response:**
```json
{
  "success": true,
  "total": 265,
  "newNodes": 2,
  "statusChanges": 15,
  "duration": "2847ms"
}
```

---

### GET /api/sync-nodes?action=init

Initializes MongoDB indexes. Run once after deployment.

---

### POST /api/verify-turnstile

Verifies Cloudflare Turnstile CAPTCHA token.

**Body:**
```json
{
  "token": "turnstile_token_here"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/ai-chat

AI-powered chat endpoint for node analysis and network insights.

**Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze node 173.249.54.191"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

```
data: {"content": "Node "}
data: {"content": "173.249.54.191 "}
data: {"content": "is online..."}
data: [DONE]
```

**Features:**
- Automatic context building based on query type
- Fetches live node data, network stats, token info
- Supports node lookup by IP or pubkey
- Country-based node statistics
- Network health analysis
- Streaming responses for real-time display

**Supported Query Types:**
- Node analysis: "Analyze node 173.249.54.191"
- Country stats: "Nodes in Germany"
- Network overview: "Network overview"
- Token info: "XAND token price"
- Credits: "Top earning nodes"

---

### GET /api/db-status

Checks MongoDB connection status.

**Response:**
```json
{
  "connected": true,
  "database": "xandash",
  "collections": ["node_snapshots", "node_events"]
}
```

---

### POST /api/rpc

Proxy endpoint for Xandeum JSON-RPC calls.

**Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getNodeList",
  "params": []
}
```

## Rate Limiting

- API routes implement caching to reduce load
- Geolocation data cached for 24 hours
- Token data has 5-minute refresh cooldown
- CAPTCHA required for node profile access

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message",
  "status": 500
}
```

## Authentication

- `/api/sync-nodes` POST requires `Authorization: Bearer CRON_SECRET` header

---

### GET /api/manager-wallet

Fetches manager's wallet data including SOL balance, SPL tokens, and NFTs from Helius API.

**Query Parameters:**
- `address` (required): Wallet address

**Response:**
```json
{
  "solBalance": 10.5,
  "tokens": [
    {
      "mint": "string",
      "amount": 1000,
      "decimals": 9,
      "symbol": "XAND",
      "name": "Xandeum",
      "logoURI": "url"
    }
  ],
  "nfts": [
    {
      "id": "string",
      "content": { ... }
    }
  ],
  "totalUsdValue": 0
}
```

---

### GET /api/nodes-trend

Fetches historical node count trends for network visualization.

**Query Parameters:**
- `network` (optional): `devnet` or `mainnet` (default: `devnet`)
- `hours` (optional): Hours of history (default: 24, max: 168)

**Response:**
```json
{
  "network": "devnet",
  "hours": 24,
  "data": [
    {
      "timestamp": 1704672000,
      "total_nodes": 250,
      "online_nodes": 200,
      "offline_nodes": 40,
      "syncing_nodes": 10,
      "created_at": "2024-01-08T00:00:00.000Z"
    }
  ],
  "count": 48
}
```

---

### GET /api/rpc-status

Provides real-time health status of RPC endpoints.

**Query Parameters:**
- `network` (optional): `devnet` or `mainnet`

**Response:**
```json
{
  "endpoints": [
    {
      "name": "Primary RPC",
      "url": "http://...",
      "status": "operational",
      "responseTime": 150,
      "uptime": 99.9,
      "lastChecked": 1704672000
    }
  ],
  "summary": {
    "total": 3,
    "operational": 3,
    "avgResponseTime": 145
  }
}
```
