/**
 * Fast Node Search Service with In-Memory Indexing
 * Implements efficient search algorithms for node data
 */

interface SearchableNode {
  pod_id: string;
  address: string;
  pubkey: string;
  version: string;
  status: string;
  is_public: boolean;
  uptime: number;
  rpc_port: number;
  storage_committed: number;
  storage_available: number;
  cpu_usage?: number;
  memory_usage?: number;
  network_in?: number;
  network_out?: number;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  last_seen?: string;
  stake?: number;
  rewards?: number;
  [key: string]: any;
}

interface SearchIndex {
  // Inverted index for fast text search
  textIndex: Map<string, Set<number>>;
  // Direct field indexes for exact matches
  statusIndex: Map<string, Set<number>>;
  publicIndex: Map<boolean, Set<number>>;
  versionIndex: Map<string, Set<number>>;
  // Nodes array with index positions
  nodes: SearchableNode[];
  // Last update timestamp
  lastUpdated: number;
}

class NodeSearchService {
  private index: SearchIndex | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_SEARCH_LENGTH = 2;

  /**
   * Build search index from nodes data
   */
  private buildIndex(nodes: SearchableNode[]): SearchIndex {
    const index: SearchIndex = {
      textIndex: new Map(),
      statusIndex: new Map(),
      publicIndex: new Map(),
      versionIndex: new Map(),
      nodes: [...nodes],
      lastUpdated: Date.now()
    };

    nodes.forEach((node, nodeIndex) => {
      // Build text index for searchable fields
      const searchableText = [
        node.pod_id,
        node.address,
        node.pubkey,
        node.version,
        node.address?.split(':')[0], // IP address part
        node.address?.split(':')[1], // Port part
      ].filter(Boolean).join(' ').toLowerCase();

      // Tokenize and index
      const tokens = this.tokenize(searchableText);
      tokens.forEach(token => {
        if (!index.textIndex.has(token)) {
          index.textIndex.set(token, new Set());
        }
        index.textIndex.get(token)!.add(nodeIndex);
      });

      // Build categorical indexes
      if (!index.statusIndex.has(node.status)) {
        index.statusIndex.set(node.status, new Set());
      }
      index.statusIndex.get(node.status)!.add(nodeIndex);

      if (!index.publicIndex.has(node.is_public)) {
        index.publicIndex.set(node.is_public, new Set());
      }
      index.publicIndex.get(node.is_public)!.add(nodeIndex);

      if (node.version) {
        if (!index.versionIndex.has(node.version)) {
          index.versionIndex.set(node.version, new Set());
        }
        index.versionIndex.get(node.version)!.add(nodeIndex);
      }
    });

    return index;
  }

  /**
   * Tokenize text for indexing
   */
  private tokenize(text: string): string[] {
    // Split on non-alphanumeric characters and create n-grams for partial matching
    const words = text.toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(word => word.length >= this.MIN_SEARCH_LENGTH);

    const tokens = new Set<string>();
    
    words.forEach(word => {
      tokens.add(word);
      
      // Create n-grams for partial matching (3-grams and above)
      if (word.length >= 3) {
        for (let i = 0; i <= word.length - 3; i++) {
          tokens.add(word.substring(i, i + 3));
        }
      }
      
      // Add prefixes for autocomplete-style matching
      for (let i = 3; i <= word.length; i++) {
        tokens.add(word.substring(0, i));
      }
    });

    return Array.from(tokens);
  }

  /**
   * Update or create index
   */
  public updateIndex(nodes: SearchableNode[]): void {
    this.index = this.buildIndex(nodes);
  }

  /**
   * Check if index needs refresh
   */
  private needsRefresh(): boolean {
    if (!this.index) return true;
    return Date.now() - this.index.lastUpdated > this.CACHE_TTL;
  }

  /**
   * Fast text search using inverted index
   */
  private searchText(query: string): Set<number> {
    if (!this.index || query.length < this.MIN_SEARCH_LENGTH) {
      return new Set();
    }

    const tokens = this.tokenize(query);
    if (tokens.length === 0) return new Set();

    // Find intersection of all token matches (AND operation)
    let results: Set<number> | null = null;

    tokens.forEach(token => {
      const tokenMatches = this.index!.textIndex.get(token) || new Set();
      
      if (results === null) {
        results = new Set(tokenMatches);
      } else {
        // Intersection
        results = new Set([...results].filter(x => tokenMatches.has(x)));
      }
    });

    return results || new Set();
  }

  /**
   * Search with filters
   */
  public search(
    query: string,
    filters: {
      status?: string;
      isPublic?: boolean;
      version?: string;
      limit?: number;
    } = {}
  ): SearchableNode[] {
    if (!this.index) {
      return [];
    }

    let resultIndexes: Set<number>;

    // Start with text search if query provided
    if (query && query.trim().length >= this.MIN_SEARCH_LENGTH) {
      resultIndexes = this.searchText(query.trim());
    } else {
      // No text query, start with all nodes
      resultIndexes = new Set(Array.from({ length: this.index.nodes.length }, (_, i) => i));
    }

    // Apply filters
    if (filters.status && this.index.statusIndex.has(filters.status)) {
      const statusMatches = this.index.statusIndex.get(filters.status)!;
      resultIndexes = new Set([...resultIndexes].filter(x => statusMatches.has(x)));
    }

    if (filters.isPublic !== undefined && this.index.publicIndex.has(filters.isPublic)) {
      const publicMatches = this.index.publicIndex.get(filters.isPublic)!;
      resultIndexes = new Set([...resultIndexes].filter(x => publicMatches.has(x)));
    }

    if (filters.version && this.index.versionIndex.has(filters.version)) {
      const versionMatches = this.index.versionIndex.get(filters.version)!;
      resultIndexes = new Set([...resultIndexes].filter(x => versionMatches.has(x)));
    }

    // Convert indexes to nodes and apply limit
    const results = Array.from(resultIndexes)
      .map(index => this.index!.nodes[index])
      .slice(0, filters.limit || 50);

    return results;
  }

  /**
   * Get search suggestions based on partial input
   */
  public getSuggestions(partialQuery: string, limit: number = 5): string[] {
    if (!this.index || partialQuery.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    const lowerQuery = partialQuery.toLowerCase();

    // Find matching tokens that start with the query
    for (const [token] of this.index.textIndex) {
      if (token.startsWith(lowerQuery) && token.length > lowerQuery.length) {
        suggestions.add(token);
        if (suggestions.size >= limit) break;
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get index statistics
   */
  public getStats(): {
    totalNodes: number;
    indexSize: number;
    lastUpdated: Date | null;
    cacheValid: boolean;
  } {
    if (!this.index) {
      return {
        totalNodes: 0,
        indexSize: 0,
        lastUpdated: null,
        cacheValid: false
      };
    }

    return {
      totalNodes: this.index.nodes.length,
      indexSize: this.index.textIndex.size,
      lastUpdated: new Date(this.index.lastUpdated),
      cacheValid: !this.needsRefresh()
    };
  }

  /**
   * Clear index
   */
  public clearIndex(): void {
    this.index = null;
  }
}

// Singleton instance
export const nodeSearchService = new NodeSearchService();
export type { SearchableNode };