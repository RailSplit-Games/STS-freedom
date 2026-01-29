import { createStore } from 'zustand/vanilla';

// Game phases
export type GamePhase =
  | 'main_menu'
  | 'hub'
  | 'map'
  | 'combat'
  | 'event'
  | 'merchant'
  | 'rest'
  | 'rewards'
  | 'game_over';

// Player state
export interface PlayerState {
  maxHealth: number;
  currentHealth: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  block: number;
}

// Run state
export interface RunState {
  seed: string;
  floor: number;
  act: number;
  score: number;
  tags: Set<string>; // Character tags like [NOBLE], [WARRIOR]
}

// Meta progression
export interface MetaState {
  unlockedCards: Set<string>;
  unlockedRelics: Set<string>;
  unlockedCharacters: Set<string>;
  totalRuns: number;
  totalWins: number;
  achievements: Set<string>;
}

// Full game state
export interface GameState {
  phase: GamePhase;
  player: PlayerState;
  run: RunState | null;
  meta: MetaState;
  deck: string[]; // Card IDs in deck
  hand: string[]; // Card IDs in hand
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  relics: string[]; // Relic IDs
  potions: (string | null)[]; // Potion IDs (3 slots, null = empty)
  flags: Map<string, number>; // QBN flags for narrative
}

// Actions
export interface GameActions {
  setPhase: (phase: GamePhase) => void;
  startRun: (seed: string) => void;
  endRun: (won: boolean) => void;
  updatePlayer: (updates: Partial<PlayerState>) => void;
  addCardToDeck: (cardId: string) => void;
  removeCardFromDeck: (cardId: string) => void;
  addRelic: (relicId: string) => void;
  addPotion: (potionId: string) => boolean; // Returns false if no slots
  usePotion: (slotIndex: number) => string | null; // Returns potionId if used
  removePotion: (slotIndex: number) => void;
  addTag: (tag: string) => void;
  setFlag: (key: string, value: number) => void;
  incrementFlag: (key: string, amount?: number) => void;
  drawCards: (count: number) => void;
  playCard: (handIndex: number) => void;
  discardHand: () => void;
  shuffleDiscardIntoDraw: () => void;
}

export type GameStore = GameState & GameActions;

const defaultPlayerState: PlayerState = {
  maxHealth: 80,
  currentHealth: 80,
  gold: 99,
  energy: 3,
  maxEnergy: 3,
  block: 0,
};

const defaultMetaState: MetaState = {
  unlockedCards: new Set(['strike', 'defend', 'bash']),
  unlockedRelics: new Set(['burning_blood']),
  unlockedCharacters: new Set(['warrior']),
  totalRuns: 0,
  totalWins: 0,
  achievements: new Set(),
};

export function createGameStore() {
  return createStore<GameStore>((set, get) => ({
    // Initial state
    phase: 'main_menu',
    player: { ...defaultPlayerState },
    run: null,
    meta: { ...defaultMetaState },
    deck: [],
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    relics: [],
    potions: [null, null, null],
    flags: new Map(),

    // Actions
    setPhase: (phase) => set({ phase }),

    startRun: (seed) => {
      const starterDeck = [
        'strike', 'strike', 'strike', 'strike', 'strike',
        'defend', 'defend', 'defend', 'defend',
        'bash',
      ];
      set({
        phase: 'map',
        player: { ...defaultPlayerState },
        run: {
          seed,
          floor: 0,
          act: 1,
          score: 0,
          tags: new Set(['WARRIOR']),
        },
        deck: [...starterDeck],
        hand: [],
        drawPile: [...starterDeck],
        discardPile: [],
        exhaustPile: [],
        relics: ['burning_blood'],
        potions: [null, null, null],
        flags: new Map(),
      });
    },

    endRun: (won) => {
      const state = get();
      set({
        phase: 'main_menu',
        run: null,
        meta: {
          ...state.meta,
          totalRuns: state.meta.totalRuns + 1,
          totalWins: state.meta.totalWins + (won ? 1 : 0),
        },
      });
    },

    updatePlayer: (updates) => set((state) => ({
      player: { ...state.player, ...updates },
    })),

    addCardToDeck: (cardId) => set((state) => ({
      deck: [...state.deck, cardId],
    })),

    removeCardFromDeck: (cardId) => set((state) => {
      const index = state.deck.indexOf(cardId);
      if (index === -1) return state;
      const newDeck = [...state.deck];
      newDeck.splice(index, 1);
      return { deck: newDeck };
    }),

    addRelic: (relicId) => set((state) => ({
      relics: [...state.relics, relicId],
    })),

    addPotion: (potionId) => {
      const state = get();
      const emptySlot = state.potions.findIndex(p => p === null);
      if (emptySlot === -1) return false;
      const newPotions = [...state.potions];
      newPotions[emptySlot] = potionId;
      set({ potions: newPotions });
      return true;
    },

    usePotion: (slotIndex) => {
      const state = get();
      if (slotIndex < 0 || slotIndex >= state.potions.length) return null;
      const potionId = state.potions[slotIndex];
      if (!potionId) return null;
      const newPotions = [...state.potions];
      newPotions[slotIndex] = null;
      set({ potions: newPotions });
      return potionId;
    },

    removePotion: (slotIndex) => {
      const state = get();
      if (slotIndex < 0 || slotIndex >= state.potions.length) return;
      const newPotions = [...state.potions];
      newPotions[slotIndex] = null;
      set({ potions: newPotions });
    },

    addTag: (tag) => set((state) => {
      if (!state.run) return state;
      const newTags = new Set(state.run.tags);
      newTags.add(tag);
      return { run: { ...state.run, tags: newTags } };
    }),

    setFlag: (key, value) => set((state) => {
      const newFlags = new Map(state.flags);
      newFlags.set(key, value);
      return { flags: newFlags };
    }),

    incrementFlag: (key, amount = 1) => set((state) => {
      const newFlags = new Map(state.flags);
      newFlags.set(key, (newFlags.get(key) || 0) + amount);
      return { flags: newFlags };
    }),

    drawCards: (count) => set((state) => {
      const newHand = [...state.hand];
      const newDrawPile = [...state.drawPile];
      const newDiscardPile = [...state.discardPile];

      for (let i = 0; i < count; i++) {
        if (newDrawPile.length === 0) {
          if (newDiscardPile.length === 0) break;
          // Shuffle discard into draw
          newDrawPile.push(...newDiscardPile);
          newDiscardPile.length = 0;
          // Fisher-Yates shuffle
          for (let j = newDrawPile.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [newDrawPile[j], newDrawPile[k]] = [newDrawPile[k], newDrawPile[j]];
          }
        }
        const card = newDrawPile.pop();
        if (card) newHand.push(card);
      }

      return {
        hand: newHand,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
      };
    }),

    playCard: (handIndex) => set((state) => {
      if (handIndex < 0 || handIndex >= state.hand.length) return state;
      const card = state.hand[handIndex];
      const newHand = [...state.hand];
      newHand.splice(handIndex, 1);
      return {
        hand: newHand,
        discardPile: [...state.discardPile, card],
      };
    }),

    discardHand: () => set((state) => ({
      discardPile: [...state.discardPile, ...state.hand],
      hand: [],
    })),

    shuffleDiscardIntoDraw: () => set((state) => {
      const combined = [...state.drawPile, ...state.discardPile];
      // Fisher-Yates shuffle
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }
      return {
        drawPile: combined,
        discardPile: [],
      };
    }),
  }));
}
