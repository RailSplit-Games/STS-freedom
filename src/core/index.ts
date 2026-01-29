// Core module exports
export { GameManager } from './GameManager';
export { createGameStore } from './store';
export type {
  GamePhase,
  PlayerState,
  RunState,
  MetaState,
  GameState,
  GameActions,
  GameStore,
} from './store';

// ECS
export { World, System } from './ecs/ECS';
export type {
  EntityId,
  ComponentType,
  Component,
  HealthComponent,
  BlockComponent,
  EnergyComponent,
  IntentComponent,
  StatusEffectsComponent,
  PositionComponent,
  RenderComponent,
  EnemyAIComponent,
  NameComponent,
  CardComponent,
} from './ecs/ECS';

// Events
export { EventBus, GameEvents } from './events/EventBus';
export type {
  EventHandler,
  GameEvent,
  DamageEvent,
  HealEvent,
  CardPlayedEvent,
  TurnStartEvent,
  TurnEndEvent,
  CombatStartEvent,
  CombatEndEvent,
  StatusAppliedEvent,
  StatusRemovedEvent,
  NodeSelectedEvent,
  CardRewardEvent,
  GoldRewardEvent,
  RelicRewardEvent,
} from './events/EventBus';

// RNG
export { SeededRNG, RNGStreams } from './rng/SeededRNG';
