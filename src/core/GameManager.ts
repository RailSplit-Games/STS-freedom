import { Application, Container } from 'pixi.js';
import type { StoreApi } from 'zustand/vanilla';
import type { GameStore, GamePhase } from './store';
import { EventBus } from './events/EventBus';
import { SeededRNG } from './rng/SeededRNG';
import { CombatScene } from '../ui/combat/CombatScene';
import { MapScene } from '../ui/map/MapScene';
import { MainMenuScene } from '../ui/MainMenuScene';
import { HubScene } from '../ui/hub/HubScene';
import { LLMClient } from '../llm/client/LLMClient';

export interface Scene {
  container: Container;
  init(): Promise<void>;
  enter(): void;
  exit(): void;
  update(delta: number): void;
}

export class GameManager {
  public readonly app: Application;
  public readonly store: StoreApi<GameStore>;
  public readonly events: EventBus;
  public readonly llm: LLMClient;
  public rng: SeededRNG;

  private scenes: Map<GamePhase, Scene> = new Map();
  private currentScene: Scene | null = null;
  private lastPhase: GamePhase | null = null;

  constructor(app: Application, store: StoreApi<GameStore>) {
    this.app = app;
    this.store = store;
    this.events = new EventBus();
    this.rng = new SeededRNG('default');
    this.llm = new LLMClient();
  }

  async init(): Promise<void> {
    // Create scenes
    this.scenes.set('main_menu', new MainMenuScene(this));
    this.scenes.set('hub', new HubScene(this));
    this.scenes.set('map', new MapScene(this));
    this.scenes.set('combat', new CombatScene(this));

    // Initialize all scenes
    for (const scene of this.scenes.values()) {
      await scene.init();
    }

    // Subscribe to state changes
    this.store.subscribe((state, prevState) => {
      if (state.phase !== prevState.phase) {
        this.handlePhaseChange(state.phase);
      }
    });

    // Initial phase
    this.handlePhaseChange(this.store.getState().phase);
  }

  private handlePhaseChange(phase: GamePhase): void {
    // Exit current scene
    if (this.currentScene) {
      this.currentScene.exit();
      this.app.stage.removeChild(this.currentScene.container);
    }

    // Enter new scene
    const scene = this.scenes.get(phase);
    if (scene) {
      this.currentScene = scene;
      this.app.stage.addChild(scene.container);
      scene.enter();
    }

    this.lastPhase = phase;
  }

  start(): void {
    this.app.ticker.add((ticker) => {
      if (this.currentScene) {
        this.currentScene.update(ticker.deltaTime);
      }
    });
  }

  startNewRun(seed?: string): void {
    const finalSeed = seed || this.generateSeed();
    this.rng = new SeededRNG(finalSeed);
    this.store.getState().startRun(finalSeed);
  }

  private generateSeed(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let seed = '';
    for (let i = 0; i < 12; i++) {
      seed += chars[Math.floor(Math.random() * chars.length)];
    }
    return seed;
  }

  getState(): GameStore {
    return this.store.getState();
  }
}
