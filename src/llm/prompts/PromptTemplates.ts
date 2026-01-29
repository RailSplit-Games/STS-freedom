/**
 * Prompt templates for LLM content generation
 * Designed to produce consistent, game-appropriate content
 */

export function generateItemDescription(
  baseItem: string,
  affixes: string[],
  rarity: string
): string {
  return `You are a creative writer for a dark fantasy roguelike game. Generate a unique item.

Base item type: ${baseItem}
Magical properties: ${affixes.join(', ')}
Rarity: ${rarity}

Generate a JSON response with:
- name: A creative, evocative name (2-4 words)
- description: Mechanical description of what it does (1 sentence)
- flavor: Atmospheric lore text (1-2 sentences, optional)

Style guide:
- Names should be memorable and slightly ominous
- Descriptions should be clear about effects
- Flavor text should hint at the item's history or origin
- Avoid clichés like "ancient evil" or "dark power"

Example output:
{
  "name": "Widow's Fang",
  "description": "Attacks apply 2 Poison. Heals 1 HP per Poisoned enemy.",
  "flavor": "The blade remembers every life it has claimed."
}

Generate the item:`;
}

export function generateEventNarrative(
  eventType: string,
  context: { location: string; playerTags: string[]; flags: Record<string, number> }
): string {
  const tagList = context.playerTags.length > 0
    ? `Player has the following traits: ${context.playerTags.join(', ')}`
    : 'Player has no special traits';

  return `You are writing an interactive event for a roguelike deckbuilder game.

Event type: ${eventType}
Location: ${context.location}
${tagList}

Generate a JSON response with:
- title: Event title (2-4 words)
- description: The situation the player encounters (2-4 sentences)
- choices: Array of 2-4 choices, each with:
  - text: What the player does (short action phrase)
  - tags: Optional array of player tags that unlock this choice (like [WARRIOR] or [NOBLE])

Guidelines:
- Create meaningful choices with different risk/reward profiles
- Include at least one safe option and one risky option
- Tag-locked choices should feel special but not mandatory
- Keep descriptions atmospheric but concise
- Avoid obvious good/evil dichotomies

Example output:
{
  "title": "The Wounded Merchant",
  "description": "A merchant lies bleeding by the roadside, their cart overturned. Goods are scattered across the path. Bandits fled at your approach.",
  "choices": [
    {"text": "Help bandage their wounds", "tags": []},
    {"text": "Search the scattered goods", "tags": []},
    {"text": "Use field medicine from your training", "tags": ["SOLDIER"]},
    {"text": "Leave them to their fate", "tags": []}
  ]
}

Generate the event:`;
}

export function generateNPCDialogue(
  npcId: string,
  topic: string,
  playerTags: string[],
  relationshipLevel: number
): string {
  const relationship = relationshipLevel > 5 ? 'friendly' :
    relationshipLevel < -5 ? 'hostile' : 'neutral';

  return `You are writing dialogue for an NPC in a roguelike deckbuilder game.

NPC: ${npcId}
Topic: ${topic}
Relationship with player: ${relationship} (${relationshipLevel})
Player traits: ${playerTags.join(', ') || 'none'}

Write a single dialogue response (1-3 sentences) that:
- Reflects the NPC's personality and relationship with the player
- Addresses the topic naturally
- May reference player traits if relevant
- Avoids breaking the fourth wall
- Uses appropriate tone (formal/casual based on relationship)

Write only the dialogue, no formatting:`;
}

export function generateCombatBark(
  characterId: string,
  situation: 'attack' | 'hurt' | 'death' | 'victory' | 'taunt',
  context: { health: number; turn: number }
): string {
  const healthState = context.health < 30 ? 'badly wounded' :
    context.health < 60 ? 'hurt' : 'healthy';

  return `You are writing a combat exclamation for a roguelike game character.

Character: ${characterId}
Situation: ${situation}
Health state: ${healthState}
Turn: ${context.turn}

Write a single short exclamation (3-10 words) that:
- Fits the ${situation} situation
- Reflects the character's personality
- Is dramatic but not over-the-top
- Avoids modern slang or anachronisms

Write only the exclamation, no quotes or formatting:`;
}

export function generateQuestDescription(
  questType: string,
  target: string,
  location: string,
  reward: string
): string {
  return `You are writing a quest description for a roguelike deckbuilder game.

Quest type: ${questType}
Target: ${target}
Location: ${location}
Reward type: ${reward}

Generate a JSON response with:
- title: Quest name (2-4 words, evocative)
- description: Quest background and motivation (2-3 sentences)
- objectiveText: Clear statement of what to do (1 sentence)

Guidelines:
- Make the quest feel personal or urgent
- Hint at consequences or stakes
- Keep descriptions concise but atmospheric
- Objective should be clearly actionable

Example output:
{
  "title": "The Silent Bells",
  "description": "The temple bells have not rung for three days. The priests speak of shadows in the belfry, and the faithful grow fearful. Whatever lurks above must be dealt with before the silence spreads.",
  "objectiveText": "Investigate the temple belfry and eliminate any threats."
}

Generate the quest:`;
}

export function generateCardFlavorText(
  cardName: string,
  cardType: string,
  cardEffect: string
): string {
  return `You are writing flavor text for a card in a roguelike deckbuilder game.

Card name: ${cardName}
Card type: ${cardType}
Card effect: ${cardEffect}

Write a single line of atmospheric flavor text (5-15 words) that:
- Relates to the card's name or effect
- Adds lore or personality
- Is evocative without being purple prose
- Does NOT explain the mechanics

Write only the flavor text, no quotes:`;
}

export function generateRelicDescription(
  relicName: string,
  relicEffect: string,
  rarity: string
): string {
  return `You are writing a description for a relic in a roguelike deckbuilder game.

Relic name: ${relicName}
Mechanical effect: ${relicEffect}
Rarity: ${rarity}

Write a description (2-3 sentences) that:
- Explains the mechanical effect clearly
- Adds a hint of lore or history
- Matches the rarity level in tone (common = mundane, rare = legendary)

Write only the description:`;
}

export function generateCharacterBackground(
  characterClass: string,
  startingCards: string[],
  startingRelic: string
): string {
  return `You are writing a character background for a roguelike deckbuilder game.

Class: ${characterClass}
Starting abilities: ${startingCards.join(', ')}
Starting relic: ${startingRelic}

Write a character background (3-4 sentences) that:
- Explains who this character is
- Hints at their motivation for climbing the Spire
- References their abilities thematically
- Sets up potential narrative hooks

Write only the background:`;
}

export function generateRunSummary(
  runStats: {
    character: string;
    floor: number;
    won: boolean;
    killedBy?: string;
    cardsPlayed: number;
    damageDealt: number;
    goldEarned: number;
  }
): string {
  const outcome = runStats.won
    ? 'victorious ascent'
    : `death on floor ${runStats.floor}${runStats.killedBy ? ` at the hands of ${runStats.killedBy}` : ''}`;

  return `You are writing a brief narrative summary of a roguelike run.

Character: ${runStats.character}
Outcome: ${outcome}
Stats: ${runStats.cardsPlayed} cards played, ${runStats.damageDealt} damage dealt, ${runStats.goldEarned} gold earned

Write a dramatic 2-3 sentence summary of this run that:
- Captures the journey's arc
- References key moments implicitly
- Has appropriate tone (triumphant or tragic)

Write only the summary:`;
}
