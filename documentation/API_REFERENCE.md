# XanDash API Reference

## Overview

XanDash provides several internal API routes for fetching and processing network data.

## Endpoints

### GET /api/nodes

Fetches all network nodes with status and metrics.

**Query Parameters:**
- `includeAll` (optional): Include all nodes regardless of status

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
      "credits": 1000
    }
  ],
  "total": 265
}
```

---

### GET /api/node-profile

Fetches detailed profile for a specific node including historical data.

**Query Parameters:**
- `ip` (required): Node IP address
- `source` (optional): Data source (`rpc`, `db`, `both`)
- `hours` (optional): Hours of history to fetch (default: 168)

**Response:**
```json
{
  "ip": "192.168.1.1",
  "location": {
    "country": "United States",
    "country_code": "US",
    "city": "New York",
    "region": "NY",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "currentNode": {
    "status": "online",
    "uptime": 123456,
    "credits": 1000
  },
  "dbHistory": [...],
  "dbEvents": [...]
}
```

---

### GET /api/pod-credits

Fetches credit/reward data for all pods.

**Response:**
```json
{
  "credits": [
    {
      "pubkey": "string",
      "credits": 1000,
      "previousCredits": 950
    }
  ]
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

### GET /api/sync-nodes?action=sync

Manual single sync for testing.

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
- `/api/verify-turnstile` validates Cloudflare Turnstile tokens
- Other endpoints are public but rate-limited
