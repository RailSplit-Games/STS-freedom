import { World, EntityId } from '../../core/ecs/ECS';
import { EventBus, GameEvents } from '../../core/events/EventBus';
import { SeededRNG } from '../../core/rng/SeededRNG';
import { CardEffectResolver } from '../cards/CardEffectResolver';
import { CardDatabase, getCard } from '../cards/CardDatabase';
import { EnemyDatabase, createEnemyEntity } from '../enemies/EnemyDatabase';
import type { GameStore } from '../../core/store';
import type { StoreApi } from 'zustand/vanilla';

export type CombatPhase =
  | 'start'
  | 'player_turn_start'
  | 'player_turn'
  | 'player_turn_end'
  | 'enemy_turn_start'
  | 'enemy_turn'
  | 'enemy_turn_end'
  | 'victory'
  | 'defeat';

export interface CombatState {
  phase: CombatPhase;
  turn: number;
  playerId: EntityId;
  enemyIds: EntityId[];
  selectedCardIndex: number | null;
  selectedTargetId: EntityId | null;
  combatRewards: CombatRewards | null;
}

export interface CombatRewards {
  gold: number;
  cardChoices: string[];
  potions: string[];
  relicId?: string;
}

/**
 * Manages combat flow and turn structure
 */
export class CombatStateMachine {
  private state: CombatState;
  private world: World;
  private events: EventBus;
  private rng: SeededRNG;
  private store: StoreApi<GameStore>;
  private resolver: CardEffectResolver;

  constructor(
    world: World,
    events: EventBus,
    rng: SeededRNG,
    store: StoreApi<GameStore>
  ) {
    this.world = world;
    this.events = events;
    this.rng = rng.getStream('combat');
    this.store = store;
    this.resolver = new CardEffectResolver(world, events);

    this.state = {
      phase: 'start',
      turn: 0,
      playerId: -1,
      enemyIds: [],
      selectedCardIndex: null,
      selectedTargetId: null,
      combatRewards: null,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for draw events
    this.events.on(GameEvents.CARD_DRAWN, (data: { count: number }) => {
      this.store.getState().drawCards(data.count);
    });

    // Listen for add card events
    this.events.on('combat:add_card', (data: { cardId: string; destination: string }) => {
      const store = this.store.getState();
      switch (data.destination) {
        case 'discard':
          // Add to discard in game store
          break;
        case 'draw':
          // Add to draw pile
          break;
        case 'hand':
          // Add to hand
          break;
      }
    });
  }

  /**
   * Initialize combat with enemy encounter
   */
  initCombat(enemyIds: string[]): void {
    this.world.clear();

    // Create player entity
    const playerId = this.world.createEntity();
    this.world.addTag(playerId, 'player');
    this.world.addComponent(playerId, {
      type: 'health',
      current: this.store.getState().player.currentHealth,
      max: this.store.getState().player.maxHealth,
    });
    this.world.addComponent(playerId, { type: 'block', amount: 0 });
    this.world.addComponent(playerId, {
      type: 'energy',
      current: this.store.getState().player.maxEnergy,
      max: this.store.getState().player.maxEnergy,
    });
    this.world.addComponent(playerId, {
      type: 'statusEffects',
      effects: new Map(),
    });
    this.world.addComponent(playerId, {
      type: 'position',
      x: 200,
      y: 400,
      slot: 0,
    });

    // Create enemy entities
    const createdEnemyIds: EntityId[] = [];
    enemyIds.forEach((enemyId, index) => {
      const entityId = createEnemyEntity(this.world, enemyId, index);
      if (entityId !== null) {
        createdEnemyIds.push(entityId);
      }
    });

    this.state = {
      phase: 'start',
      turn: 0,
      playerId,
      enemyIds: createdEnemyIds,
      selectedCardIndex: null,
      selectedTargetId: null,
      combatRewards: null,
    };

    // Prepare deck
    const gameState = this.store.getState();
    const shuffledDeck = this.rng.shuffled(gameState.deck);
    // Update store with shuffled draw pile
    // (In real implementation, would directly set the state)

    this.events.emit(GameEvents.COMBAT_START, {
      enemies: createdEnemyIds,
      floor: gameState.run?.floor || 0,
    });

    this.transitionTo('player_turn_start');
  }

  /**
   * Transition to a new combat phase
   */
  private transitionTo(phase: CombatPhase): void {
    this.state.phase = phase;

    switch (phase) {
      case 'player_turn_start':
        this.onPlayerTurnStart();
        break;
      case 'player_turn':
        // Player can now take actions
        break;
      case 'player_turn_end':
        this.onPlayerTurnEnd();
        break;
      case 'enemy_turn_start':
        this.onEnemyTurnStart();
        break;
      case 'enemy_turn':
        this.executeEnemyTurns();
        break;
      case 'enemy_turn_end':
        this.onEnemyTurnEnd();
        break;
      case 'victory':
        this.onVictory();
        break;
      case 'defeat':
        this.onDefeat();
        break;
    }
  }

  private onPlayerTurnStart(): void {
    this.state.turn++;

    const playerId = this.state.playerId;

    // Reset energy
    const energy = this.world.getComponent(playerId, 'energy');
    if (energy) {
      energy.current = energy.max;
    }

    // Remove block (unless Barricade)
    const statusEffects = this.world.getComponent(playerId, 'statusEffects');
    if (!statusEffects?.effects.get('barricade')) {
      const block = this.world.getComponent(playerId, 'block');
      if (block) block.amount = 0;
    }

    // Process start-of-turn status effects
    this.processPlayerTurnStartEffects();

    // Draw cards
    this.store.getState().drawCards(5);

    this.events.emit(GameEvents.TURN_START, {
      entityId: playerId,
      turnNumber: this.state.turn,
    });

    this.transitionTo('player_turn');
  }

  private processPlayerTurnStartEffects(): void {
    const playerId = this.state.playerId;
    const statusEffects = this.world.getComponent(playerId, 'statusEffects');
    if (!statusEffects) return;

    // Demon Form: Gain strength
    const demonForm = statusEffects.effects.get('demon_form');
    if (demonForm) {
      const strength = statusEffects.effects.get('strength') || 0;
      statusEffects.effects.set('strength', strength + 2);
    }

    const demonFormPlus = statusEffects.effects.get('demon_form_plus');
    if (demonFormPlus) {
      const strength = statusEffects.effects.get('strength') || 0;
      statusEffects.effects.set('strength', strength + 3);
    }

    // Brutality: Lose HP, draw card
    const brutality = statusEffects.effects.get('brutality');
    if (brutality) {
      const health = this.world.getComponent(playerId, 'health');
      if (health) health.current -= 1;
      this.store.getState().drawCards(1);
    }

    // Process poison on enemies
    for (const enemyId of this.state.enemyIds) {
      const enemyStatus = this.world.getComponent(enemyId, 'statusEffects');
      if (!enemyStatus) continue;

      const poison = enemyStatus.effects.get('poison');
      if (poison && poison > 0) {
        const health = this.world.getComponent(enemyId, 'health');
        if (health) {
          health.current -= poison;
        }
        enemyStatus.effects.set('poison', poison - 1);
        if (poison - 1 <= 0) {
          enemyStatus.effects.delete('poison');
        }
      }
    }

    this.checkForDeaths();
  }

  private onPlayerTurnEnd(): void {
    const playerId = this.state.playerId;

    // Discard hand
    this.store.getState().discardHand();

    // Process end-of-turn effects
    const statusEffects = this.world.getComponent(playerId, 'statusEffects');
    if (statusEffects) {
      // Metallicize
      const metallicize = statusEffects.effects.get('metallicize');
      if (metallicize) {
        const block = this.world.getComponent(playerId, 'block');
        if (block) block.amount += metallicize;
      }

      // Decrement turn-based effects
      this.decrementTurnEffects(statusEffects.effects);
    }

    // Handle Burns
    // (Would check discard pile for burn cards)

    this.events.emit(GameEvents.TURN_END, {
      entityId: playerId,
      turnNumber: this.state.turn,
    });

    this.transitionTo('enemy_turn_start');
  }

  private onEnemyTurnStart(): void {
    // Remove block from enemies
    for (const enemyId of this.state.enemyIds) {
      const block = this.world.getComponent(enemyId, 'block');
      if (block) block.amount = 0;
    }

    // Reveal enemy intents for next turn
    this.calculateEnemyIntents();

    this.transitionTo('enemy_turn');
  }

  private calculateEnemyIntents(): void {
    for (const enemyId of this.state.enemyIds) {
      const ai = this.world.getComponent(enemyId, 'enemyAI');
      if (!ai) continue;

      let nextAction: string;

      if (ai.aiType === 'sequential') {
        nextAction = ai.pattern[ai.patternIndex % ai.pattern.length];
      } else if (ai.aiType === 'random') {
        nextAction = this.rng.pick(ai.pattern);
      } else {
        nextAction = ai.pattern[0];
      }

      // Parse action to intent
      const intent = this.world.getComponent(enemyId, 'intent');
      if (intent) {
        this.parseActionToIntent(nextAction, intent);
      }
    }
  }

  private parseActionToIntent(
    action: string,
    intent: { action: string; value: number; multiHit?: number }
  ): void {
    // Action format: "attack:12" or "defend:8" or "attack:6x3"
    const [type, valueStr] = action.split(':');
    const multiMatch = valueStr?.match(/(\d+)x(\d+)/);

    if (multiMatch) {
      intent.action = type as any;
      intent.value = parseInt(multiMatch[1]);
      intent.multiHit = parseInt(multiMatch[2]);
    } else {
      intent.action = type as any;
      intent.value = parseInt(valueStr) || 0;
      intent.multiHit = undefined;
    }
  }

  private executeEnemyTurns(): void {
    for (const enemyId of this.state.enemyIds) {
      if (!this.world.hasEntity(enemyId)) continue;

      const health = this.world.getComponent(enemyId, 'health');
      if (!health || health.current <= 0) continue;

      const intent = this.world.getComponent(enemyId, 'intent');
      const ai = this.world.getComponent(enemyId, 'enemyAI');
      if (!intent || !ai) continue;

      // Execute the intent
      this.executeEnemyAction(enemyId, intent);

      // Advance pattern
      if (ai.aiType === 'sequential') {
        ai.patternIndex++;
      }

      // Check if player died
      const playerHealth = this.world.getComponent(this.state.playerId, 'health');
      if (playerHealth && playerHealth.current <= 0) {
        this.transitionTo('defeat');
        return;
      }
    }

    this.transitionTo('enemy_turn_end');
  }

  private executeEnemyAction(
    enemyId: EntityId,
    intent: { action: string; value: number; multiHit?: number }
  ): void {
    const playerId = this.state.playerId;
    const times = intent.multiHit || 1;

    for (let i = 0; i < times; i++) {
      switch (intent.action) {
        case 'attack':
          this.resolver.resolveEffect(
            { type: 'damage', value: intent.value },
            enemyId,
            playerId,
            { target: 'enemy' } as any
          );
          break;
        case 'defend':
          const block = this.world.getComponent(enemyId, 'block');
          if (block) block.amount += intent.value;
          break;
        case 'buff':
          const status = this.world.getComponent(enemyId, 'statusEffects');
          if (status) {
            const strength = status.effects.get('strength') || 0;
            status.effects.set('strength', strength + intent.value);
          }
          break;
        case 'debuff':
          const playerStatus = this.world.getComponent(playerId, 'statusEffects');
          if (playerStatus) {
            const weak = playerStatus.effects.get('weak') || 0;
            playerStatus.effects.set('weak', weak + intent.value);
          }
          break;
      }
    }
  }

  private onEnemyTurnEnd(): void {
    // Process end-of-turn effects for enemies
    for (const enemyId of this.state.enemyIds) {
      const statusEffects = this.world.getComponent(enemyId, 'statusEffects');
      if (statusEffects) {
        this.decrementTurnEffects(statusEffects.effects);
      }
    }

    this.transitionTo('player_turn_start');
  }

  private decrementTurnEffects(effects: Map<string, number>): void {
    const toDecrement = ['vulnerable', 'weak', 'frail', 'intangible', 'no_draw'];
    const toRemove = ['flame_barrier', 'rage', 'strength_down_eot'];

    for (const effectId of toDecrement) {
      const value = effects.get(effectId);
      if (value !== undefined && value > 0) {
        effects.set(effectId, value - 1);
        if (value - 1 <= 0) {
          effects.delete(effectId);
        }
      }
    }

    for (const effectId of toRemove) {
      if (effects.has(effectId)) {
        // Handle strength_down_eot
        if (effectId === 'strength_down_eot') {
          const amount = effects.get(effectId)!;
          const strength = effects.get('strength') || 0;
          effects.set('strength', strength - amount);
        }
        effects.delete(effectId);
      }
    }
  }

  private checkForDeaths(): void {
    // Check enemies
    const aliveEnemies: EntityId[] = [];
    for (const enemyId of this.state.enemyIds) {
      const health = this.world.getComponent(enemyId, 'health');
      if (health && health.current > 0) {
        aliveEnemies.push(enemyId);
      } else {
        this.world.destroyEntity(enemyId);
      }
    }

    this.state.enemyIds = aliveEnemies;

    if (aliveEnemies.length === 0) {
      this.transitionTo('victory');
    }
  }

  private onVictory(): void {
    // Generate rewards
    const isElite = this.state.enemyIds.some((id) =>
      this.world.hasTag(id, 'elite')
    );

    this.state.combatRewards = {
      gold: this.rng.randInt(10, 20) + (isElite ? 25 : 0),
      cardChoices: this.generateCardRewards(3),
      potions: [],
      relicId: isElite ? this.generateRelicReward() : undefined,
    };

    this.events.emit(GameEvents.COMBAT_END, {
      victory: true,
      rewards: this.state.combatRewards,
    });
  }

  private onDefeat(): void {
    this.events.emit(GameEvents.COMBAT_END, {
      victory: false,
    });
  }

  private generateCardRewards(count: number): string[] {
    const commonCards = Array.from(CardDatabase.values()).filter(
      (c) => c.rarity === 'common'
    );
    const uncommonCards = Array.from(CardDatabase.values()).filter(
      (c) => c.rarity === 'uncommon'
    );
    const rareCards = Array.from(CardDatabase.values()).filter(
      (c) => c.rarity === 'rare'
    );

    const rewards: string[] = [];
    for (let i = 0; i < count; i++) {
      const roll = this.rng.random();
      let pool;
      if (roll < 0.6) {
        pool = commonCards;
      } else if (roll < 0.93) {
        pool = uncommonCards;
      } else {
        pool = rareCards;
      }
      if (pool.length > 0) {
        rewards.push(this.rng.pick(pool).id);
      }
    }

    return rewards;
  }

  private generateRelicReward(): string {
    // Placeholder - would use relic database
    return 'vajra';
  }

  // Public methods for UI interaction

  /**
   * Select a card from hand
   */
  selectCard(index: number): void {
    if (this.state.phase !== 'player_turn') return;
    this.state.selectedCardIndex = index;
    this.state.selectedTargetId = null;
  }

  /**
   * Select a target for the selected card
   */
  selectTarget(targetId: EntityId): void {
    if (this.state.phase !== 'player_turn') return;
    if (this.state.selectedCardIndex === null) return;

    this.state.selectedTargetId = targetId;
    this.playSelectedCard();
  }

  /**
   * Play the selected card
   */
  playSelectedCard(): void {
    if (this.state.phase !== 'player_turn') return;
    if (this.state.selectedCardIndex === null) return;

    const gameState = this.store.getState();
    const cardId = gameState.hand[this.state.selectedCardIndex];
    const card = getCard(cardId);

    if (!card) return;

    // Check energy
    const energy = this.world.getComponent(this.state.playerId, 'energy');
    if (!energy || energy.current < card.cost) return;

    // Check if card needs a target
    if (card.target === 'enemy' && this.state.selectedTargetId === null) {
      // Need to select target first
      return;
    }

    // Pay energy
    energy.current -= card.cost;

    // Resolve effects
    this.resolver.resolveCard(
      cardId,
      this.state.playerId,
      this.state.selectedTargetId,
      false // TODO: Track upgraded state
    );

    // Move card to discard
    gameState.playCard(this.state.selectedCardIndex);

    // Clear selection
    this.state.selectedCardIndex = null;
    this.state.selectedTargetId = null;

    // Check for deaths
    this.checkForDeaths();
  }

  /**
   * End the player's turn
   */
  endTurn(): void {
    if (this.state.phase !== 'player_turn') return;
    this.transitionTo('player_turn_end');
  }

  /**
   * Get current combat state (for UI)
   */
  getState(): Readonly<CombatState> {
    return this.state;
  }

  /**
   * Get the world (for UI rendering)
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Force check for deaths (call after external damage like potions)
   */
  forceDeathCheck(): void {
    this.checkForDeaths();
  }

  /**
   * Check if combat has ended
   */
  isEnded(): boolean {
    return this.state.phase === 'victory' || this.state.phase === 'defeat';
  }
}
