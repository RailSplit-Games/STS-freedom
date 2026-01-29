import { World, EntityId } from '../../core/ecs/ECS';

/**
 * Enemy definition
 */
export interface EnemyDefinition {
  id: string;
  name: string;
  health: [number, number]; // [min, max] - varies by ascension
  pattern: string[]; // Action pattern
  aiType: 'sequential' | 'random' | 'conditional';
  sprite: string;
  isElite?: boolean;
  isBoss?: boolean;
  description?: string; // LLM can generate flavor
}

export const EnemyDatabase: Map<string, EnemyDefinition> = new Map();

function addEnemy(enemy: EnemyDefinition) {
  EnemyDatabase.set(enemy.id, enemy);
}

// ============================================
// ACT 1 MONSTERS
// ============================================

addEnemy({
  id: 'jaw_worm',
  name: 'Jaw Worm',
  health: [40, 44],
  pattern: ['attack:11', 'defend:6', 'buff:3'],
  aiType: 'random',
  sprite: 'jaw_worm',
  description: 'A common cave-dwelling pest with powerful jaws.',
});

addEnemy({
  id: 'cultist',
  name: 'Cultist',
  health: [48, 54],
  pattern: ['buff:3', 'attack:6'],
  aiType: 'sequential',
  sprite: 'cultist',
  description: 'A mad worshipper who grows stronger each turn.',
});

addEnemy({
  id: 'louse_red',
  name: 'Red Louse',
  health: [10, 15],
  pattern: ['attack:6', 'attack:6', 'buff:3'],
  aiType: 'sequential',
  sprite: 'louse_red',
  description: 'A blood-sucking parasite with a hard shell.',
});

addEnemy({
  id: 'louse_green',
  name: 'Green Louse',
  health: [11, 17],
  pattern: ['attack:6', 'debuff:2', 'attack:6'],
  aiType: 'sequential',
  sprite: 'louse_green',
  description: 'A toxin-spewing variant of the common louse.',
});

addEnemy({
  id: 'acid_slime_m',
  name: 'Acid Slime (M)',
  health: [28, 32],
  pattern: ['attack:7', 'debuff:1', 'attack:7'],
  aiType: 'sequential',
  sprite: 'slime_acid_m',
  description: 'A medium-sized blob of corrosive goo.',
});

addEnemy({
  id: 'spike_slime_m',
  name: 'Spike Slime (M)',
  health: [28, 32],
  pattern: ['attack:8', 'defend:5', 'attack:8'],
  aiType: 'sequential',
  sprite: 'slime_spike_m',
  description: 'A medium-sized slime covered in sharp protrusions.',
});

addEnemy({
  id: 'fungi_beast',
  name: 'Fungi Beast',
  health: [22, 28],
  pattern: ['buff:3', 'attack:6', 'attack:6'],
  aiType: 'sequential',
  sprite: 'fungi_beast',
  description: 'A mushroom creature that releases spores.',
});

addEnemy({
  id: 'looter',
  name: 'Looter',
  health: [44, 48],
  pattern: ['attack:10', 'attack:10', 'defend:6', 'escape'],
  aiType: 'sequential',
  sprite: 'looter',
  description: 'A thief who steals gold and flees.',
});

// ============================================
// ACT 1 ELITES
// ============================================

addEnemy({
  id: 'gremlin_nob',
  name: 'Gremlin Nob',
  health: [82, 86],
  pattern: ['buff:2', 'attack:14', 'attack:16', 'attack:16'],
  aiType: 'sequential',
  sprite: 'gremlin_nob',
  isElite: true,
  description: 'A massive gremlin warlord. Enrages when you use Skills.',
});

addEnemy({
  id: 'lagavulin',
  name: 'Lagavulin',
  health: [109, 111],
  pattern: ['sleep', 'sleep', 'attack:18', 'debuff:2', 'attack:18'],
  aiType: 'sequential',
  sprite: 'lagavulin',
  isElite: true,
  description: 'A slumbering construct. Wakes when provoked or after time passes.',
});

addEnemy({
  id: 'sentries',
  name: 'Sentry',
  health: [38, 42],
  pattern: ['attack:9', 'defend:9', 'attack:9'],
  aiType: 'sequential',
  sprite: 'sentry',
  isElite: true,
  description: 'Ancient automatons that attack in sync.',
});

// ============================================
// ACT 1 BOSS
// ============================================

addEnemy({
  id: 'slime_boss',
  name: 'Slime Boss',
  health: [140, 140],
  pattern: ['attack:35', 'attack:35', 'split'],
  aiType: 'sequential',
  sprite: 'slime_boss',
  isBoss: true,
  description: 'A gargantuan slime. Splits into smaller slimes when damaged.',
});

addEnemy({
  id: 'the_guardian',
  name: 'The Guardian',
  health: [240, 240],
  pattern: ['attack:32', 'defend:20', 'attack:32', 'mode_shift'],
  aiType: 'sequential',
  sprite: 'the_guardian',
  isBoss: true,
  description: 'An ancient guardian. Alternates between offensive and defensive modes.',
});

addEnemy({
  id: 'hexaghost',
  name: 'Hexaghost',
  health: [250, 250],
  pattern: ['activate', 'attack:6x6', 'attack:2x6', 'inferno'],
  aiType: 'sequential',
  sprite: 'hexaghost',
  isBoss: true,
  description: 'A spectral entity with six ghostly flames.',
});

// ============================================
// ACT 2 MONSTERS
// ============================================

addEnemy({
  id: 'chosen',
  name: 'Chosen',
  health: [95, 99],
  pattern: ['debuff:3', 'attack:12', 'attack:12', 'hex'],
  aiType: 'sequential',
  sprite: 'chosen',
  description: 'A cultist blessed with dark power.',
});

addEnemy({
  id: 'byrd',
  name: 'Byrd',
  health: [25, 31],
  pattern: ['caw', 'attack:12', 'attack:1x5'],
  aiType: 'sequential',
  sprite: 'byrd',
  description: 'An aggressive bird. Takes reduced damage while flying.',
});

addEnemy({
  id: 'snake_plant',
  name: 'Snake Plant',
  health: [75, 79],
  pattern: ['debuff:2', 'attack:7x3', 'defend:12'],
  aiType: 'sequential',
  sprite: 'snake_plant',
  description: 'A carnivorous plant with lightning reflexes.',
});

addEnemy({
  id: 'snecko',
  name: 'Snecko',
  health: [114, 120],
  pattern: ['confusion', 'attack:15', 'attack:8x3'],
  aiType: 'sequential',
  sprite: 'snecko',
  description: 'A mystifying reptile that muddles the mind.',
});

// ============================================
// ACT 2 ELITES
// ============================================

addEnemy({
  id: 'gremlin_leader',
  name: 'Gremlin Leader',
  health: [140, 148],
  pattern: ['summon', 'attack:6x3', 'buff:5'],
  aiType: 'sequential',
  sprite: 'gremlin_leader',
  isElite: true,
  description: 'Commands a horde of gremlins.',
});

addEnemy({
  id: 'book_of_stabbing',
  name: 'Book of Stabbing',
  health: [160, 168],
  pattern: ['attack:21', 'attack:24', 'multi_stab'],
  aiType: 'sequential',
  sprite: 'book_of_stabbing',
  isElite: true,
  description: 'A sentient tome filled with blades.',
});

addEnemy({
  id: 'slavers',
  name: 'Slaver',
  health: [46, 50],
  pattern: ['attack:12', 'debuff:1', 'attack:12'],
  aiType: 'sequential',
  sprite: 'slaver',
  isElite: true,
  description: 'Cruel traffickers that fight in pairs.',
});

// ============================================
// ACT 2 BOSS
// ============================================

addEnemy({
  id: 'bronze_automaton',
  name: 'Bronze Automaton',
  health: [300, 300],
  pattern: ['spawn_orbs', 'attack:50', 'hyper_beam'],
  aiType: 'sequential',
  sprite: 'bronze_automaton',
  isBoss: true,
  description: 'An ancient machine of war. Spawns bronze orbs.',
});

addEnemy({
  id: 'the_champ',
  name: 'The Champ',
  health: [420, 420],
  pattern: ['attack:18', 'taunt', 'attack:22', 'execute'],
  aiType: 'conditional',
  sprite: 'the_champ',
  isBoss: true,
  description: 'An undefeated gladiator. Enrages at half health.',
});

addEnemy({
  id: 'collector',
  name: 'The Collector',
  health: [282, 282],
  pattern: ['summon', 'attack:15', 'buff:3', 'mega_debuff'],
  aiType: 'sequential',
  sprite: 'collector',
  isBoss: true,
  description: 'Collects minions and grows stronger.',
});

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getEnemy(id: string): EnemyDefinition | undefined {
  return EnemyDatabase.get(id);
}

export function getEnemiesByType(
  filter: 'normal' | 'elite' | 'boss'
): EnemyDefinition[] {
  return Array.from(EnemyDatabase.values()).filter((e) => {
    if (filter === 'elite') return e.isElite;
    if (filter === 'boss') return e.isBoss;
    return !e.isElite && !e.isBoss;
  });
}

/**
 * Create an enemy entity in the world
 */
export function createEnemyEntity(
  world: World,
  enemyId: string,
  slot: number
): EntityId | null {
  const def = getEnemy(enemyId);
  if (!def) {
    console.warn(`Enemy not found: ${enemyId}`);
    return null;
  }

  const entityId = world.createEntity();
  world.addTag(entityId, 'enemy');
  if (def.isElite) world.addTag(entityId, 'elite');
  if (def.isBoss) world.addTag(entityId, 'boss');

  // Random health in range
  const health = def.health[0] + Math.floor(Math.random() * (def.health[1] - def.health[0] + 1));

  world.addComponent(entityId, {
    type: 'health',
    current: health,
    max: health,
  });

  world.addComponent(entityId, { type: 'block', amount: 0 });

  world.addComponent(entityId, {
    type: 'statusEffects',
    effects: new Map(),
  });

  world.addComponent(entityId, {
    type: 'intent',
    action: 'unknown',
    value: 0,
  });

  world.addComponent(entityId, {
    type: 'enemyAI',
    pattern: [...def.pattern],
    patternIndex: 0,
    aiType: def.aiType,
  });

  world.addComponent(entityId, {
    type: 'name',
    name: def.name,
  });

  world.addComponent(entityId, {
    type: 'position',
    x: 600 + slot * 150,
    y: 400,
    slot,
  });

  world.addComponent(entityId, {
    type: 'render',
    sprite: def.sprite,
    scale: 1,
  });

  return entityId;
}

// Encounter definitions for map generation
export interface EncounterDefinition {
  id: string;
  enemies: string[];
  weight: number; // Higher = more common
  minFloor?: number;
  maxFloor?: number;
  act: number;
}

export const EncounterPool: EncounterDefinition[] = [
  // Act 1 - Easy
  { id: 'single_cultist', enemies: ['cultist'], weight: 10, act: 1, maxFloor: 5 },
  { id: 'jaw_worm', enemies: ['jaw_worm'], weight: 10, act: 1, maxFloor: 5 },
  { id: 'two_lice', enemies: ['louse_red', 'louse_green'], weight: 8, act: 1 },

  // Act 1 - Medium
  { id: 'slimes', enemies: ['acid_slime_m', 'spike_slime_m'], weight: 6, act: 1, minFloor: 3 },
  { id: 'fungi_beasts', enemies: ['fungi_beast', 'fungi_beast'], weight: 5, act: 1, minFloor: 4 },
  { id: 'looter', enemies: ['looter'], weight: 4, act: 1, minFloor: 5 },

  // Act 1 - Hard
  { id: 'jaw_worms', enemies: ['jaw_worm', 'jaw_worm'], weight: 3, act: 1, minFloor: 7 },

  // Act 2
  { id: 'chosen', enemies: ['chosen'], weight: 8, act: 2 },
  { id: 'byrds', enemies: ['byrd', 'byrd', 'byrd'], weight: 6, act: 2 },
  { id: 'snake_plant', enemies: ['snake_plant'], weight: 7, act: 2 },
  { id: 'snecko', enemies: ['snecko'], weight: 5, act: 2, minFloor: 5 },
];

export const ElitePool: EncounterDefinition[] = [
  { id: 'gremlin_nob', enemies: ['gremlin_nob'], weight: 10, act: 1 },
  { id: 'lagavulin', enemies: ['lagavulin'], weight: 10, act: 1 },
  { id: 'sentries', enemies: ['sentries', 'sentries', 'sentries'], weight: 8, act: 1 },

  { id: 'gremlin_leader', enemies: ['gremlin_leader'], weight: 10, act: 2 },
  { id: 'book_of_stabbing', enemies: ['book_of_stabbing'], weight: 8, act: 2 },
  { id: 'slavers', enemies: ['slavers', 'slavers'], weight: 10, act: 2 },
];

export const BossPool: EncounterDefinition[] = [
  { id: 'slime_boss', enemies: ['slime_boss'], weight: 10, act: 1 },
  { id: 'the_guardian', enemies: ['the_guardian'], weight: 10, act: 1 },
  { id: 'hexaghost', enemies: ['hexaghost'], weight: 10, act: 1 },

  { id: 'bronze_automaton', enemies: ['bronze_automaton'], weight: 10, act: 2 },
  { id: 'the_champ', enemies: ['the_champ'], weight: 10, act: 2 },
  { id: 'collector', enemies: ['collector'], weight: 10, act: 2 },
];
