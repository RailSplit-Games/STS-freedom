export type EventHandler<T = any> = (data: T) => void;

export interface GameEvent {
  type: string;
  data?: any;
  timestamp: number;
}

// Combat events
export interface DamageEvent {
  sourceId: number;
  targetId: number;
  amount: number;
  type: 'attack' | 'effect' | 'thorns';
  blocked: number;
}

export interface HealEvent {
  targetId: number;
  amount: number;
  source: string;
}

export interface CardPlayedEvent {
  cardId: string;
  sourceId: number;
  targetId?: number;
  cost: number;
}

export interface TurnStartEvent {
  entityId: number;
  turnNumber: number;
}

export interface TurnEndEvent {
  entityId: number;
  turnNumber: number;
}

export interface CombatStartEvent {
  enemies: number[];
  floor: number;
}

export interface CombatEndEvent {
  victory: boolean;
  rewards?: string[];
}

// Status effect events
export interface StatusAppliedEvent {
  targetId: number;
  statusId: string;
  stacks: number;
}

export interface StatusRemovedEvent {
  targetId: number;
  statusId: string;
}

// Map events
export interface NodeSelectedEvent {
  nodeId: string;
  nodeType: string;
}

// Reward events
export interface CardRewardEvent {
  options: string[];
  selected?: string;
}

export interface GoldRewardEvent {
  amount: number;
}

export interface RelicRewardEvent {
  relicId: string;
}

/**
 * Event bus for decoupled game system communication.
 * Uses pub-sub pattern with optional event history for replay.
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: GameEvent[] = [];
  private historyEnabled = false;
  private maxHistory = 1000;

  /**
   * Subscribe to an event type
   */
  on<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Subscribe to an event type for one emission only
   */
  once<T>(eventType: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (data) => {
      this.off(eventType, wrapper);
      handler(data);
    };
    return this.on(eventType, wrapper);
  }

  /**
   * Unsubscribe from an event type
   */
  off<T>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T>(eventType: string, data?: T): void {
    // Record in history if enabled
    if (this.historyEnabled) {
      this.history.push({
        type: eventType,
        data,
        timestamp: Date.now(),
      });
      // Trim history if needed
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    // Call handlers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      }
    }

    // Also emit to wildcard listeners
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler({ type: eventType, data });
        } catch (error) {
          console.error(`Error in wildcard event handler:`, error);
        }
      }
    }
  }

  /**
   * Enable event history recording (useful for replay/debugging)
   */
  enableHistory(maxEvents = 1000): void {
    this.historyEnabled = true;
    this.maxHistory = maxEvents;
  }

  /**
   * Get event history
   */
  getHistory(): readonly GameEvent[] {
    return this.history;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get count of handlers for an event type
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

// Event type constants
export const GameEvents = {
  // Combat
  DAMAGE: 'combat:damage',
  HEAL: 'combat:heal',
  BLOCK_GAINED: 'combat:block_gained',
  CARD_PLAYED: 'combat:card_played',
  CARD_DRAWN: 'combat:card_drawn',
  CARD_DISCARDED: 'combat:card_discarded',
  CARD_EXHAUSTED: 'combat:card_exhausted',
  TURN_START: 'combat:turn_start',
  TURN_END: 'combat:turn_end',
  COMBAT_START: 'combat:start',
  COMBAT_END: 'combat:end',
  ENEMY_INTENT_REVEALED: 'combat:enemy_intent',
  ENERGY_CHANGED: 'combat:energy_changed',

  // Status effects
  STATUS_APPLIED: 'status:applied',
  STATUS_REMOVED: 'status:removed',
  STATUS_TRIGGERED: 'status:triggered',

  // Map
  NODE_SELECTED: 'map:node_selected',
  FLOOR_CHANGED: 'map:floor_changed',
  ACT_CHANGED: 'map:act_changed',

  // Rewards
  CARD_REWARD: 'reward:card',
  GOLD_REWARD: 'reward:gold',
  RELIC_REWARD: 'reward:relic',
  REWARD_SKIPPED: 'reward:skipped',

  // Narrative
  DIALOGUE_START: 'narrative:dialogue_start',
  DIALOGUE_CHOICE: 'narrative:dialogue_choice',
  DIALOGUE_END: 'narrative:dialogue_end',
  TAG_EARNED: 'narrative:tag_earned',
  FLAG_CHANGED: 'narrative:flag_changed',

  // Meta
  RUN_START: 'meta:run_start',
  RUN_END: 'meta:run_end',
  ACHIEVEMENT_UNLOCKED: 'meta:achievement',
  UNLOCK_GAINED: 'meta:unlock',
} as const;
