/**
 * Seeded Random Number Generator using xorshift128+
 * Provides separate streams for different game systems
 */

export class SeededRNG {
  private state: [number, number];
  private initialSeed: string;

  // Separate streams for different systems
  private streams: Map<string, SeededRNG> = new Map();

  constructor(seed: string) {
    this.initialSeed = seed;
    this.state = this.hashSeed(seed);
  }

  /**
   * Convert string seed to numeric state
   */
  private hashSeed(seed: string): [number, number] {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    for (let i = 0; i < seed.length; i++) {
      const ch = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return [h1 >>> 0, h2 >>> 0];
  }

  /**
   * Get or create a separate stream for a system
   */
  getStream(name: string): SeededRNG {
    if (!this.streams.has(name)) {
      const streamRng = new SeededRNG(`${this.initialSeed}_${name}`);
      this.streams.set(name, streamRng);
    }
    return this.streams.get(name)!;
  }

  /**
   * Generate next random number using xorshift128+
   */
  private next(): number {
    let s1 = this.state[0];
    const s0 = this.state[1];
    this.state[0] = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >>> 17;
    s1 ^= s0;
    s1 ^= s0 >>> 26;
    this.state[1] = s1;
    return (s0 + s1) >>> 0;
  }

  /**
   * Get random float between 0 (inclusive) and 1 (exclusive)
   */
  random(): number {
    return this.next() / 4294967296;
  }

  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Get random integer between min and max (both inclusive)
   */
  randIntInclusive(min: number, max: number): number {
    return this.randInt(min, max + 1);
  }

  /**
   * Get random float between min and max
   */
  randFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.randInt(0, array.length)];
  }

  /**
   * Pick N random elements from array (no duplicates)
   */
  pickN<T>(array: readonly T[], n: number): T[] {
    if (n > array.length) {
      throw new Error('Cannot pick more elements than array length');
    }

    const result: T[] = [];
    const available = [...array];

    for (let i = 0; i < n; i++) {
      const index = this.randInt(0, available.length);
      result.push(available[index]);
      available.splice(index, 1);
    }

    return result;
  }

  /**
   * Shuffle array in place using Fisher-Yates
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Return new shuffled copy of array
   */
  shuffled<T>(array: readonly T[]): T[] {
    return this.shuffle([...array]);
  }

  /**
   * Roll with weighted probabilities
   * Returns index of selected weight
   */
  weightedPick(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.random() * total;

    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }

    return weights.length - 1;
  }

  /**
   * Roll with weighted items
   */
  weightedPickItem<T>(items: readonly T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length');
    }
    return items[this.weightedPick(weights)];
  }

  /**
   * Boolean with probability (0-1)
   */
  chance(probability: number): boolean {
    return this.random() < probability;
  }

  /**
   * Roll a die (1 to sides inclusive)
   */
  roll(sides: number): number {
    return this.randIntInclusive(1, sides);
  }

  /**
   * Roll multiple dice
   */
  rollDice(count: number, sides: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.roll(sides));
    }
    return results;
  }

  /**
   * Get seed string
   */
  getSeed(): string {
    return this.initialSeed;
  }

  /**
   * Get current state for serialization
   */
  getState(): { seed: string; state: [number, number] } {
    return {
      seed: this.initialSeed,
      state: [...this.state] as [number, number],
    };
  }

  /**
   * Restore state from serialization
   */
  setState(savedState: { seed: string; state: [number, number] }): void {
    this.initialSeed = savedState.seed;
    this.state = [...savedState.state] as [number, number];
  }

  /**
   * Fork RNG with a derived seed (useful for sub-systems)
   */
  fork(suffix: string): SeededRNG {
    return new SeededRNG(`${this.initialSeed}_${suffix}`);
  }
}

// Stream names for consistent usage
export const RNGStreams = {
  MAP: 'map',
  COMBAT: 'combat',
  REWARDS: 'rewards',
  EVENTS: 'events',
  ITEMS: 'items',
  AI: 'ai',
  LLM: 'llm', // For reproducible LLM content selection
} as const;
