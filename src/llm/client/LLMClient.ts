import { LLMCache } from '../cache/LLMCache';
import { FallbackContent } from '../fallback/FallbackContent';
import {
  generateItemDescription,
  generateEventNarrative,
  generateNPCDialogue,
  generateCombatBark,
  generateQuestDescription,
} from '../prompts/PromptTemplates';

export type LLMProvider = 'openai' | 'anthropic' | 'local' | 'none';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  fromCache: boolean;
  provider: LLMProvider;
}

/**
 * Abstract LLM client with provider switching, caching, and fallbacks
 */
export class LLMClient {
  private config: LLMConfig;
  private cache: LLMCache;
  private fallback: FallbackContent;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      provider: 'none', // Default to no LLM - uses fallback content
      maxTokens: 150,
      temperature: 0.7,
      ...config,
    };

    this.cache = new LLMCache();
    this.fallback = new FallbackContent();
  }

  /**
   * Configure the LLM provider
   */
  configure(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate content with caching and fallback
   */
  async generate(
    prompt: string,
    cacheKey: string,
    fallbackType: string
  ): Promise<LLMResponse> {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { content: cached, fromCache: true, provider: this.config.provider };
    }

    // If no provider configured, use fallback
    if (this.config.provider === 'none') {
      const content = this.fallback.get(fallbackType);
      this.cache.set(cacheKey, content);
      return { content, fromCache: false, provider: 'none' };
    }

    try {
      const content = await this.callProvider(prompt);
      this.cache.set(cacheKey, content);
      return { content, fromCache: false, provider: this.config.provider };
    } catch (error) {
      console.warn('LLM call failed, using fallback:', error);
      const content = this.fallback.get(fallbackType);
      return { content, fromCache: false, provider: 'none' };
    }
  }

  /**
   * Call the configured LLM provider
   */
  private async callProvider(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'local':
        return this.callLocal(prompt);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callLocal(prompt: string): Promise<string> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama3',
        prompt,
        stream: false,
        options: {
          num_predict: this.config.maxTokens,
          temperature: this.config.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  // ============================================
  // HIGH-LEVEL CONTENT GENERATION METHODS
  // ============================================

  /**
   * Generate a unique item name and description
   */
  async generateItem(
    baseItem: string,
    affixes: string[],
    rarity: string,
    seed: string
  ): Promise<{ name: string; description: string; flavor: string }> {
    const cacheKey = `item:${baseItem}:${affixes.join(',')}:${seed}`;
    const prompt = generateItemDescription(baseItem, affixes, rarity);

    const response = await this.generate(prompt, cacheKey, 'item');

    // Parse response - expect JSON or structured text
    try {
      return this.parseItemResponse(response.content);
    } catch {
      return this.fallback.getItem(baseItem, affixes);
    }
  }

  private parseItemResponse(content: string): { name: string; description: string; flavor: string } {
    // Try JSON parse first
    try {
      return JSON.parse(content);
    } catch {
      // Parse structured text format
      const lines = content.split('\n').filter(l => l.trim());
      return {
        name: lines[0]?.replace(/^Name:\s*/i, '') || 'Mysterious Item',
        description: lines[1]?.replace(/^Description:\s*/i, '') || 'A strange artifact.',
        flavor: lines[2]?.replace(/^Flavor:\s*/i, '') || '',
      };
    }
  }

  /**
   * Generate event narrative text
   */
  async generateEvent(
    eventType: string,
    context: { location: string; playerTags: string[]; flags: Record<string, number> },
    seed: string
  ): Promise<{ title: string; description: string; choices: Array<{ text: string; tags?: string[] }> }> {
    const cacheKey = `event:${eventType}:${seed}`;
    const prompt = generateEventNarrative(eventType, context);

    const response = await this.generate(prompt, cacheKey, 'event');

    try {
      return this.parseEventResponse(response.content);
    } catch {
      return this.fallback.getEvent(eventType);
    }
  }

  private parseEventResponse(content: string): { title: string; description: string; choices: Array<{ text: string; tags?: string[] }> } {
    try {
      return JSON.parse(content);
    } catch {
      return {
        title: 'Strange Encounter',
        description: content,
        choices: [
          { text: 'Continue' },
          { text: 'Leave' },
        ],
      };
    }
  }

  /**
   * Generate NPC dialogue response
   */
  async generateDialogue(
    npcId: string,
    topic: string,
    playerTags: string[],
    relationshipLevel: number,
    seed: string
  ): Promise<string> {
    const cacheKey = `dialogue:${npcId}:${topic}:${relationshipLevel}:${seed}`;
    const prompt = generateNPCDialogue(npcId, topic, playerTags, relationshipLevel);

    const response = await this.generate(prompt, cacheKey, 'dialogue');
    return response.content;
  }

  /**
   * Generate combat bark (enemy/player exclamation)
   */
  async generateBark(
    characterId: string,
    situation: 'attack' | 'hurt' | 'death' | 'victory' | 'taunt',
    context: { health: number; turn: number },
    seed: string
  ): Promise<string> {
    const cacheKey = `bark:${characterId}:${situation}:${seed}`;
    const prompt = generateCombatBark(characterId, situation, context);

    const response = await this.generate(prompt, cacheKey, 'bark');
    return response.content;
  }

  /**
   * Generate procedural quest description
   */
  async generateQuest(
    questType: string,
    target: string,
    location: string,
    reward: string,
    seed: string
  ): Promise<{ title: string; description: string; objectiveText: string }> {
    const cacheKey = `quest:${questType}:${target}:${seed}`;
    const prompt = generateQuestDescription(questType, target, location, reward);

    const response = await this.generate(prompt, cacheKey, 'quest');

    try {
      return JSON.parse(response.content);
    } catch {
      return this.fallback.getQuest(questType, target);
    }
  }

  /**
   * Preload content for anticipated needs (batch generation)
   */
  async preloadContent(
    type: 'items' | 'events' | 'dialogue',
    count: number,
    context: object,
    seed: string
  ): Promise<void> {
    // Generate content in background for future use
    // This reduces perceived latency during gameplay

    const tasks: Promise<any>[] = [];

    for (let i = 0; i < count; i++) {
      const itemSeed = `${seed}-preload-${i}`;
      switch (type) {
        case 'items':
          tasks.push(
            this.generateItem('weapon', ['sharp', 'ancient'], 'rare', itemSeed)
          );
          break;
        case 'events':
          tasks.push(
            this.generateEvent('encounter', {
              location: 'dungeon',
              playerTags: [],
              flags: {},
            }, itemSeed)
          );
          break;
      }
    }

    // Run in background, don't await
    Promise.all(tasks).catch(console.warn);
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { hits: number; misses: number; size: number } {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
