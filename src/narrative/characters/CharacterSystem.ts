import { EventBus, GameEvents } from '../../core/events/EventBus';
import { InkRunner } from '../dialogue/InkRunner';
import { LLMClient } from '../../llm/client/LLMClient';

export interface CharacterDefinition {
  id: string;
  name: string;
  title?: string;
  sprite: string;
  dialogueFile?: string; // Ink story file
  personality: string[];  // Traits for LLM generation
  topics: string[];       // Things they can talk about
  unlockCondition?: string; // When they become available
}

export interface CharacterRelationship {
  characterId: string;
  affinity: number;       // -100 to 100
  conversationCount: number;
  unlockedTopics: Set<string>;
  memories: CharacterMemory[];
  lastInteraction: number; // Run number
}

export interface CharacterMemory {
  runNumber: number;
  event: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
}

/**
 * Manages NPC relationships and Hades-style hub dialogue
 */
export class CharacterSystem {
  private characters: Map<string, CharacterDefinition> = new Map();
  private relationships: Map<string, CharacterRelationship> = new Map();
  private inkRunner: InkRunner;
  private events: EventBus;
  private llm: LLMClient;
  private currentRunNumber: number = 0;

  constructor(events: EventBus, llm: LLMClient) {
    this.events = events;
    this.llm = llm;
    this.inkRunner = new InkRunner();

    this.initializeCharacters();
  }

  private initializeCharacters(): void {
    // Define hub NPCs (Hades House of Hades style)
    this.addCharacter({
      id: 'keeper',
      name: 'The Keeper',
      title: 'Warden of the Hub',
      sprite: 'keeper',
      personality: ['mysterious', 'cryptic', 'knowing', 'ancient'],
      topics: ['spire_lore', 'climbing_tips', 'past_climbers', 'the_summit'],
    });

    this.addCharacter({
      id: 'smith',
      name: 'Forge',
      title: 'The Weaponsmith',
      sprite: 'smith',
      personality: ['gruff', 'practical', 'skilled', 'honest'],
      topics: ['weapons', 'upgrades', 'combat_advice', 'old_wars'],
    });

    this.addCharacter({
      id: 'scholar',
      name: 'Sylvia',
      title: 'Keeper of Knowledge',
      sprite: 'scholar',
      personality: ['curious', 'bookish', 'nervous', 'helpful'],
      topics: ['relics', 'enemies', 'history', 'magic'],
    });

    this.addCharacter({
      id: 'trader',
      name: 'Vex',
      title: 'The Opportunist',
      sprite: 'trader',
      personality: ['sly', 'charming', 'greedy', 'worldly'],
      topics: ['deals', 'rumors', 'rare_items', 'shortcuts'],
    });

    this.addCharacter({
      id: 'ghost',
      name: 'Echo',
      title: 'Lost Climber',
      sprite: 'ghost',
      personality: ['melancholic', 'regretful', 'wise', 'fading'],
      topics: ['death', 'past_runs', 'warnings', 'hope'],
      unlockCondition: 'died_once',
    });
  }

  addCharacter(def: CharacterDefinition): void {
    this.characters.set(def.id, def);

    // Initialize relationship if not exists
    if (!this.relationships.has(def.id)) {
      this.relationships.set(def.id, {
        characterId: def.id,
        affinity: 0,
        conversationCount: 0,
        unlockedTopics: new Set(def.topics.slice(0, 2)), // Start with 2 topics
        memories: [],
        lastInteraction: 0,
      });
    }
  }

  /**
   * Get character definition
   */
  getCharacter(id: string): CharacterDefinition | undefined {
    return this.characters.get(id);
  }

  /**
   * Get relationship with character
   */
  getRelationship(characterId: string): CharacterRelationship | undefined {
    return this.relationships.get(characterId);
  }

  /**
   * Get available characters (based on unlock conditions)
   */
  getAvailableCharacters(playerFlags: Map<string, number>): CharacterDefinition[] {
    return Array.from(this.characters.values()).filter((char) => {
      if (!char.unlockCondition) return true;

      // Parse unlock condition
      const flagValue = playerFlags.get(char.unlockCondition) || 0;
      return flagValue > 0;
    });
  }

  /**
   * Start a conversation with a character
   */
  async startConversation(
    characterId: string,
    playerTags: string[],
    seed: string
  ): Promise<string> {
    const character = this.characters.get(characterId);
    const relationship = this.relationships.get(characterId);

    if (!character || !relationship) {
      return "They don't seem interested in talking.";
    }

    relationship.conversationCount++;
    relationship.lastInteraction = this.currentRunNumber;

    // Generate contextual greeting
    const greeting = await this.generateGreeting(character, relationship, playerTags, seed);

    return greeting;
  }

  /**
   * Generate a contextual greeting based on relationship state
   */
  private async generateGreeting(
    character: CharacterDefinition,
    relationship: CharacterRelationship,
    playerTags: string[],
    seed: string
  ): Promise<string> {
    // Check for recent memories to reference
    const recentMemory = relationship.memories
      .filter((m) => m.runNumber >= this.currentRunNumber - 3)
      .sort((a, b) => b.runNumber - a.runNumber)[0];

    // Use LLM for dynamic greeting
    const response = await this.llm.generateDialogue(
      character.id,
      this.getGreetingTopic(relationship, recentMemory),
      playerTags,
      relationship.affinity,
      seed
    );

    return response;
  }

  private getGreetingTopic(
    relationship: CharacterRelationship,
    recentMemory?: CharacterMemory
  ): string {
    if (relationship.conversationCount === 1) {
      return 'first_meeting';
    }

    if (recentMemory) {
      if (recentMemory.sentiment === 'negative') {
        return 'death_acknowledgment';
      } else if (recentMemory.sentiment === 'positive') {
        return 'victory_congratulations';
      }
    }

    if (relationship.affinity > 30) {
      return 'friendly_greeting';
    } else if (relationship.affinity < -30) {
      return 'cold_greeting';
    }

    return 'casual_greeting';
  }

  /**
   * Get available dialogue topics for a character
   */
  getAvailableTopics(characterId: string): string[] {
    const relationship = this.relationships.get(characterId);
    if (!relationship) return [];

    return Array.from(relationship.unlockedTopics);
  }

  /**
   * Discuss a topic with a character
   */
  async discussTopic(
    characterId: string,
    topic: string,
    playerTags: string[],
    seed: string
  ): Promise<{ response: string; affinityChange: number; newTopicUnlocked?: string }> {
    const character = this.characters.get(characterId);
    const relationship = this.relationships.get(characterId);

    if (!character || !relationship) {
      return { response: "...", affinityChange: 0 };
    }

    // Generate topic response
    const response = await this.llm.generateDialogue(
      characterId,
      topic,
      playerTags,
      relationship.affinity,
      seed
    );

    // Calculate affinity change based on topic relevance
    let affinityChange = 1; // Base gain for talking
    if (character.topics.includes(topic)) {
      affinityChange += 2; // Bonus for relevant topic
    }

    relationship.affinity = Math.max(-100, Math.min(100, relationship.affinity + affinityChange));

    // Check for new topic unlocks
    let newTopicUnlocked: string | undefined;
    if (relationship.affinity >= 20 && relationship.unlockedTopics.size < character.topics.length) {
      const locked = character.topics.filter((t) => !relationship.unlockedTopics.has(t));
      if (locked.length > 0) {
        const newTopic = locked[Math.floor(Math.random() * locked.length)];
        relationship.unlockedTopics.add(newTopic);
        newTopicUnlocked = newTopic;
      }
    }

    return { response, affinityChange, newTopicUnlocked };
  }

  /**
   * Record a memory for a character (they remember what happened)
   */
  recordMemory(
    characterId: string,
    event: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    text: string
  ): void {
    const relationship = this.relationships.get(characterId);
    if (!relationship) return;

    relationship.memories.push({
      runNumber: this.currentRunNumber,
      event,
      sentiment,
      text,
    });

    // Keep only recent memories (last 10)
    if (relationship.memories.length > 10) {
      relationship.memories = relationship.memories.slice(-10);
    }

    // Affect affinity based on event
    if (sentiment === 'positive') {
      relationship.affinity = Math.min(100, relationship.affinity + 5);
    } else if (sentiment === 'negative') {
      relationship.affinity = Math.max(-100, relationship.affinity - 3);
    }
  }

  /**
   * Record memories for all characters based on run outcome
   */
  recordRunOutcome(won: boolean, floor: number, killedBy?: string): void {
    this.currentRunNumber++;

    const event = won ? 'victory' : 'death';
    const sentiment = won ? 'positive' : 'negative';

    // Each character remembers in their own way
    for (const characterId of this.characters.keys()) {
      let text: string;

      if (won) {
        text = `Climber reached floor ${floor} and emerged victorious`;
      } else {
        text = killedBy
          ? `Climber fell to ${killedBy} on floor ${floor}`
          : `Climber perished on floor ${floor}`;
      }

      this.recordMemory(characterId, event, sentiment, text);
    }
  }

  /**
   * Serialize character system state
   */
  serialize(): object {
    const relationships: Record<string, any> = {};

    for (const [id, rel] of this.relationships) {
      relationships[id] = {
        ...rel,
        unlockedTopics: Array.from(rel.unlockedTopics),
      };
    }

    return {
      currentRunNumber: this.currentRunNumber,
      relationships,
    };
  }

  /**
   * Deserialize character system state
   */
  deserialize(data: any): void {
    this.currentRunNumber = data.currentRunNumber || 0;

    if (data.relationships) {
      for (const [id, rel] of Object.entries(data.relationships as Record<string, any>)) {
        this.relationships.set(id, {
          ...rel,
          unlockedTopics: new Set(rel.unlockedTopics),
        });
      }
    }
  }

  /**
   * Get character portrait based on affinity
   */
  getCharacterMood(characterId: string): 'happy' | 'neutral' | 'sad' | 'angry' {
    const relationship = this.relationships.get(characterId);
    if (!relationship) return 'neutral';

    if (relationship.affinity > 50) return 'happy';
    if (relationship.affinity > 0) return 'neutral';
    if (relationship.affinity > -50) return 'sad';
    return 'angry';
  }
}
