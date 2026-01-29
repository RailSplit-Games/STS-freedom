import { EventBus, GameEvents } from '../../core/events/EventBus';

export type FlagType = 'permanent' | 'run' | 'combat';

export interface FlagDefinition {
  id: string;
  name: string;
  type: FlagType;
  description: string;
  max?: number;
}

/**
 * Quality-Based Narrative (QBN) flag system
 * Tracks numerical qualities that unlock storylets and dialogue options
 */
export class FlagSystem {
  // Permanent flags persist across runs
  private permanentFlags: Map<string, number> = new Map();

  // Run flags reset each run
  private runFlags: Map<string, number> = new Map();

  // Combat flags reset each combat
  private combatFlags: Map<string, number> = new Map();

  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
    this.initializeFlags();
  }

  private initializeFlags(): void {
    // These are tracked but not limited by definitions
    // Definitions are for documentation/UI purposes
  }

  /**
   * Set a flag value
   */
  set(flagId: string, value: number, type: FlagType = 'run'): void {
    const map = this.getMapForType(type);
    const oldValue = map.get(flagId) || 0;
    map.set(flagId, value);

    if (oldValue !== value) {
      this.events.emit(GameEvents.FLAG_CHANGED, {
        flagId,
        oldValue,
        newValue: value,
        type,
      });
    }
  }

  /**
   * Get a flag value
   */
  get(flagId: string, type?: FlagType): number {
    if (type) {
      return this.getMapForType(type).get(flagId) || 0;
    }

    // Check all types, prioritizing combat > run > permanent
    return (
      this.combatFlags.get(flagId) ??
      this.runFlags.get(flagId) ??
      this.permanentFlags.get(flagId) ??
      0
    );
  }

  /**
   * Increment a flag
   */
  increment(flagId: string, amount: number = 1, type: FlagType = 'run'): number {
    const current = this.get(flagId, type);
    const newValue = current + amount;
    this.set(flagId, newValue, type);
    return newValue;
  }

  /**
   * Decrement a flag (won't go below 0)
   */
  decrement(flagId: string, amount: number = 1, type: FlagType = 'run'): number {
    const current = this.get(flagId, type);
    const newValue = Math.max(0, current - amount);
    this.set(flagId, newValue, type);
    return newValue;
  }

  /**
   * Check if a flag meets a threshold
   */
  check(flagId: string, threshold: number, comparison: 'gte' | 'lte' | 'eq' | 'gt' | 'lt' = 'gte'): boolean {
    const value = this.get(flagId);

    switch (comparison) {
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
    }
  }

  /**
   * Check if any flag in a list meets its threshold
   */
  checkAny(conditions: Array<{ flag: string; threshold: number; comparison?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt' }>): boolean {
    return conditions.some((c) => this.check(c.flag, c.threshold, c.comparison));
  }

  /**
   * Check if all flags in a list meet their thresholds
   */
  checkAll(conditions: Array<{ flag: string; threshold: number; comparison?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt' }>): boolean {
    return conditions.every((c) => this.check(c.flag, c.threshold, c.comparison));
  }

  /**
   * Reset run flags (called at start of new run)
   */
  resetRun(): void {
    this.runFlags.clear();
  }

  /**
   * Reset combat flags (called at end of combat)
   */
  resetCombat(): void {
    this.combatFlags.clear();
  }

  /**
   * Get all flags of a type
   */
  getAll(type: FlagType): Map<string, number> {
    return new Map(this.getMapForType(type));
  }

  /**
   * Get all non-zero flags
   */
  getAllNonZero(): Map<string, number> {
    const result = new Map<string, number>();

    for (const [key, value] of this.permanentFlags) {
      if (value !== 0) result.set(`permanent:${key}`, value);
    }
    for (const [key, value] of this.runFlags) {
      if (value !== 0) result.set(`run:${key}`, value);
    }
    for (const [key, value] of this.combatFlags) {
      if (value !== 0) result.set(`combat:${key}`, value);
    }

    return result;
  }

  private getMapForType(type: FlagType): Map<string, number> {
    switch (type) {
      case 'permanent': return this.permanentFlags;
      case 'run': return this.runFlags;
      case 'combat': return this.combatFlags;
    }
  }

  /**
   * Serialize for saving
   */
  serialize(): object {
    return {
      permanent: Object.fromEntries(this.permanentFlags),
      run: Object.fromEntries(this.runFlags),
    };
  }

  /**
   * Deserialize from save
   */
  deserialize(data: any): void {
    this.permanentFlags = new Map(Object.entries(data.permanent || {}));
    this.runFlags = new Map(Object.entries(data.run || {}));
    this.combatFlags.clear();
  }
}

// Common flag IDs for reference
export const CommonFlags = {
  // Permanent - Meta progression
  TOTAL_RUNS: 'total_runs',
  TOTAL_WINS: 'total_wins',
  TOTAL_DEATHS: 'total_deaths',
  HIGHEST_FLOOR: 'highest_floor',
  BOSSES_KILLED: 'bosses_killed',
  CARDS_PLAYED_TOTAL: 'cards_played_total',

  // Run - Current run state
  CURRENT_FLOOR: 'current_floor',
  CURRENT_ACT: 'current_act',
  ELITES_KILLED: 'elites_killed',
  PERFECT_COMBATS: 'perfect_combats', // No damage taken
  GOLD_EARNED: 'gold_earned',
  CARDS_REMOVED: 'cards_removed',
  CARDS_UPGRADED: 'cards_upgraded',
  HP_LOST: 'hp_lost',
  DAMAGE_DEALT: 'damage_dealt',

  // Narrative - Story flags
  MET_KEEPER: 'met_keeper',
  MET_SMITH: 'met_smith',
  HELPED_STRANGER: 'helped_stranger',
  BETRAYED_TRUST: 'betrayed_trust',
  LEARNED_SECRET: 'learned_secret',
  MADE_SACRIFICE: 'made_sacrifice',

  // Character relationships (shorthand, actual uses character ID)
  KEEPER_AFFINITY: 'affinity_keeper',
  SMITH_AFFINITY: 'affinity_smith',

  // Combat - Current combat
  TURN_NUMBER: 'turn_number',
  CARDS_PLAYED_THIS_COMBAT: 'cards_played_combat',
  ATTACKS_PLAYED: 'attacks_played',
  SKILLS_PLAYED: 'skills_played',
  POWERS_PLAYED: 'powers_played',
  DAMAGE_THIS_COMBAT: 'damage_combat',
  BLOCK_THIS_COMBAT: 'block_combat',
} as const;

/**
 * Storylet condition checker
 * Used to determine if content should be available
 */
export interface StoryletCondition {
  requiredFlags?: Array<{ flag: string; min: number; max?: number }>;
  forbiddenFlags?: Array<{ flag: string; min: number }>;
  requiredTags?: string[];
  forbiddenTags?: string[];
  chance?: number; // 0-1, random chance to appear
}

export function checkStoryletCondition(
  condition: StoryletCondition,
  flags: FlagSystem,
  playerTags: Set<string>,
  rng: () => number
): boolean {
  // Check required flags
  if (condition.requiredFlags) {
    for (const req of condition.requiredFlags) {
      const value = flags.get(req.flag);
      if (value < req.min) return false;
      if (req.max !== undefined && value > req.max) return false;
    }
  }

  // Check forbidden flags
  if (condition.forbiddenFlags) {
    for (const forbid of condition.forbiddenFlags) {
      const value = flags.get(forbid.flag);
      if (value >= forbid.min) return false;
    }
  }

  // Check required tags
  if (condition.requiredTags) {
    for (const tag of condition.requiredTags) {
      if (!playerTags.has(tag)) return false;
    }
  }

  // Check forbidden tags
  if (condition.forbiddenTags) {
    for (const tag of condition.forbiddenTags) {
      if (playerTags.has(tag)) return false;
    }
  }

  // Random chance
  if (condition.chance !== undefined && rng() > condition.chance) {
    return false;
  }

  return true;
}
