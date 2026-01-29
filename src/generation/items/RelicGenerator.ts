import { SeededRNG } from '../../core/rng/SeededRNG';
import { LLMClient } from '../../llm/client/LLMClient';

export type RelicRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop' | 'event';
export type RelicCategory = 'offensive' | 'defensive' | 'utility' | 'economy' | 'special';

export interface RelicAffix {
  id: string;
  name: string;
  description: string;
  category: RelicCategory;
  tier: number; // 1-3, higher = stronger
  effect: RelicEffect;
  weight: number;
  incompatible?: string[]; // Affix IDs that can't combine with this
}

export interface RelicEffect {
  type: string;
  trigger: RelicTrigger;
  value: number;
  scaling?: { stat: string; multiplier: number };
}

export type RelicTrigger =
  | 'combat_start'
  | 'combat_end'
  | 'turn_start'
  | 'turn_end'
  | 'on_attack'
  | 'on_kill'
  | 'on_damage_taken'
  | 'on_card_play'
  | 'on_block_gain'
  | 'on_status_apply'
  | 'passive';

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  rarity: RelicRarity;
  category: RelicCategory;
  effects: RelicEffect[];
  sprite: string;
  isGenerated?: boolean;
  affixes?: string[]; // Affix IDs if procedurally generated
}

export interface GeneratedRelic extends RelicDefinition {
  isGenerated: true;
  baseType: string;
  affixes: string[];
  seed: string;
}

// Affix pool for procedural generation
const AffixPool: RelicAffix[] = [
  // Offensive - Tier 1
  {
    id: 'sharp',
    name: 'Sharp',
    description: '+1 damage on attacks',
    category: 'offensive',
    tier: 1,
    effect: { type: 'damage_bonus', trigger: 'on_attack', value: 1 },
    weight: 100,
  },
  {
    id: 'cruel',
    name: 'Cruel',
    description: '+2 damage vs Vulnerable',
    category: 'offensive',
    tier: 1,
    effect: { type: 'damage_vs_vulnerable', trigger: 'on_attack', value: 2 },
    weight: 80,
  },
  {
    id: 'swift',
    name: 'Swift',
    description: 'Draw 1 extra card on turn 1',
    category: 'offensive',
    tier: 1,
    effect: { type: 'draw_turn_1', trigger: 'combat_start', value: 1 },
    weight: 90,
  },

  // Offensive - Tier 2
  {
    id: 'vicious',
    name: 'Vicious',
    description: '+3 damage on attacks',
    category: 'offensive',
    tier: 2,
    effect: { type: 'damage_bonus', trigger: 'on_attack', value: 3 },
    weight: 50,
    incompatible: ['sharp'],
  },
  {
    id: 'bloodthirsty',
    name: 'Bloodthirsty',
    description: 'Heal 2 HP on kill',
    category: 'offensive',
    tier: 2,
    effect: { type: 'heal_on_kill', trigger: 'on_kill', value: 2 },
    weight: 60,
  },
  {
    id: 'frenzied',
    name: 'Frenzied',
    description: 'Gain 1 Strength each turn',
    category: 'offensive',
    tier: 2,
    effect: { type: 'gain_strength', trigger: 'turn_start', value: 1 },
    weight: 40,
  },

  // Offensive - Tier 3
  {
    id: 'annihilating',
    name: 'Annihilating',
    description: '+5 damage on attacks',
    category: 'offensive',
    tier: 3,
    effect: { type: 'damage_bonus', trigger: 'on_attack', value: 5 },
    weight: 20,
    incompatible: ['sharp', 'vicious'],
  },

  // Defensive - Tier 1
  {
    id: 'sturdy',
    name: 'Sturdy',
    description: '+2 Block at start of combat',
    category: 'defensive',
    tier: 1,
    effect: { type: 'starting_block', trigger: 'combat_start', value: 2 },
    weight: 100,
  },
  {
    id: 'hardened',
    name: 'Hardened',
    description: '+1 Block when gaining Block',
    category: 'defensive',
    tier: 1,
    effect: { type: 'block_bonus', trigger: 'on_block_gain', value: 1 },
    weight: 80,
  },
  {
    id: 'resilient',
    name: 'Resilient',
    description: 'Debuffs last 1 less turn',
    category: 'defensive',
    tier: 1,
    effect: { type: 'debuff_reduction', trigger: 'passive', value: 1 },
    weight: 70,
  },

  // Defensive - Tier 2
  {
    id: 'fortified',
    name: 'Fortified',
    description: '+5 Block at start of combat',
    category: 'defensive',
    tier: 2,
    effect: { type: 'starting_block', trigger: 'combat_start', value: 5 },
    weight: 50,
    incompatible: ['sturdy'],
  },
  {
    id: 'thorned',
    name: 'Thorned',
    description: 'Gain 2 Thorns',
    category: 'defensive',
    tier: 2,
    effect: { type: 'gain_thorns', trigger: 'combat_start', value: 2 },
    weight: 60,
  },
  {
    id: 'regenerating',
    name: 'Regenerating',
    description: 'Heal 1 HP at end of combat',
    category: 'defensive',
    tier: 2,
    effect: { type: 'heal_combat_end', trigger: 'combat_end', value: 1 },
    weight: 55,
  },

  // Defensive - Tier 3
  {
    id: 'invulnerable',
    name: 'Invulnerable',
    description: 'Start combat with 1 Intangible',
    category: 'defensive',
    tier: 3,
    effect: { type: 'starting_intangible', trigger: 'combat_start', value: 1 },
    weight: 15,
  },

  // Utility - Tier 1
  {
    id: 'lucky',
    name: 'Lucky',
    description: '+5% gold from enemies',
    category: 'utility',
    tier: 1,
    effect: { type: 'gold_bonus', trigger: 'on_kill', value: 5 },
    weight: 90,
  },
  {
    id: 'insightful',
    name: 'Insightful',
    description: 'See enemy intents for +1 turn',
    category: 'utility',
    tier: 1,
    effect: { type: 'intent_range', trigger: 'passive', value: 1 },
    weight: 70,
  },
  {
    id: 'prepared',
    name: 'Prepared',
    description: 'Start combat with 1 energy',
    category: 'utility',
    tier: 1,
    effect: { type: 'starting_energy', trigger: 'combat_start', value: 1 },
    weight: 60,
  },

  // Utility - Tier 2
  {
    id: 'wealthy',
    name: 'Wealthy',
    description: '+15% gold from all sources',
    category: 'utility',
    tier: 2,
    effect: { type: 'gold_bonus_all', trigger: 'passive', value: 15 },
    weight: 40,
    incompatible: ['lucky'],
  },
  {
    id: 'energized',
    name: 'Energized',
    description: '+1 energy on turn 1',
    category: 'utility',
    tier: 2,
    effect: { type: 'energy_turn_1', trigger: 'turn_start', value: 1 },
    weight: 45,
  },

  // Economy - Tier 1
  {
    id: 'mercantile',
    name: 'Mercantile',
    description: '10% shop discount',
    category: 'economy',
    tier: 1,
    effect: { type: 'shop_discount', trigger: 'passive', value: 10 },
    weight: 80,
  },
  {
    id: 'scavenging',
    name: 'Scavenging',
    description: 'Find +1 potion slot',
    category: 'economy',
    tier: 1,
    effect: { type: 'potion_slots', trigger: 'passive', value: 1 },
    weight: 70,
  },

  // Economy - Tier 2
  {
    id: 'prosperous',
    name: 'Prosperous',
    description: 'Start run with +50 gold',
    category: 'economy',
    tier: 2,
    effect: { type: 'starting_gold', trigger: 'passive', value: 50 },
    weight: 40,
  },

  // Special
  {
    id: 'cursed',
    name: 'Cursed',
    description: 'Take 3 damage at start of combat',
    category: 'special',
    tier: 1,
    effect: { type: 'curse_damage', trigger: 'combat_start', value: 3 },
    weight: 100, // Used for corruption mechanic
  },
  {
    id: 'ancient',
    name: 'Ancient',
    description: 'Effects scale with floor',
    category: 'special',
    tier: 2,
    effect: { type: 'floor_scaling', trigger: 'passive', value: 1, scaling: { stat: 'floor', multiplier: 0.1 } },
    weight: 30,
  },
];

// Base relic types for generation
const BaseRelicTypes: Array<{ id: string; name: string; sprite: string; slots: number }> = [
  { id: 'amulet', name: 'Amulet', sprite: 'relic_amulet', slots: 2 },
  { id: 'ring', name: 'Ring', sprite: 'relic_ring', slots: 2 },
  { id: 'charm', name: 'Charm', sprite: 'relic_charm', slots: 1 },
  { id: 'totem', name: 'Totem', sprite: 'relic_totem', slots: 3 },
  { id: 'orb', name: 'Orb', sprite: 'relic_orb', slots: 2 },
  { id: 'skull', name: 'Skull', sprite: 'relic_skull', slots: 2 },
];

/**
 * Generates procedural relics with affix combinations
 */
export class RelicGenerator {
  private rng: SeededRNG;
  private llm: LLMClient;

  constructor(rng: SeededRNG, llm: LLMClient) {
    this.rng = rng.getStream('items');
    this.llm = llm;
  }

  /**
   * Generate a random relic
   */
  async generate(rarity: RelicRarity, seed: string): Promise<GeneratedRelic> {
    const baseType = this.rng.pick(BaseRelicTypes);
    const affixes = this.selectAffixes(baseType.slots, rarity);

    // Calculate combined rarity based on affix tiers
    const avgTier = affixes.reduce((sum, a) => sum + a.tier, 0) / affixes.length;
    const actualRarity = avgTier >= 2.5 ? 'rare' : avgTier >= 1.5 ? 'uncommon' : 'common';

    // Combine effects
    const effects = affixes.map((a) => a.effect);

    // Generate name and description via LLM (or fallback)
    const generated = await this.llm.generateItem(
      baseType.name,
      affixes.map((a) => a.name),
      actualRarity,
      seed
    );

    // Combine descriptions
    const mechanicalDesc = affixes.map((a) => a.description).join('. ') + '.';

    return {
      id: `generated_${seed}`,
      name: generated.name,
      description: mechanicalDesc,
      flavor: generated.flavor,
      rarity: actualRarity as RelicRarity,
      category: this.determinePrimaryCategory(affixes),
      effects,
      sprite: baseType.sprite,
      isGenerated: true,
      baseType: baseType.id,
      affixes: affixes.map((a) => a.id),
      seed,
    };
  }

  /**
   * Select affixes based on rarity and compatibility
   */
  private selectAffixes(slotCount: number, rarity: RelicRarity): RelicAffix[] {
    const selected: RelicAffix[] = [];
    const availablePool = [...AffixPool];

    // Higher rarity = higher tier affixes allowed
    const maxTier = rarity === 'rare' || rarity === 'boss' ? 3 :
                    rarity === 'uncommon' ? 2 : 1;

    for (let i = 0; i < slotCount; i++) {
      // Filter by tier and compatibility
      const eligible = availablePool.filter((affix) => {
        if (affix.tier > maxTier) return false;

        // Check incompatibility
        if (affix.incompatible) {
          for (const sel of selected) {
            if (affix.incompatible.includes(sel.id)) return false;
          }
        }

        // Check if already selected
        if (selected.some((s) => s.id === affix.id)) return false;

        // Avoid too many same-category affixes
        const sameCategoryCount = selected.filter((s) => s.category === affix.category).length;
        if (sameCategoryCount >= 2) return false;

        return true;
      });

      if (eligible.length === 0) break;

      // Weighted selection
      const weights = eligible.map((a) => a.weight);
      const selected_affix = this.rng.weightedPickItem(eligible, weights);
      selected.push(selected_affix);

      // Remove from pool
      const idx = availablePool.findIndex((a) => a.id === selected_affix.id);
      if (idx !== -1) availablePool.splice(idx, 1);
    }

    return selected;
  }

  private determinePrimaryCategory(affixes: RelicAffix[]): RelicCategory {
    const counts: Record<RelicCategory, number> = {
      offensive: 0,
      defensive: 0,
      utility: 0,
      economy: 0,
      special: 0,
    };

    for (const affix of affixes) {
      counts[affix.category]++;
    }

    let max: RelicCategory = 'utility';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        max = cat as RelicCategory;
      }
    }

    return max;
  }

  /**
   * Get affix by ID
   */
  getAffix(id: string): RelicAffix | undefined {
    return AffixPool.find((a) => a.id === id);
  }

  /**
   * Get all affixes of a tier
   */
  getAffixesByTier(tier: number): RelicAffix[] {
    return AffixPool.filter((a) => a.tier === tier);
  }
}

// Pre-defined relics (non-generated)
export const DefinedRelics: RelicDefinition[] = [
  {
    id: 'burning_blood',
    name: 'Burning Blood',
    description: 'At the end of combat, heal 6 HP.',
    rarity: 'starter',
    category: 'defensive',
    effects: [{ type: 'heal_combat_end', trigger: 'combat_end', value: 6 }],
    sprite: 'burning_blood',
  },
  {
    id: 'vajra',
    name: 'Vajra',
    description: 'Start each combat with 1 Strength.',
    rarity: 'common',
    category: 'offensive',
    effects: [{ type: 'starting_strength', trigger: 'combat_start', value: 1 }],
    sprite: 'vajra',
  },
  {
    id: 'anchor',
    name: 'Anchor',
    description: 'Start each combat with 10 Block.',
    rarity: 'common',
    category: 'defensive',
    effects: [{ type: 'starting_block', trigger: 'combat_start', value: 10 }],
    sprite: 'anchor',
  },
  {
    id: 'lantern',
    name: 'Lantern',
    description: 'Gain 1 Energy on the first turn of each combat.',
    rarity: 'common',
    category: 'utility',
    effects: [{ type: 'energy_turn_1', trigger: 'turn_start', value: 1 }],
    sprite: 'lantern',
  },
  {
    id: 'bag_of_preparation',
    name: 'Bag of Preparation',
    description: 'At the start of each combat, draw 2 additional cards.',
    rarity: 'common',
    category: 'utility',
    effects: [{ type: 'draw_combat_start', trigger: 'combat_start', value: 2 }],
    sprite: 'bag_of_prep',
  },
  {
    id: 'cursed_key',
    name: 'Cursed Key',
    description: 'Gain 1 Energy at the start of each turn. Gain 1 Curse whenever you open a chest.',
    rarity: 'boss',
    category: 'special',
    effects: [{ type: 'energy_per_turn', trigger: 'turn_start', value: 1 }],
    sprite: 'cursed_key',
  },
  {
    id: 'philosophers_stone',
    name: "Philosopher's Stone",
    description: 'Gain 1 Energy at the start of each turn. ALL enemies start with 1 Strength.',
    rarity: 'boss',
    category: 'special',
    effects: [
      { type: 'energy_per_turn', trigger: 'turn_start', value: 1 },
      { type: 'enemy_strength', trigger: 'combat_start', value: 1 },
    ],
    sprite: 'philosophers_stone',
  },
];
