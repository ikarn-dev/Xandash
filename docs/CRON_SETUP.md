# XanDash Cron Job Setup

## Overview

XanDash uses scheduled cron jobs to automatically sync node data to MongoDB every 5 minutes. This ensures historical data is captured even when no users are visiting the dashboard.

## GitHub Actions (Recommended)

The project uses GitHub Actions for cron jobs since Vercel's free tier only allows 2 cron jobs per day.

### Configuration

The workflow is defined in `.github/workflows/sync-nodes.yml`:

```yaml
name: Sync Nodes Data
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync nodes data
        run: |
          curl -X POST "https://your-domain.vercel.app/api/sync-nodes" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

### Setup Steps

1. **Add GitHub Secret**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add new secret: `CRON_SECRET` with your secret value

2. **Add Vercel Environment Variable**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add: `CRON_SECRET` with the same value

3. **Enable Workflow**
   - The workflow runs automatically once pushed to main branch
   - You can also trigger manually from Actions tab

## Alternative: External Cron Services

### cron-job.org (Free)

1. Visit [cron-job.org](https://cron-job.org) and create account
2. Create new cron job:
   - **URL**: `https://your-domain.vercel.app/api/sync-nodes`
   - **Schedule**: Every 1 minute (`* * * * *`)
   - **Method**: POST
   - **Header**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Timeout**: 60 seconds

### EasyCron (Free tier)

1. Visit [EasyCron](https://www.easycron.com)
2. Create cron job with same settings as above

## What Gets Synced

Each sync operation:
- Fetches all nodes from Xandeum RPC
- Saves snapshots to MongoDB (status, uptime, storage, credits)
- Logs events for significant changes:
  - New nodes discovered
  - Status changes (online/offline)
  - Version updates
  - Storage changes (>5%)
  - Credit changes (>100)

## Monitoring

### Check Sync Status

```bash
# Check database status
curl "https://your-domain.vercel.app/api/db-status"

# Manual sync test
curl "https://your-domain.vercel.app/api/sync-nodes?action=sync"
```

### Response Example

```json
{
  "success": true,
  "total": 265,
  "newNodes": 2,
  "statusChanges": 15,
  "versionChanges": 3,
  "storageChanges": 0,
  "creditsChanges": 45,
  "duration": "2847ms",
  "timestamp": "2026-01-04T10:30:00.000Z"
}
```

### GitHub Actions Logs

View sync history in your repository's Actions tab. Each run shows:
- Execution time
- Success/failure status
- Response from sync endpoint

## Troubleshooting

### Sync Failing

1. Check `CRON_SECRET` matches in both GitHub and Vercel
2. Verify MongoDB connection string is correct
3. Check Vercel function logs for errors

### Missing Data

1. Ensure cron is running (check GitHub Actions history)
2. Verify MongoDB indexes are initialized:
   ```bash
   curl "https://your-domain.vercel.app/api/sync-nodes?action=init"
   ```

### Rate Limiting

GitHub Actions minimum interval is 5 minutes. For more frequent syncs, use external services like cron-job.org.
