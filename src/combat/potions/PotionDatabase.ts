/**
 * Potion definitions and database
 */

export type PotionRarity = 'common' | 'uncommon' | 'rare';
export type PotionSize = 'small' | 'medium' | 'large';

export interface PotionEffect {
  type: 'heal' | 'block' | 'strength' | 'dexterity' | 'energy' | 'draw' | 'damage_all' | 'artifact' | 'intangible';
  value: number;
}

export interface PotionDefinition {
  id: string;
  name: string;
  description: string;
  rarity: PotionRarity;
  color: number; // Hex color for the potion
  effects: PotionEffect[];
  combatOnly?: boolean; // Can only be used in combat
  needsTarget?: boolean; // Requires selecting an enemy target
}

export const PotionDatabase: Map<string, PotionDefinition> = new Map();

function addPotion(potion: PotionDefinition) {
  PotionDatabase.set(potion.id, potion);
}

// ============================================
// COMMON POTIONS
// ============================================

addPotion({
  id: 'health_potion',
  name: 'Health Potion',
  description: 'Heal 30 HP.',
  rarity: 'common',
  color: 0xff4444,
  effects: [{ type: 'heal', value: 30 }],
});

addPotion({
  id: 'block_potion',
  name: 'Block Potion',
  description: 'Gain 12 Block.',
  rarity: 'common',
  color: 0x4488ff,
  effects: [{ type: 'block', value: 12 }],
  combatOnly: true,
});

addPotion({
  id: 'energy_potion',
  name: 'Energy Potion',
  description: 'Gain 2 Energy.',
  rarity: 'common',
  color: 0xffdd44,
  effects: [{ type: 'energy', value: 2 }],
  combatOnly: true,
});

addPotion({
  id: 'swift_potion',
  name: 'Swift Potion',
  description: 'Draw 3 cards.',
  rarity: 'common',
  color: 0x44ffaa,
  effects: [{ type: 'draw', value: 3 }],
  combatOnly: true,
});

addPotion({
  id: 'fire_potion',
  name: 'Fire Potion',
  description: 'Deal 20 damage to ALL enemies. (Click enemy to use)',
  rarity: 'common',
  color: 0xff6600,
  effects: [{ type: 'damage_all', value: 20 }],
  combatOnly: true,
  needsTarget: true,
});

// ============================================
// UNCOMMON POTIONS
// ============================================

addPotion({
  id: 'strength_potion',
  name: 'Strength Potion',
  description: 'Gain 2 Strength for this combat.',
  rarity: 'uncommon',
  color: 0xcc4444,
  effects: [{ type: 'strength', value: 2 }],
  combatOnly: true,
});

addPotion({
  id: 'dexterity_potion',
  name: 'Dexterity Potion',
  description: 'Gain 2 Dexterity for this combat.',
  rarity: 'uncommon',
  color: 0x44cc44,
  effects: [{ type: 'dexterity', value: 2 }],
  combatOnly: true,
});

addPotion({
  id: 'regen_potion',
  name: 'Regen Potion',
  description: 'Heal 50 HP.',
  rarity: 'uncommon',
  color: 0xff6688,
  effects: [{ type: 'heal', value: 50 }],
});

addPotion({
  id: 'explosive_potion',
  name: 'Explosive Potion',
  description: 'Deal 35 damage to ALL enemies. (Click enemy to use)',
  rarity: 'uncommon',
  color: 0xff3300,
  effects: [{ type: 'damage_all', value: 35 }],
  combatOnly: true,
  needsTarget: true,
});

// ============================================
// RARE POTIONS
// ============================================

addPotion({
  id: 'fairy_potion',
  name: 'Fairy in a Bottle',
  description: 'Heal 30% of max HP when you die (automatically used).',
  rarity: 'rare',
  color: 0xffaaff,
  effects: [{ type: 'heal', value: 30 }], // 30% handled specially
});

addPotion({
  id: 'artifact_potion',
  name: 'Artifact Potion',
  description: 'Gain 2 Artifact.',
  rarity: 'rare',
  color: 0xddaa00,
  effects: [{ type: 'artifact', value: 2 }],
  combatOnly: true,
});

addPotion({
  id: 'intangible_potion',
  name: 'Ghost in a Jar',
  description: 'Gain 1 Intangible.',
  rarity: 'rare',
  color: 0xaaaadd,
  effects: [{ type: 'intangible', value: 1 }],
  combatOnly: true,
});

addPotion({
  id: 'elixir',
  name: 'Elixir',
  description: 'Fully heal your HP.',
  rarity: 'rare',
  color: 0xff00ff,
  effects: [{ type: 'heal', value: 999 }], // Full heal handled specially
});

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPotion(id: string): PotionDefinition | undefined {
  return PotionDatabase.get(id);
}

export function getAllPotions(): PotionDefinition[] {
  return Array.from(PotionDatabase.values());
}

export function getPotionsByRarity(rarity: PotionRarity): PotionDefinition[] {
  return Array.from(PotionDatabase.values()).filter(p => p.rarity === rarity);
}

export function getRandomPotion(rng: { random: () => number }): PotionDefinition {
  const potions = getAllPotions();
  // Weight by rarity
  const weighted: PotionDefinition[] = [];
  for (const potion of potions) {
    const weight = potion.rarity === 'common' ? 6 : potion.rarity === 'uncommon' ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(potion);
    }
  }
  return weighted[Math.floor(rng.random() * weighted.length)];
}
