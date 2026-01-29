import { get, set, del, keys } from 'idb-keyval';
import type { StoreApi } from 'zustand/vanilla';
import type { GameStore, MetaState } from '../../core/store';
import type { World } from '../../core/ecs/ECS';
import type { SeededRNG } from '../../core/rng/SeededRNG';
import type { CharacterSystem } from '../../narrative/characters/CharacterSystem';
import type { FlagSystem } from '../../narrative/flags/FlagSystem';

// Save data version for migrations
const SAVE_VERSION = 1;

export interface RunSaveData {
  version: number;
  timestamp: number;
  seed: string;
  rngState: { seed: string; state: [number, number] };
  gameState: {
    phase: string;
    player: object;
    run: object;
    deck: string[];
    hand: string[];
    drawPile: string[];
    discardPile: string[];
    exhaustPile: string[];
    relics: string[];
    flags: [string, number][];
  };
  mapState: object | null;
  combatState: object | null;
  narrativeState: object;
  flagState: object;
}

export interface MetaSaveData {
  version: number;
  timestamp: number;
  meta: MetaState;
  characterRelationships: object;
  settings: object;
  statistics: RunStatistics;
}

export interface RunStatistics {
  totalRuns: number;
  totalWins: number;
  totalDeaths: number;
  highestFloor: number;
  totalGoldEarned: number;
  totalDamageDealt: number;
  totalCardsPlayed: number;
  favoriteCards: Record<string, number>;
  bossKills: Record<string, number>;
  characterStats: Record<string, CharacterRunStats>;
}

export interface CharacterRunStats {
  runs: number;
  wins: number;
  bestFloor: number;
  fastestWin: number | null; // In turns
}

/**
 * Manages game persistence with seed + delta strategy
 */
export class SaveManager {
  private store: StoreApi<GameStore>;
  private characterSystem: CharacterSystem | null = null;
  private flagSystem: FlagSystem | null = null;

  private readonly RUN_SAVE_KEY = 'sts-freedom-run';
  private readonly META_SAVE_KEY = 'sts-freedom-meta';
  private readonly SETTINGS_KEY = 'sts-freedom-settings';

  constructor(store: StoreApi<GameStore>) {
    this.store = store;
  }

  setSystems(characters: CharacterSystem, flags: FlagSystem): void {
    this.characterSystem = characters;
    this.flagSystem = flags;
  }

  // ============================================
  // RUN SAVE/LOAD
  // ============================================

  /**
   * Save current run state
   */
  async saveRun(
    rng: SeededRNG,
    mapState: object | null,
    combatState: object | null
  ): Promise<void> {
    const state = this.store.getState();

    if (!state.run) {
      console.warn('No active run to save');
      return;
    }

    const saveData: RunSaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      seed: state.run.seed,
      rngState: rng.getState(),
      gameState: {
        phase: state.phase,
        player: { ...state.player },
        run: {
          ...state.run,
          tags: Array.from(state.run.tags),
        },
        deck: [...state.deck],
        hand: [...state.hand],
        drawPile: [...state.drawPile],
        discardPile: [...state.discardPile],
        exhaustPile: [...state.exhaustPile],
        relics: [...state.relics],
        flags: Array.from(state.flags.entries()),
      },
      mapState,
      combatState,
      narrativeState: this.characterSystem?.serialize() || {},
      flagState: this.flagSystem?.serialize() || {},
    };

    await set(this.RUN_SAVE_KEY, saveData);
    console.log('Run saved:', saveData.seed);
  }

  /**
   * Load saved run
   */
  async loadRun(): Promise<RunSaveData | null> {
    try {
      const data = await get<RunSaveData>(this.RUN_SAVE_KEY);

      if (!data) {
        return null;
      }

      // Migrate if needed
      if (data.version < SAVE_VERSION) {
        return this.migrateRunSave(data);
      }

      return data;
    } catch (e) {
      console.error('Failed to load run:', e);
      return null;
    }
  }

  /**
   * Delete saved run
   */
  async deleteRun(): Promise<void> {
    await del(this.RUN_SAVE_KEY);
  }

  /**
   * Check if there's a saved run
   */
  async hasSavedRun(): Promise<boolean> {
    const data = await get(this.RUN_SAVE_KEY);
    return data !== undefined;
  }

  /**
   * Migrate old save format
   */
  private migrateRunSave(data: RunSaveData): RunSaveData {
    // Handle version migrations here
    console.log(`Migrating run save from v${data.version} to v${SAVE_VERSION}`);
    data.version = SAVE_VERSION;
    return data;
  }

  // ============================================
  // META SAVE/LOAD
  // ============================================

  /**
   * Save meta progression
   */
  async saveMeta(): Promise<void> {
    const state = this.store.getState();

    const stats = await this.loadStatistics();

    const saveData: MetaSaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      meta: {
        ...state.meta,
        unlockedCards: Array.from(state.meta.unlockedCards) as any,
        unlockedRelics: Array.from(state.meta.unlockedRelics) as any,
        unlockedCharacters: Array.from(state.meta.unlockedCharacters) as any,
        achievements: Array.from(state.meta.achievements) as any,
      },
      characterRelationships: this.characterSystem?.serialize() || {},
      settings: await this.loadSettings() || {},
      statistics: stats,
    };

    await set(this.META_SAVE_KEY, saveData);
  }

  /**
   * Load meta progression
   */
  async loadMeta(): Promise<MetaSaveData | null> {
    try {
      const data = await get<MetaSaveData>(this.META_SAVE_KEY);

      if (!data) {
        return null;
      }

      // Migrate if needed
      if (data.version < SAVE_VERSION) {
        return this.migrateMetaSave(data);
      }

      return data;
    } catch (e) {
      console.error('Failed to load meta:', e);
      return null;
    }
  }

  private migrateMetaSave(data: MetaSaveData): MetaSaveData {
    console.log(`Migrating meta save from v${data.version} to v${SAVE_VERSION}`);
    data.version = SAVE_VERSION;
    return data;
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Load run statistics
   */
  async loadStatistics(): Promise<RunStatistics> {
    const meta = await get<MetaSaveData>(this.META_SAVE_KEY);

    if (meta?.statistics) {
      return meta.statistics;
    }

    return {
      totalRuns: 0,
      totalWins: 0,
      totalDeaths: 0,
      highestFloor: 0,
      totalGoldEarned: 0,
      totalDamageDealt: 0,
      totalCardsPlayed: 0,
      favoriteCards: {},
      bossKills: {},
      characterStats: {},
    };
  }

  /**
   * Record completed run statistics
   */
  async recordRunEnd(
    won: boolean,
    floor: number,
    character: string,
    stats: {
      goldEarned: number;
      damageDealt: number;
      cardsPlayed: number;
      turns: number;
      bossesKilled: string[];
      cardsUsed: string[];
    }
  ): Promise<void> {
    const current = await this.loadStatistics();

    // Update totals
    current.totalRuns++;
    if (won) {
      current.totalWins++;
    } else {
      current.totalDeaths++;
    }
    current.highestFloor = Math.max(current.highestFloor, floor);
    current.totalGoldEarned += stats.goldEarned;
    current.totalDamageDealt += stats.damageDealt;
    current.totalCardsPlayed += stats.cardsPlayed;

    // Track card usage
    for (const cardId of stats.cardsUsed) {
      current.favoriteCards[cardId] = (current.favoriteCards[cardId] || 0) + 1;
    }

    // Track boss kills
    for (const bossId of stats.bossesKilled) {
      current.bossKills[bossId] = (current.bossKills[bossId] || 0) + 1;
    }

    // Update character stats
    if (!current.characterStats[character]) {
      current.characterStats[character] = {
        runs: 0,
        wins: 0,
        bestFloor: 0,
        fastestWin: null,
      };
    }

    const charStats = current.characterStats[character];
    charStats.runs++;
    charStats.bestFloor = Math.max(charStats.bestFloor, floor);

    if (won) {
      charStats.wins++;
      if (charStats.fastestWin === null || stats.turns < charStats.fastestWin) {
        charStats.fastestWin = stats.turns;
      }
    }

    // Save updated stats
    const meta = await this.loadMeta();
    if (meta) {
      meta.statistics = current;
      await set(this.META_SAVE_KEY, meta);
    }
  }

  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Save settings
   */
  async saveSettings(settings: object): Promise<void> {
    await set(this.SETTINGS_KEY, settings);
  }

  /**
   * Load settings
   */
  async loadSettings(): Promise<object | null> {
    return await get(this.SETTINGS_KEY) || null;
  }

  // ============================================
  // IMPORT/EXPORT
  // ============================================

  /**
   * Export all save data for backup
   */
  async exportAllData(): Promise<string> {
    const runData = await this.loadRun();
    const metaData = await this.loadMeta();
    const settings = await this.loadSettings();

    const exportData = {
      exportVersion: 1,
      exportDate: new Date().toISOString(),
      run: runData,
      meta: metaData,
      settings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import save data from backup
   */
  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);

      if (data.exportVersion !== 1) {
        console.error('Unknown export version');
        return false;
      }

      if (data.run) {
        await set(this.RUN_SAVE_KEY, data.run);
      }

      if (data.meta) {
        await set(this.META_SAVE_KEY, data.meta);
      }

      if (data.settings) {
        await set(this.SETTINGS_KEY, data.settings);
      }

      return true;
    } catch (e) {
      console.error('Failed to import save data:', e);
      return false;
    }
  }

  /**
   * Clear all save data
   */
  async clearAllData(): Promise<void> {
    await del(this.RUN_SAVE_KEY);
    await del(this.META_SAVE_KEY);
    await del(this.SETTINGS_KEY);
  }
}

/**
 * Create autosave interval
 */
export function setupAutosave(
  saveManager: SaveManager,
  rng: SeededRNG,
  getMapState: () => object | null,
  getCombatState: () => object | null,
  intervalMs: number = 30000
): () => void {
  const interval = setInterval(async () => {
    try {
      await saveManager.saveRun(rng, getMapState(), getCombatState());
    } catch (e) {
      console.error('Autosave failed:', e);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}
