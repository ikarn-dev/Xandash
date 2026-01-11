import { getMainnetData } from '../services/mainnet-data-service';
import { hasNodeName } from '../utils/node-names';

export interface ValidatorData {
  pubkey: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  score: number;
  rank: number;
  uptime: number;
  storage_committed: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  storage_used?: number;
  storage_usage_percent?: number;
  isDuplicate?: boolean;
  duplicateCount?: number;
}

export interface ValidatorStats {
  totalValidators: number;
  onlineValidators: number;
  publicValidators: number;
  averageScore: number;
}

// Server-side function to fetch validators data (mainnet)
export async function getValidatorsData(): Promise<{
  validators: ValidatorData[];
  stats: ValidatorStats;
  error?: string;
}> {
  try {
    const mainnetData = await getMainnetData();
    
    if (mainnetData.nodes.length === 0) {
      return {
        validators: [],
        stats: {
          totalValidators: 0,
          onlineValidators: 0,
          publicValidators: 0,
          averageScore: 0,
        },
        error: 'No mainnet data available'
      };
    }

    const allValidators = mainnetData.nodes;
    
    // Process and enrich validator data
    const now = Math.floor(Date.now() / 1000);
    const processedValidators: ValidatorData[] = allValidators.map((validator: any, index: number) => {
      const timeDiff = now - (validator.last_seen_timestamp || now);
      
      // Simplified status logic similar to endpoint tester
      // Online: last seen < 30 minutes
      // Syncing: last seen 30-60 minutes
      // Offline: last seen > 60 minutes
      let status: 'online' | 'syncing' | 'offline' = 'offline';
      if (timeDiff < 1800) status = 'online';        // Less than 30 minutes = online
      else if (timeDiff < 3600) status = 'syncing';  // 30-60 minutes = syncing
      else status = 'offline';                       // More than 60 minutes = offline
      
      const isOnline = status === 'online'; // For score calculation
      
      // Calculate score based on uptime, storage, and other factors
      const uptimeScore = Math.min((validator.uptime || 0) / (30 * 24 * 3600), 1) * 40; // Max 40 points for 30 days uptime
      const storageScore = Math.min((validator.storage_committed || 0) / (100 * 1024**3), 1) * 30; // Max 30 points for 100GB
      const onlineScore = isOnline ? 30 : 0; // 30 points for being online
      const totalScore = uptimeScore + storageScore + onlineScore;
      
      return {
        pubkey: validator.pubkey || `validator-${index}-${Date.now()}-${Math.random()}`,
        address: validator.address || `unknown-${index}`,
        status: status,
        score: totalScore,
        rank: 0, // Will be calculated after sorting
        uptime: validator.uptime || 0,
        storage_committed: validator.storage_committed || 0,
        storage_used: validator.storage_used || 0,
        storage_usage_percent: validator.storage_usage_percent || 0,
        version: validator.version || '1.0.0',
        rpc_port: validator.rpc_port || 8899,
        is_public: validator.is_public || false,
        last_seen_timestamp: validator.last_seen_timestamp || now,
        isDuplicate: false,
        duplicateCount: 0,
      };
    });

    // Enhanced duplicate detection - check for pubkey OR address duplicates
    const uniqueValidators: ValidatorData[] = [];
    const pubkeyGroups = new Map<string, ValidatorData[]>();
    const addressGroups = new Map<string, ValidatorData[]>();
    
    // Group by pubkey
    processedValidators.forEach(validator => {
      const pubkey = validator.pubkey;
      if (!pubkeyGroups.has(pubkey)) {
        pubkeyGroups.set(pubkey, []);
      }
      pubkeyGroups.get(pubkey)!.push(validator);
    });
    
    // Group by address  
    processedValidators.forEach(validator => {
      const address = validator.address;
      if (!addressGroups.has(address)) {
        addressGroups.set(address, []);
      }
      addressGroups.get(address)!.push(validator);
    });

    // Track which validators we've already processed
    const processedValidatorIds = new Set<string>();
    
    // Process pubkey duplicates first
    pubkeyGroups.forEach((validators, pubkey) => {
      if (validators.length > 1) {
        // Sort by last_seen_timestamp (most recent first)
        validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
        
        // Keep the most recent one
        const mostRecent = validators[0];
        const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;
        
        if (!processedValidatorIds.has(validatorId)) {
          mostRecent.isDuplicate = false;
          mostRecent.duplicateCount = validators.length - 1;
          uniqueValidators.push(mostRecent);
          processedValidatorIds.add(validatorId);
        }
      }
    });
    
    // Process address duplicates
    addressGroups.forEach((validators, address) => {
      if (validators.length > 1) {
        // Sort by last_seen_timestamp (most recent first)
        validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
        
        // Keep the most recent one if not already processed
        const mostRecent = validators[0];
        const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;
        
        if (!processedValidatorIds.has(validatorId)) {
          mostRecent.isDuplicate = false;
          mostRecent.duplicateCount = validators.length - 1;
          uniqueValidators.push(mostRecent);
          processedValidatorIds.add(validatorId);
        } else {
          // Update duplicate count if this validator was already added but has more address duplicates
          const existingValidator = uniqueValidators.find(v => `${v.pubkey}-${v.address}` === validatorId);
          if (existingValidator) {
            existingValidator.duplicateCount = Math.max(existingValidator.duplicateCount || 0, validators.length - 1);
          }
        }
      }
    });
    
    // Add validators that have no duplicates
    processedValidators.forEach(validator => {
      const validatorId = `${validator.pubkey}-${validator.address}`;
      if (!processedValidatorIds.has(validatorId)) {
        const pubkeyDuplicates = pubkeyGroups.get(validator.pubkey)?.length || 1;
        const addressDuplicates = addressGroups.get(validator.address)?.length || 1;
        
        if (pubkeyDuplicates === 1 && addressDuplicates === 1) {
          validator.isDuplicate = false;
          validator.duplicateCount = 0;
          uniqueValidators.push(validator);
          processedValidatorIds.add(validatorId);
        }
      }
    });

    // Sort by score and assign ranks
    uniqueValidators.sort((a, b) => b.score - a.score);
    uniqueValidators.forEach((validator, index) => {
      validator.rank = index + 1;
    });

    // Calculate stats
    const onlineValidators = uniqueValidators.filter(v => v.status === 'online').length;
    const publicValidators = uniqueValidators.filter(v => v.is_public).length;
    const averageScore = uniqueValidators.length > 0 
      ? uniqueValidators.reduce((sum, v) => sum + v.score, 0) / uniqueValidators.length 
      : 0;

    const stats: ValidatorStats = {
      totalValidators: uniqueValidators.length,
      onlineValidators,
      publicValidators,
      averageScore,
    };

    return {
      validators: uniqueValidators,
      stats,
    };
  } catch (error) {
    console.error('Server-side validator fetch error:', error);
    return {
      validators: [],
      stats: {
        totalValidators: 0,
        onlineValidators: 0,
        publicValidators: 0,
        averageScore: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Client-side filtering and sorting
export function filterAndSortValidators(
  validators: ValidatorData[],
  filters: {
    search?: string;
    onlyPublic?: boolean;
    hideHighStake?: boolean;
    showDuplicates?: boolean;
    onlyOnline?: boolean;
    onlyInactive?: boolean;
    onlySyncing?: boolean;
    versionFilter?: string;
  },
  sort: {
    field: 'address' | 'location' | 'pubkey' | 'public' | 'storage_committed' | 'storage_used' | 'usage_percent' | 'rpc_port' | 'version' | 'uptime' | 'last_seen' | 'status' | 'score' | 'storage';
    direction: 'asc' | 'desc';
  }
): ValidatorData[] {
  let filtered = [...validators];

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(v => 
      v.address.toLowerCase().includes(searchLower) ||
      v.pubkey.toLowerCase().includes(searchLower) ||
      v.version.toLowerCase().includes(searchLower)
    );
  }

  // Apply public filter
  if (filters.onlyPublic) {
    filtered = filtered.filter(v => v.is_public);
  }

  // Apply high stake filter (assuming high stake means high storage)
  if (filters.hideHighStake) {
    const avgStorage = validators.reduce((sum, v) => sum + v.storage_committed, 0) / validators.length;
    filtered = filtered.filter(v => v.storage_committed <= avgStorage * 2);
  }

  // Apply duplicates filter
  if (filters.showDuplicates) {
    // Show only validators that have duplicates (duplicateCount > 0)
    filtered = filtered.filter(v => v.duplicateCount && v.duplicateCount > 0);
  }

  // Apply online filter
  if (filters.onlyOnline) {
    filtered = filtered.filter(v => {
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - v.last_seen_timestamp;
      return timeDiff < 1800; // Less than 30 minutes = online
    });
  }

  // Apply syncing filter
  if (filters.onlySyncing) {
    filtered = filtered.filter(v => {
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - v.last_seen_timestamp;
      return timeDiff >= 1800 && timeDiff < 3600; // 30-60 minutes = syncing
    });
  }

  // Apply inactive filter
  if (filters.onlyInactive) {
    filtered = filtered.filter(v => {
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - v.last_seen_timestamp;
      return timeDiff >= 3600; // More than 60 minutes = offline
    });
  }

  // Apply version filter
  if (filters.versionFilter) {
    filtered = filtered.filter(v => v.version === filters.versionFilter);
  }

  // Apply sorting with named nodes always at top
  filtered.sort((a, b) => {
    // Named nodes always come first
    const aHasName = hasNodeName(a.pubkey);
    const bHasName = hasNodeName(b.pubkey);
    
    if (aHasName && !bHasName) return -1;
    if (!aHasName && bHasName) return 1;
    
    // If both have names or both don't, sort by the selected field
    let aVal: any, bVal: any;
    
    switch (sort.field) {
      case 'address':
        aVal = a.address;
        bVal = b.address;
        break;
      case 'location':
        // Location sorting will be handled client-side with geolocation data
        aVal = a.address; // Fallback to address for now
        bVal = b.address;
        break;
      case 'pubkey':
        aVal = a.pubkey;
        bVal = b.pubkey;
        break;
      case 'public':
        aVal = a.is_public ? 1 : 0;
        bVal = b.is_public ? 1 : 0;
        break;
      case 'storage_committed':
        aVal = a.storage_committed;
        bVal = b.storage_committed;
        break;
      case 'storage_used':
        aVal = a.storage_used || 0;
        bVal = b.storage_used || 0;
        break;
      case 'usage_percent':
        aVal = a.storage_usage_percent || 0;
        bVal = b.storage_usage_percent || 0;
        break;
      case 'rpc_port':
        aVal = a.rpc_port;
        bVal = b.rpc_port;
        break;
      case 'version':
        aVal = a.version;
        bVal = b.version;
        break;
      case 'uptime':
        aVal = a.uptime;
        bVal = b.uptime;
        break;
      case 'last_seen':
        aVal = a.last_seen_timestamp;
        bVal = b.last_seen_timestamp;
        break;
      case 'status':
        aVal = a.status === 'online' ? 1 : 0;
        bVal = b.status === 'online' ? 1 : 0;
        break;
      case 'score':
        aVal = a.score;
        bVal = b.score;
        break;
      case 'storage': // Legacy support
        aVal = a.storage_committed;
        bVal = b.storage_committed;
        break;
      default:
        aVal = a.storage_committed; // Default to storage_committed
        bVal = b.storage_committed;
    }

    // Always sort in descending order (most recent/highest values first)
    if (typeof aVal === 'string') {
      return bVal.localeCompare(aVal);
    }

    return bVal - aVal;
  });

  return filtered;
}

// Pagination helper
export function paginateValidators(
  validators: ValidatorData[],
  page: number,
  pageSize: number
): {
  validators: ValidatorData[];
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(validators.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedValidators = validators.slice(startIndex, endIndex);

  return {
    validators: paginatedValidators,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
