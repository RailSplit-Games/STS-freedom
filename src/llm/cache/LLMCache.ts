import { get, set, del, keys, clear } from 'idb-keyval';

interface CacheEntry {
  content: string;
  timestamp: number;
  accessCount: number;
}

/**
 * Persistent cache for LLM responses using IndexedDB
 * Implements LRU-like eviction with access counting
 */
export class LLMCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private maxMemoryEntries = 100;
  private maxDiskEntries = 1000;
  private maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  private hits = 0;
  private misses = 0;
  private dbPrefix = 'llm-cache:';

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Get cached content
   */
  get(key: string): string | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      memEntry.accessCount++;
      this.hits++;
      return memEntry.content;
    }

    this.misses++;
    return null;
  }

  /**
   * Get cached content (async, checks disk)
   */
  async getAsync(key: string): Promise<string | null> {
    // Check memory cache first
    const memResult = this.get(key);
    if (memResult) return memResult;

    // Check disk cache
    try {
      const entry = await get<CacheEntry>(this.dbPrefix + key);
      if (entry && Date.now() - entry.timestamp < this.maxAgeMs) {
        // Promote to memory cache
        this.setMemory(key, entry);
        this.hits++;
        return entry.content;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    return null;
  }

  /**
   * Store content in cache
   */
  set(key: string, content: string): void {
    const entry: CacheEntry = {
      content,
      timestamp: Date.now(),
      accessCount: 1,
    };

    this.setMemory(key, entry);
    this.saveToDisk(key, entry);
  }

  private setMemory(key: string, entry: CacheEntry): void {
    // Evict if at capacity
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      this.evictMemory();
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Evict least recently used entry from memory
   */
  private evictMemory(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestAccess = Infinity;

    for (const [key, entry] of this.memoryCache) {
      // Prefer evicting old, less accessed entries
      const score = entry.timestamp + entry.accessCount * 3600000; // +1hr per access
      if (score < oldestTime || (score === oldestTime && entry.accessCount < lowestAccess)) {
        oldestTime = score;
        lowestAccess = entry.accessCount;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Save to IndexedDB
   */
  private async saveToDisk(key: string, entry: CacheEntry): Promise<void> {
    try {
      await set(this.dbPrefix + key, entry);
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  /**
   * Load frequently accessed items from disk to memory
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const allKeys = await keys();
      const cacheKeys = allKeys.filter(
        (k): k is string => typeof k === 'string' && k.startsWith(this.dbPrefix)
      );

      // Load entries and sort by access count
      const entries: Array<{ key: string; entry: CacheEntry }> = [];

      for (const fullKey of cacheKeys.slice(0, 100)) {
        const entry = await get<CacheEntry>(fullKey);
        if (entry) {
          const key = fullKey.replace(this.dbPrefix, '');
          entries.push({ key, entry });
        }
      }

      // Sort by access count descending
      entries.sort((a, b) => b.entry.accessCount - a.entry.accessCount);

      // Load top entries into memory
      for (const { key, entry } of entries.slice(0, this.maxMemoryEntries / 2)) {
        if (Date.now() - entry.timestamp < this.maxAgeMs) {
          this.memoryCache.set(key, entry);
        }
      }
    } catch (e) {
      console.warn('Cache load error:', e);
    }
  }

  /**
   * Remove a cached entry
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await del(this.dbPrefix + key);
    } catch (e) {
      console.warn('Cache delete error:', e);
    }
  }

  /**
   * Clear all cached content
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;

    try {
      const allKeys = await keys();
      const cacheKeys = allKeys.filter(
        (k): k is string => typeof k === 'string' && k.startsWith(this.dbPrefix)
      );
      for (const key of cacheKeys) {
        await del(key);
      }
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.memoryCache.size,
    };
  }

  /**
   * Prune expired entries from disk
   */
  async prune(): Promise<number> {
    let removed = 0;

    try {
      const allKeys = await keys();
      const cacheKeys = allKeys.filter(
        (k): k is string => typeof k === 'string' && k.startsWith(this.dbPrefix)
      );

      for (const fullKey of cacheKeys) {
        const entry = await get<CacheEntry>(fullKey);
        if (entry && Date.now() - entry.timestamp > this.maxAgeMs) {
          await del(fullKey);
          const key = fullKey.replace(this.dbPrefix, '');
          this.memoryCache.delete(key);
          removed++;
        }
      }
    } catch (e) {
      console.warn('Cache prune error:', e);
    }

    return removed;
  }
}
