# XanDash Cron Job Setup

## Overview

XanDash uses scheduled cron jobs to automatically sync node data to MongoDB every 5 minutes. This ensures historical data is captured even when no users are visiting the dashboard.

**Both devnet and mainnet are synced separately** to their own MongoDB collections.

## How Mainnet Works

Mainnet nodes are **not on a separate RPC** - they are filtered from the devnet RPC by checking if their pubkey exists in the mainnet credits API. This means:

1. All nodes come from the same RPC endpoint
2. Mainnet nodes are identified by their pubkey being in the mainnet credits API
3. Mainnet data is stored in separate MongoDB collections

## MongoDB Collections

| Network | Snapshots Collection | Events Collection |
|---------|---------------------|-------------------|
| Devnet  | `node_snapshots` | `node_events` |
| Mainnet | `mainnet_node_snapshots` | `mainnet_node_events` |

## Data Sources

### Node Profile Page
When a user visits a node profile page:
1. Live data is fetched from RPC
2. For mainnet, the node's pubkey is verified against mainnet credits API
3. **The node snapshot is automatically saved to MongoDB** (rate-limited to once per minute per node)
4. Historical data is fetched from the network-specific MongoDB collection

This means the database gets updated from both:
- Cron jobs (every 5 minutes)
- User visits (on-demand)

## GitHub Actions

Two separate workflows handle each network:

1. **Devnet**: `.github/workflows/sync-nodes.yml`
2. **Mainnet**: `.github/workflows/sync-mainnet-nodes.yml`

Both run every 5 minutes.

### Setup Steps

1. **Add GitHub Secret**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add new secret: `CRON_SECRET` with your secret value

2. **Add Vercel Environment Variables**
   ```
   CRON_SECRET=your_secret_value
   ```

3. **Enable Workflows**
   - The workflows run automatically once pushed to main branch
   - You can also trigger manually from Actions tab

## API Endpoints

### Sync Nodes

```bash
# Sync devnet (default)
POST /api/sync-nodes?network=devnet

# Sync mainnet (filters by mainnet pubkeys)
POST /api/sync-nodes?network=mainnet
```

### Initialize Indexes

```bash
# Initialize indexes for both networks
GET /api/sync-nodes?action=init

# Initialize for specific network
GET /api/sync-nodes?action=init&network=mainnet
```

### Manual Sync Test

```bash
# Test devnet sync
GET /api/sync-nodes?action=sync&network=devnet

# Test mainnet sync
GET /api/sync-nodes?action=sync&network=mainnet
```

### Check Database Status

```bash
# Check devnet collections
GET /api/db-status?network=devnet

# Check mainnet collections
GET /api/db-status?network=mainnet
```

## Node Profile API

The node profile API accepts a `network` parameter:

```bash
# Get devnet node profile (default)
GET /api/node-profile?ip=1.2.3.4&network=devnet

# Get mainnet node profile
GET /api/node-profile?ip=1.2.3.4&network=mainnet
```

For mainnet requests:
- The API verifies the node's pubkey is in the mainnet credits API
- If not a mainnet node, returns null for currentNode
- Historical data comes from mainnet-specific MongoDB collections

## What Gets Synced

Each sync operation per network:
- Fetches all nodes from RPC
- For mainnet: filters to only nodes with pubkeys in mainnet credits API
- Saves snapshots to network-specific MongoDB collections
- Logs events for significant changes:
  - New nodes discovered
  - Status changes (online/offline)
  - Version updates
  - Storage changes (>5%)
  - Credit changes (>100)

## Response Example

```json
{
  "success": true,
  "network": "mainnet",
  "total": 45,
  "newNodes": 1,
  "statusChanges": 3,
  "versionChanges": 0,
  "storageChanges": 0,
  "creditsChanges": 12,
  "duration": "1847ms",
  "timestamp": "2026-01-06T10:30:00.000Z"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Auth secret for cron jobs | - |
| `NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL` | Devnet credits API | `https://podcredits.xandeum.network/api/pods-credits` |
| `NEXT_PUBLIC_POD_CREDITS_MAINNET_URL` | Mainnet credits API | `https://podcredits.xandeum.network/api/mainnet-pod-credits` |

## Troubleshooting

### Mainnet Node Shows "Unknown"

This means the node is **not a mainnet node**. The node exists on devnet but its pubkey is not in the mainnet credits API.

To verify:
1. Check if the node appears in the mainnet nodes list
2. Check the mainnet credits API for the node's pubkey

### Sync Failing

1. Check `CRON_SECRET` matches in both GitHub and Vercel
2. Verify MongoDB connection string is correct
3. Check Vercel function logs for errors

### Missing Mainnet Data

1. Verify mainnet credits API is accessible
2. Check if mainnet workflow is running (GitHub Actions tab)
3. Initialize mainnet indexes: `GET /api/sync-nodes?action=init&network=mainnet`
4. Check db status: `GET /api/db-status?network=mainnet`

### Rate Limiting

GitHub Actions minimum interval is 5 minutes. For more frequent syncs, use external services like cron-job.org with separate jobs for each network.
