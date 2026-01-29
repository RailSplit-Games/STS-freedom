import { Application } from 'pixi.js';
import { GameManager } from './core/GameManager';
import { createGameStore } from './core/store';

async function init() {
  // Create Pixi.js application
  const app = new Application();
  await app.init({
    background: '#1a1a2e',
    resizeTo: window,
    antialias: true,
  });

  // Add canvas to DOM
  const container = document.getElementById('app');
  if (!container) throw new Error('App container not found');
  container.appendChild(app.canvas);

  // Initialize game store
  const store = createGameStore();

  // Initialize game manager
  const gameManager = new GameManager(app, store);
  await gameManager.init();

  // Start game loop
  gameManager.start();

  // Debug: expose to window
  if (import.meta.env.DEV) {
    (window as any).game = gameManager;
    (window as any).store = store;
  }
}

init().catch(console.error);
