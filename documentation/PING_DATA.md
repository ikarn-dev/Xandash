# Ping Data System

This document describes the ping data collection and display system implemented in Xandash.

## Overview

The ping data system collects and stores network latency information for nodes, providing historical ping data that can be displayed in various parts of the application including node profiles, network overview, and comparison pages.

## Architecture

### Database Schema

The system uses MongoDB to store ping records with the following structure:

```typescript
interface PingRecord {
  _id?: string;
  ip: string;
  pubkey?: string;
  ping: number | null;  // Latency in milliseconds, null if failed
  status: 'online' | 'offline' | 'timeout';
  port: number;         // Port used for ping (6000 or 9001)
  timestamp: number;    // Unix timestamp
  created_at: Date;     // MongoDB date
}
```

### Collections

- **Devnet**: `ping_records`
- **Mainnet**: `mainnet_ping_records`

## API Endpoints

### 1. `/api/ping` - Individual Node Ping

**POST** - Ping a single node or batch of nodes
```json
{
  "ip": "192.168.1.100",
  "port": 6000,
  "timeout": 3000,
  "network": "devnet",
  "save": true
}
```

**GET** - Get cached ping result
```
GET /api/ping?ip=192.168.1.100&port=6000&timeout=3000
```

### 2. `/api/ping-history` - Historical Ping Data

**GET** - Get ping history for nodes
```
# Single node history
GET /api/ping-history?ip=192.168.1.100&limit=100&hours=24&network=devnet

# Multiple nodes latest pings
GET /api/ping-history?ips=192.168.1.100,192.168.1.101&network=devnet

# Stats only
GET /api/ping-history?ip=192.168.1.100&stats=true&hours=24&network=devnet
```

### 3. `/api/sync-pings` - Bulk Ping Collection

**POST** - Ping all nodes in a network
```json
{
  "network": "mainnet",
  "timeout": 3000,
  "batchSize": 50
}
```

**GET** - Trigger manual sync
```
GET /api/sync-pings?network=mainnet&trigger=true
```

## Database Functions

### Core Functions

- `savePingRecord(pingData, network)` - Save single ping record
- `savePingRecordsBatch(pingRecords, network)` - Save multiple ping records
- `getNodePingHistory(ip, limit, network)` - Get ping history for a node
- `getNodePingStats(ip, hours, network)` - Get ping statistics
- `getLatestPingsForNodes(ips, network)` - Get latest pings for multiple nodes

### Statistics

The `getNodePingStats` function returns:
```typescript
{
  average: number | null;    // Average ping in ms
  min: number | null;        // Minimum ping in ms
  max: number | null;        // Maximum ping in ms
  count: number;             // Total ping attempts
  successRate: number;       // Percentage of successful pings
}
```

## Integration Points

### 1. Node Profile Page

- Displays current ping in stats cards
- Shows ping statistics (average, success rate)
- Includes ping history chart
- Works for both devnet and mainnet

### 2. Network Page

- Can be extended to show network-wide ping statistics
- Aggregate ping data across countries/regions

### 3. Compare Page

- Shows ping data for mainnet nodes (live ping)
- Can be extended to show historical ping comparison

### 4. Country Pages

- Can display regional ping statistics
- Show best/worst performing nodes by ping

## Data Collection

### Quick Start (Development)

**Option 1: Browser** (Easiest)
```
http://localhost:3000/api/sync-pings?network=devnet&trigger=true
http://localhost:3000/api/sync-pings?network=mainnet&trigger=true
```

**Option 2: Command Line**
```bash
# Devnet
curl -X POST http://localhost:3000/api/sync-pings \
  -H "Content-Type: application/json" \
  -d '{"network":"devnet","batchSize":50}'

# Mainnet  
curl -X POST http://localhost:3000/api/sync-pings \
  -H "Content-Type: application/json" \
  -d '{"network":"mainnet","batchSize":20}'
```

### Production Setup

**Vercel Cron Jobs** (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync-pings?network=devnet&trigger=true",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/sync-pings?network=mainnet&trigger=true", 
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**System Cron Jobs**
```bash
# Every 5 minutes - devnet
*/5 * * * * curl -X POST https://your-domain.com/api/sync-pings -H "Content-Type: application/json" -d '{"network":"devnet"}'

# Every 10 minutes - mainnet
*/10 * * * * curl -X POST https://your-domain.com/api/sync-pings -H "Content-Type: application/json" -d '{"network":"mainnet"}'
```

**GitHub Actions** (Alternative)
```yaml
name: Collect Ping Data
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  ping-devnet:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Devnet Nodes
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/sync-pings \
            -H "Content-Type: application/json" \
            -d '{"network":"devnet"}'
```

## Ping Methods

The system uses TCP connection attempts to measure latency:

1. **Primary Port**: 6000 (default node port)
2. **Fallback Port**: 9001 (alternative port)
3. **Timeout**: 3000ms (configurable)

### Ping Process

1. Attempt TCP connection to port 6000
2. If fails, try port 9001
3. Measure connection time
4. Record result with status:
   - `online`: Successful connection
   - `timeout`: Connection timed out
   - `offline`: Connection failed

## Performance Considerations

### Indexing

The system creates indexes for optimal query performance:
```javascript
// Ping records indexes
{ ip: 1, timestamp: -1 }  // Node history queries
{ timestamp: -1 }         // Time-based queries
```

### Caching

- Individual ping results cached for 30 seconds
- Batch operations use minimal caching to ensure freshness
- Node profile API includes ping data in response

### Batch Processing

- Sync operations process nodes in batches (default: 50)
- Small delays between batches to avoid overwhelming network
- Parallel ping operations within batches

## Monitoring

### Health Checks

Monitor the ping system health:
```bash
# Check recent ping data
curl "http://localhost:3000/api/ping-history?ip=NODE_IP&limit=10"

# Check sync status
curl "http://localhost:3000/api/sync-pings?network=devnet"
```

### Metrics

Track these metrics:
- Ping success rate per network
- Average response times
- Node availability trends
- Geographic latency patterns

## Troubleshooting

### Common Issues

1. **No ping data showing**
   - Check if MongoDB is connected
   - Verify network parameter is correct
   - Run manual sync to populate data

2. **High ping times**
   - Check network connectivity
   - Verify node ports are accessible
   - Consider firewall restrictions

3. **Sync failures**
   - Check node API endpoints are responding
   - Verify MongoDB write permissions
   - Check batch size and timeout settings

### Debug Commands

```bash
# Test individual ping
curl -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"ip":"NODE_IP","network":"devnet","save":false}'

# Check ping history
curl "http://localhost:3000/api/ping-history?ip=NODE_IP&network=devnet&limit=5"

# Manual sync with debug
curl -X POST http://localhost:3000/api/sync-pings \
  -H "Content-Type: application/json" \
  -d '{"network":"devnet","batchSize":5}'

# Quick browser test
# http://localhost:3000/api/sync-pings?network=devnet&trigger=true
```

## Future Enhancements

### Planned Features

1. **Geographic Ping Analysis**
   - Regional latency heatmaps
   - Cross-region connectivity analysis

2. **Alerting System**
   - High latency alerts
   - Node connectivity notifications

3. **Advanced Analytics**
   - Ping trend analysis
   - Performance correlation with other metrics

4. **Real-time Updates**
   - WebSocket-based live ping updates
   - Real-time network health dashboard

### API Extensions

1. **Bulk Historical Data**
   - Export ping data for analysis
   - Historical trend APIs

2. **Aggregation Endpoints**
   - Network-wide ping statistics
   - Regional performance metrics

3. **Webhook Integration**
   - Ping event notifications
   - Third-party monitoring integration