import { CardDefinition } from './CardTypes';

/**
 * Card definitions database
 * These are the base definitions - LLM can generate flavor text variations
 */
export const CardDatabase: Map<string, CardDefinition> = new Map();

// Helper to add cards
function addCard(card: CardDefinition) {
  CardDatabase.set(card.id, card);
}

// ============================================
// STARTER CARDS
// ============================================

addCard({
  id: 'strike',
  name: 'Strike',
  description: 'Deal 6 damage.',
  type: 'attack',
  rarity: 'starter',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 6 }],
  effectsUpgraded: [{ type: 'damage', value: 9 }],
});

addCard({
  id: 'defend',
  name: 'Defend',
  description: 'Gain 5 Block.',
  type: 'skill',
  rarity: 'starter',
  cost: 1,
  target: 'self',
  effects: [{ type: 'block', value: 5 }],
  effectsUpgraded: [{ type: 'block', value: 8 }],
});

addCard({
  id: 'bash',
  name: 'Bash',
  description: 'Deal 8 damage. Apply 2 Vulnerable.',
  type: 'attack',
  rarity: 'starter',
  cost: 2,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 8 },
    { type: 'apply_status', value: 2, statusId: 'vulnerable' },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 10 },
    { type: 'apply_status', value: 3, statusId: 'vulnerable' },
  ],
});

// ============================================
// COMMON ATTACKS
// ============================================

addCard({
  id: 'anger',
  name: 'Anger',
  description: 'Deal 6 damage. Add a copy to your discard pile.',
  type: 'attack',
  rarity: 'common',
  cost: 0,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 6 },
    { type: 'add_card_to_discard', value: 1, cardId: 'anger' },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 8 },
    { type: 'add_card_to_discard', value: 1, cardId: 'anger' },
  ],
});

addCard({
  id: 'cleave',
  name: 'Cleave',
  description: 'Deal 8 damage to ALL enemies.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'all_enemies',
  effects: [{ type: 'damage_all', value: 8 }],
  effectsUpgraded: [{ type: 'damage_all', value: 11 }],
});

addCard({
  id: 'clothesline',
  name: 'Clothesline',
  description: 'Deal 12 damage. Apply 2 Weak.',
  type: 'attack',
  rarity: 'common',
  cost: 2,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 12 },
    { type: 'apply_status', value: 2, statusId: 'weak' },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 14 },
    { type: 'apply_status', value: 3, statusId: 'weak' },
  ],
});

addCard({
  id: 'headbutt',
  name: 'Headbutt',
  description: 'Deal 9 damage. Put a card from discard on top of draw pile.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 9 }],
  // Note: The "put card on draw" effect would need special handling
  effectsUpgraded: [{ type: 'damage', value: 12 }],
});

addCard({
  id: 'iron_wave',
  name: 'Iron Wave',
  description: 'Deal 5 damage. Gain 5 Block.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 5 },
    { type: 'block', value: 5 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 7 },
    { type: 'block', value: 7 },
  ],
});

addCard({
  id: 'pommel_strike',
  name: 'Pommel Strike',
  description: 'Deal 9 damage. Draw 1 card.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 9 },
    { type: 'draw', value: 1 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 10 },
    { type: 'draw', value: 2 },
  ],
});

addCard({
  id: 'sword_boomerang',
  name: 'Sword Boomerang',
  description: 'Deal 3 damage to a random enemy 3 times.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'random_enemy',
  effects: [{ type: 'damage', value: 3, times: 3 }],
  effectsUpgraded: [{ type: 'damage', value: 3, times: 4 }],
});

addCard({
  id: 'twin_strike',
  name: 'Twin Strike',
  description: 'Deal 5 damage twice.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 5, times: 2 }],
  effectsUpgraded: [{ type: 'damage', value: 7, times: 2 }],
});

addCard({
  id: 'wild_strike',
  name: 'Wild Strike',
  description: 'Deal 12 damage. Shuffle a Wound into your draw pile.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 12 },
    { type: 'add_card_to_draw', value: 1, cardId: 'wound' },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 17 },
    { type: 'add_card_to_draw', value: 1, cardId: 'wound' },
  ],
});

// ============================================
// COMMON SKILLS
// ============================================

addCard({
  id: 'armaments',
  name: 'Armaments',
  description: 'Gain 5 Block. Upgrade a card in your hand for this combat.',
  type: 'skill',
  rarity: 'common',
  cost: 1,
  target: 'self',
  effects: [
    { type: 'block', value: 5 },
    { type: 'upgrade_random', value: 1 },
  ],
  effectsUpgraded: [
    { type: 'block', value: 5 },
    // Upgraded: Upgrade ALL cards in hand
  ],
});

addCard({
  id: 'flex',
  name: 'Flex',
  description: 'Gain 2 Strength. Lose 2 Strength at end of turn.',
  type: 'skill',
  rarity: 'common',
  cost: 0,
  target: 'self',
  effects: [
    { type: 'apply_status', value: 2, statusId: 'strength' },
    { type: 'apply_status', value: 2, statusId: 'strength_down_eot' },
  ],
  effectsUpgraded: [
    { type: 'apply_status', value: 4, statusId: 'strength' },
    { type: 'apply_status', value: 4, statusId: 'strength_down_eot' },
  ],
});

addCard({
  id: 'havoc',
  name: 'Havoc',
  description: 'Play the top card of your draw pile and Exhaust it.',
  type: 'skill',
  rarity: 'common',
  cost: 1,
  costUpgraded: 0,
  target: 'none',
  effects: [],
  keywords: ['exhaust'],
});

addCard({
  id: 'shrug_it_off',
  name: 'Shrug It Off',
  description: 'Gain 8 Block. Draw 1 card.',
  type: 'skill',
  rarity: 'common',
  cost: 1,
  target: 'self',
  effects: [
    { type: 'block', value: 8 },
    { type: 'draw', value: 1 },
  ],
  effectsUpgraded: [
    { type: 'block', value: 11 },
    { type: 'draw', value: 1 },
  ],
});

addCard({
  id: 'true_grit',
  name: 'True Grit',
  description: 'Gain 7 Block. Exhaust a random card in your hand.',
  type: 'skill',
  rarity: 'common',
  cost: 1,
  target: 'self',
  effects: [
    { type: 'block', value: 7 },
    { type: 'exhaust', value: 1 },
  ],
  effectsUpgraded: [
    { type: 'block', value: 9 },
    // Upgraded: Choose instead of random
  ],
});

addCard({
  id: 'warcry',
  name: 'Warcry',
  description: 'Draw 1 card. Put a card from your hand on top of draw pile.',
  type: 'skill',
  rarity: 'common',
  cost: 0,
  target: 'self',
  effects: [{ type: 'draw', value: 1 }],
  effectsUpgraded: [{ type: 'draw', value: 2 }],
  keywords: ['exhaust'],
});

// ============================================
// UNCOMMON ATTACKS
// ============================================

addCard({
  id: 'blood_for_blood',
  name: 'Blood for Blood',
  description: 'Costs 1 less for each HP lost this combat. Deal 18 damage.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 4,
  target: 'enemy',
  effects: [{ type: 'damage', value: 18 }],
  effectsUpgraded: [{ type: 'damage', value: 22 }],
});

addCard({
  id: 'carnage',
  name: 'Carnage',
  description: 'Deal 20 damage.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 2,
  target: 'enemy',
  effects: [{ type: 'damage', value: 20 }],
  effectsUpgraded: [{ type: 'damage', value: 28 }],
  keywords: ['ethereal'],
});

addCard({
  id: 'dropkick',
  name: 'Dropkick',
  description: 'Deal 5 damage. If the enemy is Vulnerable, gain 1 energy and draw 1 card.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 5 },
    {
      type: 'conditional',
      value: 1,
      condition: { type: 'has_status', statusId: 'vulnerable' },
    },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 8 },
    {
      type: 'conditional',
      value: 1,
      condition: { type: 'has_status', statusId: 'vulnerable' },
    },
  ],
});

addCard({
  id: 'hemokinesis',
  name: 'Hemokinesis',
  description: 'Lose 2 HP. Deal 15 damage.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: -2, target: 'self' }, // Self damage
    { type: 'damage', value: 15 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: -2, target: 'self' },
    { type: 'damage', value: 20 },
  ],
});

addCard({
  id: 'pummel',
  name: 'Pummel',
  description: 'Deal 2 damage 4 times.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 2, times: 4 }],
  effectsUpgraded: [{ type: 'damage', value: 2, times: 5 }],
  keywords: ['exhaust'],
});

addCard({
  id: 'rampage',
  name: 'Rampage',
  description: 'Deal 8 damage. Increase this card\'s damage by 5 this combat.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 8 }],
  effectsUpgraded: [{ type: 'damage', value: 8 }], // +8 per play instead of +5
});

addCard({
  id: 'uppercut',
  name: 'Uppercut',
  description: 'Deal 13 damage. Apply 1 Weak. Apply 1 Vulnerable.',
  type: 'attack',
  rarity: 'uncommon',
  cost: 2,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 13 },
    { type: 'apply_status', value: 1, statusId: 'weak' },
    { type: 'apply_status', value: 1, statusId: 'vulnerable' },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 13 },
    { type: 'apply_status', value: 2, statusId: 'weak' },
    { type: 'apply_status', value: 2, statusId: 'vulnerable' },
  ],
});

// ============================================
// UNCOMMON SKILLS
// ============================================

addCard({
  id: 'battle_trance',
  name: 'Battle Trance',
  description: 'Draw 3 cards. You cannot draw additional cards this turn.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 0,
  target: 'self',
  effects: [
    { type: 'draw', value: 3 },
    { type: 'apply_status', value: 1, statusId: 'no_draw' },
  ],
  effectsUpgraded: [
    { type: 'draw', value: 4 },
    { type: 'apply_status', value: 1, statusId: 'no_draw' },
  ],
});

addCard({
  id: 'bloodletting',
  name: 'Bloodletting',
  description: 'Lose 3 HP. Gain 2 Energy.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 0,
  target: 'self',
  effects: [
    { type: 'damage', value: -3, target: 'self' },
    { type: 'energy', value: 2 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: -3, target: 'self' },
    { type: 'energy', value: 3 },
  ],
});

addCard({
  id: 'entrench',
  name: 'Entrench',
  description: 'Double your Block.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 2,
  costUpgraded: 1,
  target: 'self',
  effects: [], // Special effect: doubles block
});

addCard({
  id: 'flame_barrier',
  name: 'Flame Barrier',
  description: 'Gain 12 Block. Whenever you are attacked this turn, deal 4 damage back.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 2,
  target: 'self',
  effects: [
    { type: 'block', value: 12 },
    { type: 'apply_status', value: 4, statusId: 'flame_barrier' },
  ],
  effectsUpgraded: [
    { type: 'block', value: 16 },
    { type: 'apply_status', value: 6, statusId: 'flame_barrier' },
  ],
});

addCard({
  id: 'ghostly_armor',
  name: 'Ghostly Armor',
  description: 'Gain 10 Block.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 1,
  target: 'self',
  effects: [{ type: 'block', value: 10 }],
  effectsUpgraded: [{ type: 'block', value: 13 }],
  keywords: ['ethereal'],
});

addCard({
  id: 'intimidate',
  name: 'Intimidate',
  description: 'Apply 1 Weak to ALL enemies.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 0,
  target: 'all_enemies',
  effects: [{ type: 'apply_status', value: 1, statusId: 'weak', target: 'all_enemies' }],
  effectsUpgraded: [{ type: 'apply_status', value: 2, statusId: 'weak', target: 'all_enemies' }],
  keywords: ['exhaust'],
});

addCard({
  id: 'offering',
  name: 'Offering',
  description: 'Lose 6 HP. Gain 2 Energy. Draw 3 cards.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 0,
  target: 'self',
  effects: [
    { type: 'damage', value: -6, target: 'self' },
    { type: 'energy', value: 2 },
    { type: 'draw', value: 3 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: -6, target: 'self' },
    { type: 'energy', value: 2 },
    { type: 'draw', value: 5 },
  ],
  keywords: ['exhaust'],
});

addCard({
  id: 'shockwave',
  name: 'Shockwave',
  description: 'Apply 3 Weak and Vulnerable to ALL enemies.',
  type: 'skill',
  rarity: 'uncommon',
  cost: 2,
  target: 'all_enemies',
  effects: [
    { type: 'apply_status', value: 3, statusId: 'weak', target: 'all_enemies' },
    { type: 'apply_status', value: 3, statusId: 'vulnerable', target: 'all_enemies' },
  ],
  effectsUpgraded: [
    { type: 'apply_status', value: 5, statusId: 'weak', target: 'all_enemies' },
    { type: 'apply_status', value: 5, statusId: 'vulnerable', target: 'all_enemies' },
  ],
  keywords: ['exhaust'],
});

// ============================================
// RARE ATTACKS
// ============================================

addCard({
  id: 'bludgeon',
  name: 'Bludgeon',
  description: 'Deal 32 damage.',
  type: 'attack',
  rarity: 'rare',
  cost: 3,
  target: 'enemy',
  effects: [{ type: 'damage', value: 32 }],
  effectsUpgraded: [{ type: 'damage', value: 42 }],
});

addCard({
  id: 'feed',
  name: 'Feed',
  description: 'Deal 10 damage. If this kills, gain 3 Max HP.',
  type: 'attack',
  rarity: 'rare',
  cost: 1,
  target: 'enemy',
  effects: [{ type: 'damage', value: 10 }],
  effectsUpgraded: [{ type: 'damage', value: 12 }], // +4 Max HP
  keywords: ['exhaust'],
});

addCard({
  id: 'fiend_fire',
  name: 'Fiend Fire',
  description: 'Exhaust all cards in your hand. Deal 7 damage for each card exhausted.',
  type: 'attack',
  rarity: 'rare',
  cost: 2,
  target: 'enemy',
  effects: [], // Special handling
  keywords: ['exhaust'],
});

addCard({
  id: 'immolate',
  name: 'Immolate',
  description: 'Deal 21 damage to ALL enemies. Add a Burn to your discard pile.',
  type: 'attack',
  rarity: 'rare',
  cost: 2,
  target: 'all_enemies',
  effects: [
    { type: 'damage_all', value: 21 },
    { type: 'add_card_to_discard', value: 1, cardId: 'burn' },
  ],
  effectsUpgraded: [
    { type: 'damage_all', value: 28 },
    { type: 'add_card_to_discard', value: 1, cardId: 'burn' },
  ],
});

addCard({
  id: 'reaper',
  name: 'Reaper',
  description: 'Deal 4 damage to ALL enemies. Heal HP for unblocked damage.',
  type: 'attack',
  rarity: 'rare',
  cost: 2,
  target: 'all_enemies',
  effects: [{ type: 'damage_all', value: 4 }],
  effectsUpgraded: [{ type: 'damage_all', value: 5 }],
  keywords: ['exhaust'],
});

// ============================================
// RARE SKILLS
// ============================================

addCard({
  id: 'impervious',
  name: 'Impervious',
  description: 'Gain 30 Block.',
  type: 'skill',
  rarity: 'rare',
  cost: 2,
  target: 'self',
  effects: [{ type: 'block', value: 30 }],
  effectsUpgraded: [{ type: 'block', value: 40 }],
  keywords: ['exhaust'],
});

addCard({
  id: 'limit_break',
  name: 'Limit Break',
  description: 'Double your Strength.',
  type: 'skill',
  rarity: 'rare',
  cost: 1,
  target: 'self',
  effects: [], // Special handling
  keywords: ['exhaust'],
  // Upgraded removes Exhaust
});

addCard({
  id: 'second_wind',
  name: 'Second Wind',
  description: 'Exhaust all non-Attack cards in hand. Gain 5 Block for each.',
  type: 'skill',
  rarity: 'rare',
  cost: 1,
  target: 'self',
  effects: [], // Special handling
  effectsUpgraded: [], // +7 Block per card
});

// ============================================
// POWERS
// ============================================

addCard({
  id: 'demon_form',
  name: 'Demon Form',
  description: 'At the start of each turn, gain 2 Strength.',
  type: 'power',
  rarity: 'rare',
  cost: 3,
  target: 'self',
  effects: [{ type: 'apply_status', value: 1, statusId: 'demon_form' }],
  effectsUpgraded: [{ type: 'apply_status', value: 1, statusId: 'demon_form_plus' }], // +3 Strength
});

addCard({
  id: 'inflame',
  name: 'Inflame',
  description: 'Gain 2 Strength.',
  type: 'power',
  rarity: 'uncommon',
  cost: 1,
  target: 'self',
  effects: [{ type: 'apply_status', value: 2, statusId: 'strength' }],
  effectsUpgraded: [{ type: 'apply_status', value: 3, statusId: 'strength' }],
});

addCard({
  id: 'metallicize',
  name: 'Metallicize',
  description: 'At the end of your turn, gain 3 Block.',
  type: 'power',
  rarity: 'uncommon',
  cost: 1,
  target: 'self',
  effects: [{ type: 'apply_status', value: 3, statusId: 'metallicize' }],
  effectsUpgraded: [{ type: 'apply_status', value: 4, statusId: 'metallicize' }],
});

addCard({
  id: 'barricade',
  name: 'Barricade',
  description: 'Block is not removed at the start of your turn.',
  type: 'power',
  rarity: 'rare',
  cost: 3,
  costUpgraded: 2,
  target: 'self',
  effects: [{ type: 'apply_status', value: 1, statusId: 'barricade' }],
});

addCard({
  id: 'brutality',
  name: 'Brutality',
  description: 'At the start of your turn, lose 1 HP and draw 1 card.',
  type: 'power',
  rarity: 'rare',
  cost: 0,
  target: 'self',
  effects: [{ type: 'apply_status', value: 1, statusId: 'brutality' }],
  keywords: ['innate'],
});

addCard({
  id: 'corruption',
  name: 'Corruption',
  description: 'Skills cost 0. Whenever you play a Skill, Exhaust it.',
  type: 'power',
  rarity: 'rare',
  cost: 3,
  costUpgraded: 2,
  target: 'self',
  effects: [{ type: 'apply_status', value: 1, statusId: 'corruption' }],
});

addCard({
  id: 'juggernaut',
  name: 'Juggernaut',
  description: 'Whenever you gain Block, deal 5 damage to a random enemy.',
  type: 'power',
  rarity: 'rare',
  cost: 2,
  target: 'self',
  effects: [{ type: 'apply_status', value: 5, statusId: 'juggernaut' }],
  effectsUpgraded: [{ type: 'apply_status', value: 7, statusId: 'juggernaut' }],
});

// ============================================
// STATUS/CURSE CARDS
// ============================================

addCard({
  id: 'wound',
  name: 'Wound',
  description: 'Unplayable.',
  type: 'status',
  rarity: 'special',
  cost: -1, // Unplayable
  target: 'none',
  effects: [],
  keywords: ['unplayable'],
});

addCard({
  id: 'burn',
  name: 'Burn',
  description: 'Unplayable. At end of turn, take 2 damage.',
  type: 'status',
  rarity: 'special',
  cost: -1,
  target: 'none',
  effects: [],
  keywords: ['unplayable'],
});

addCard({
  id: 'dazed',
  name: 'Dazed',
  description: 'Unplayable. Ethereal.',
  type: 'status',
  rarity: 'special',
  cost: -1,
  target: 'none',
  effects: [],
  keywords: ['unplayable', 'ethereal'],
});

addCard({
  id: 'slimed',
  name: 'Slimed',
  description: 'Exhaust.',
  type: 'status',
  rarity: 'special',
  cost: 1,
  target: 'none',
  effects: [],
  keywords: ['exhaust'],
});

addCard({
  id: 'curse_regret',
  name: 'Regret',
  description: 'Unplayable. At end of turn, lose 1 HP for each card in hand.',
  type: 'curse',
  rarity: 'special',
  cost: -1,
  target: 'none',
  effects: [],
  keywords: ['unplayable'],
});

addCard({
  id: 'curse_pain',
  name: 'Pain',
  description: 'Unplayable. Lose 1 HP when any card is played.',
  type: 'curse',
  rarity: 'special',
  cost: -1,
  target: 'none',
  effects: [],
  keywords: ['unplayable'],
});

// ============================================
// PLACEHOLDER CARDS
// ============================================

addCard({
  id: 'quick_slash',
  name: 'Quick Slash',
  description: 'Deal 3 damage. Draw 1 card.',
  type: 'attack',
  rarity: 'common',
  cost: 1,
  target: 'enemy',
  effects: [
    { type: 'damage', value: 3 },
    { type: 'draw', value: 1 },
  ],
  effectsUpgraded: [
    { type: 'damage', value: 5 },
    { type: 'draw', value: 1 },
  ],
});

// Export helper functions
export function getCard(id: string): CardDefinition | undefined {
  return CardDatabase.get(id);
}

export function getAllCards(): CardDefinition[] {
  return Array.from(CardDatabase.values());
}

export function getCardsByRarity(rarity: CardDefinition['rarity']): CardDefinition[] {
  return Array.from(CardDatabase.values()).filter((c) => c.rarity === rarity);
}

export function getCardsByType(type: CardDefinition['type']): CardDefinition[] {
  return Array.from(CardDatabase.values()).filter((c) => c.type === type);
}

export function getPlayableCards(): CardDefinition[] {
  return Array.from(CardDatabase.values()).filter(
    (c) => !c.keywords?.includes('unplayable')
  );
}
