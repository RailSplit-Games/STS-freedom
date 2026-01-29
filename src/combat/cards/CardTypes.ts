/**
 * Card type definitions and effect system
 */

export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'special';
export type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse';
export type TargetType = 'enemy' | 'all_enemies' | 'self' | 'random_enemy' | 'none';

// Effect types that cards can have
export type EffectType =
  | 'damage'
  | 'damage_all'
  | 'block'
  | 'draw'
  | 'energy'
  | 'apply_status'
  | 'heal'
  | 'exhaust'
  | 'upgrade_random'
  | 'add_card_to_hand'
  | 'add_card_to_discard'
  | 'add_card_to_draw'
  | 'remove_status'
  | 'scale_damage' // For strength-like multipliers
  | 'conditional'; // For conditional effects

export interface CardEffect {
  type: EffectType;
  value: number;
  target?: TargetType;
  statusId?: string; // For apply_status
  cardId?: string; // For add_card effects
  times?: number; // For multi-hit
  condition?: EffectCondition;
}

export interface EffectCondition {
  type: 'has_status' | 'health_below' | 'energy_remaining' | 'cards_in_hand';
  statusId?: string;
  threshold?: number;
  comparison?: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
}

export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  costUpgraded?: number;
  target: TargetType;
  effects: CardEffect[];
  effectsUpgraded?: CardEffect[];
  keywords?: string[]; // innate, ethereal, exhaust, retain
  flavor?: string; // LLM can generate unique flavor text
}

export interface CardInstance {
  definitionId: string;
  instanceId: string;
  upgraded: boolean;
  costModifier: number; // Temporary cost changes
  exhaustOnPlay: boolean;
}

// Status effect definitions
export interface StatusDefinition {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'debuff';
  stackable: boolean;
  decrementOnTurnEnd?: boolean;
  decrementOnTurnStart?: boolean;
  removeAtTurnEnd?: boolean;
}

// Keyword definitions for reference
export const Keywords = {
  INNATE: 'innate', // Always in opening hand
  ETHEREAL: 'ethereal', // Exhaust if not played
  EXHAUST: 'exhaust', // Remove from deck for combat
  RETAIN: 'retain', // Don't discard at turn end
  UNPLAYABLE: 'unplayable', // Cannot be played
} as const;

// Common status effects
export const StatusEffects: Record<string, StatusDefinition> = {
  // Buffs
  strength: {
    id: 'strength',
    name: 'Strength',
    description: 'Increases attack damage by X',
    type: 'buff',
    stackable: true,
  },
  dexterity: {
    id: 'dexterity',
    name: 'Dexterity',
    description: 'Increases block gained by X',
    type: 'buff',
    stackable: true,
  },
  artifact: {
    id: 'artifact',
    name: 'Artifact',
    description: 'Negates X debuffs',
    type: 'buff',
    stackable: true,
  },
  intangible: {
    id: 'intangible',
    name: 'Intangible',
    description: 'Reduce all damage to 1',
    type: 'buff',
    stackable: true,
    decrementOnTurnEnd: true,
  },
  thorns: {
    id: 'thorns',
    name: 'Thorns',
    description: 'Deal X damage when attacked',
    type: 'buff',
    stackable: true,
  },
  metallicize: {
    id: 'metallicize',
    name: 'Metallicize',
    description: 'Gain X block at end of turn',
    type: 'buff',
    stackable: true,
  },
  rage: {
    id: 'rage',
    name: 'Rage',
    description: 'Gain X block when playing an Attack',
    type: 'buff',
    stackable: true,
  },

  // Debuffs
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Take 50% more damage from attacks',
    type: 'debuff',
    stackable: true,
    decrementOnTurnEnd: true,
  },
  weak: {
    id: 'weak',
    name: 'Weak',
    description: 'Deal 25% less attack damage',
    type: 'debuff',
    stackable: true,
    decrementOnTurnEnd: true,
  },
  frail: {
    id: 'frail',
    name: 'Frail',
    description: 'Gain 25% less block from cards',
    type: 'debuff',
    stackable: true,
    decrementOnTurnEnd: true,
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    description: 'Lose X HP at start of turn, then reduce by 1',
    type: 'debuff',
    stackable: true,
  },
  entangle: {
    id: 'entangle',
    name: 'Entangle',
    description: 'Cannot play Attacks this turn',
    type: 'debuff',
    stackable: false,
    removeAtTurnEnd: true,
  },
};
