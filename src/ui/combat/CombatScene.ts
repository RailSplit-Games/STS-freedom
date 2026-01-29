import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameManager, Scene } from '../../core/GameManager';
import { World, EntityId } from '../../core/ecs/ECS';
import { CombatStateMachine } from '../../combat/state/CombatStateMachine';
import { CardDatabase } from '../../combat/cards/CardDatabase';
import { EncounterPool } from '../../combat/enemies/EnemyDatabase';
import { EventBus } from '../../core/events/EventBus';

/**
 * Combat scene - handles card battles
 */
export class CombatScene implements Scene {
  public container: Container;
  private game: GameManager;
  private world: World;
  private combatMachine: CombatStateMachine;

  // UI containers
  private enemiesContainer: Container;
  private handContainer: Container;
  private playerContainer: Container;
  private uiContainer: Container;
  private effectsContainer: Container;

  private selectedCardIndex: number | null = null;

  constructor(game: GameManager) {
    this.game = game;
    this.container = new Container();
    this.world = new World();
    this.combatMachine = new CombatStateMachine(
      this.world,
      game.events,
      game.rng,
      game.store
    );

    this.enemiesContainer = new Container();
    this.handContainer = new Container();
    this.playerContainer = new Container();
    this.uiContainer = new Container();
    this.effectsContainer = new Container();
  }

  async init(): Promise<void> {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x1a1a2e });
    this.container.addChild(bg);

    // Layer order
    this.container.addChild(this.enemiesContainer);
    this.container.addChild(this.playerContainer);
    this.container.addChild(this.handContainer);
    this.container.addChild(this.effectsContainer);
    this.container.addChild(this.uiContainer);

    // End turn button
    this.createEndTurnButton();
  }

  private createEndTurnButton(): void {
    const button = new Container();
    button.position.set(window.innerWidth - 120, window.innerHeight - 200);

    const bg = new Graphics();
    bg.roundRect(-50, -25, 100, 50, 8);
    bg.fill({ color: 0x4a4a6a });
    bg.stroke({ width: 2, color: 0x6a6a8a });
    button.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const text = new Text({ text: 'End Turn', style: textStyle });
    text.anchor.set(0.5);
    button.addChild(text);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-50, -25, 100, 50, 8);
      bg.fill({ color: 0x5a5a7a });
      bg.stroke({ width: 2, color: 0x8a8aaa });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-50, -25, 100, 50, 8);
      bg.fill({ color: 0x4a4a6a });
      bg.stroke({ width: 2, color: 0x6a6a8a });
    });

    button.on('pointerdown', () => {
      this.combatMachine.endTurn();
    });

    this.uiContainer.addChild(button);
  }

  enter(): void {
    // Start new combat
    const runState = this.game.getState().run;
    const floor = runState?.floor || 0;

    // Get appropriate encounter
    const encounter = this.selectEncounter(floor);
    this.combatMachine.initCombat(encounter);

    // Initial render
    this.renderCombat();

    // Subscribe to events for updates
    this.setupEventListeners();
  }

  private selectEncounter(floor: number): string[] {
    const act = Math.floor(floor / 17) + 1;
    const eligible = EncounterPool.filter((e) => {
      if (e.act !== act) return false;
      if (e.minFloor !== undefined && floor < e.minFloor) return false;
      if (e.maxFloor !== undefined && floor > e.maxFloor) return false;
      return true;
    });

    if (eligible.length === 0) {
      return ['jaw_worm']; // Fallback
    }

    const weights = eligible.map((e) => e.weight);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.game.rng.getStream('combat').random() * total;

    for (let i = 0; i < eligible.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        return eligible[i].enemies;
      }
    }

    return eligible[0].enemies;
  }

  private setupEventListeners(): void {
    // Combat events trigger re-render
    const rerender = () => this.renderCombat();

    this.game.events.on('combat:damage', rerender);
    this.game.events.on('combat:block_gained', rerender);
    this.game.events.on('combat:card_played', rerender);
    this.game.events.on('combat:turn_start', rerender);
    this.game.events.on('combat:turn_end', rerender);
    this.game.events.on('combat:end', (data: { victory: boolean }) => {
      if (data.victory) {
        setTimeout(() => {
          this.game.store.getState().setPhase('rewards');
        }, 1000);
      } else {
        setTimeout(() => {
          this.game.store.getState().setPhase('game_over');
        }, 1000);
      }
    });
  }

  exit(): void {
    // Cleanup event listeners
    this.enemiesContainer.removeChildren();
    this.handContainer.removeChildren();
    this.playerContainer.removeChildren();
    this.effectsContainer.removeChildren();
  }

  update(delta: number): void {
    // Animations
  }

  private renderCombat(): void {
    this.renderEnemies();
    this.renderPlayer();
    this.renderHand();
    this.renderUI();
  }

  private renderEnemies(): void {
    this.enemiesContainer.removeChildren();

    const state = this.combatMachine.getState();
    const world = this.combatMachine.getWorld();

    for (const enemyId of state.enemyIds) {
      const position = world.getComponent(enemyId, 'position');
      const health = world.getComponent(enemyId, 'health');
      const block = world.getComponent(enemyId, 'block');
      const intent = world.getComponent(enemyId, 'intent');
      const name = world.getComponent(enemyId, 'name');

      if (!position || !health) continue;

      const enemyContainer = new Container();
      enemyContainer.position.set(position.x, position.y);

      // Enemy body (placeholder)
      const body = new Graphics();
      body.circle(0, 0, 50);
      body.fill({ color: 0x8b0000 });
      body.stroke({ width: 3, color: 0xff0000 });
      enemyContainer.addChild(body);

      // Name
      if (name) {
        const nameStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        const nameText = new Text({ text: name.name, style: nameStyle });
        nameText.anchor.set(0.5);
        nameText.position.y = -80;
        enemyContainer.addChild(nameText);
      }

      // Health bar
      const hpBar = this.createHealthBar(health.current, health.max);
      hpBar.position.y = 70;
      enemyContainer.addChild(hpBar);

      // Block indicator
      if (block && block.amount > 0) {
        const blockBg = new Graphics();
        blockBg.circle(-60, 0, 20);
        blockBg.fill({ color: 0x4169e1 });
        enemyContainer.addChild(blockBg);

        const blockStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        const blockText = new Text({ text: block.amount.toString(), style: blockStyle });
        blockText.anchor.set(0.5);
        blockText.position.set(-60, 0);
        enemyContainer.addChild(blockText);
      }

      // Intent indicator
      if (intent) {
        const intentContainer = this.createIntentIndicator(intent);
        intentContainer.position.y = -60;
        enemyContainer.addChild(intentContainer);
      }

      // Make clickable for targeting
      body.eventMode = 'static';
      body.cursor = 'pointer';
      body.on('pointerdown', () => {
        if (this.selectedCardIndex !== null) {
          this.combatMachine.selectTarget(enemyId);
          this.selectedCardIndex = null;
          this.renderCombat();
        }
      });

      this.enemiesContainer.addChild(enemyContainer);
    }
  }

  private createIntentIndicator(intent: { action: string; value: number; multiHit?: number }): Container {
    const container = new Container();

    const bgColor = intent.action === 'attack' ? 0xff4444 :
                    intent.action === 'defend' ? 0x4444ff :
                    intent.action === 'buff' ? 0x44ff44 : 0xffff44;

    const bg = new Graphics();
    bg.roundRect(-30, -15, 60, 30, 6);
    bg.fill({ color: bgColor, alpha: 0.8 });
    container.addChild(bg);

    const icon = intent.action === 'attack' ? '⚔' :
                 intent.action === 'defend' ? '🛡' :
                 intent.action === 'buff' ? '⬆' : '❓';

    let text = `${icon} ${intent.value}`;
    if (intent.multiHit && intent.multiHit > 1) {
      text += `x${intent.multiHit}`;
    }

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });

    const intentText = new Text({ text, style: textStyle });
    intentText.anchor.set(0.5);
    container.addChild(intentText);

    return container;
  }

  private renderPlayer(): void {
    this.playerContainer.removeChildren();

    const state = this.combatMachine.getState();
    const world = this.combatMachine.getWorld();
    const position = world.getComponent(state.playerId, 'position');
    const health = world.getComponent(state.playerId, 'health');
    const block = world.getComponent(state.playerId, 'block');
    const energy = world.getComponent(state.playerId, 'energy');

    if (!position) return;

    const playerContainer = new Container();
    playerContainer.position.set(position.x, position.y);

    // Player body (placeholder)
    const body = new Graphics();
    body.circle(0, 0, 50);
    body.fill({ color: 0x2e5090 });
    body.stroke({ width: 3, color: 0x4a90d9 });
    playerContainer.addChild(body);

    // Health bar
    if (health) {
      const hpBar = this.createHealthBar(health.current, health.max);
      hpBar.position.y = 70;
      playerContainer.addChild(hpBar);
    }

    // Block indicator
    if (block && block.amount > 0) {
      const blockBg = new Graphics();
      blockBg.circle(60, 0, 20);
      blockBg.fill({ color: 0x4169e1 });
      playerContainer.addChild(blockBg);

      const blockStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      const blockText = new Text({ text: block.amount.toString(), style: blockStyle });
      blockText.anchor.set(0.5);
      blockText.position.set(60, 0);
      playerContainer.addChild(blockText);
    }

    // Energy orb
    if (energy) {
      const energyOrb = new Graphics();
      energyOrb.circle(-70, 50, 25);
      energyOrb.fill({ color: 0xffd700 });
      energyOrb.stroke({ width: 2, color: 0xffffff });
      playerContainer.addChild(energyOrb);

      const energyStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0x000000,
        fontWeight: 'bold',
      });
      const energyText = new Text({
        text: `${energy.current}/${energy.max}`,
        style: energyStyle,
      });
      energyText.anchor.set(0.5);
      energyText.position.set(-70, 50);
      playerContainer.addChild(energyText);
    }

    this.playerContainer.addChild(playerContainer);
  }

  private createHealthBar(current: number, max: number): Container {
    const container = new Container();
    const width = 100;
    const height = 12;

    // Background
    const bg = new Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, 4);
    bg.fill({ color: 0x333333 });
    container.addChild(bg);

    // Fill
    const fillWidth = (current / max) * (width - 4);
    const fillColor = current / max > 0.5 ? 0x44aa44 :
                      current / max > 0.25 ? 0xaaaa44 : 0xaa4444;

    const fill = new Graphics();
    fill.roundRect(-width / 2 + 2, -height / 2 + 2, fillWidth, height - 4, 2);
    fill.fill({ color: fillColor });
    container.addChild(fill);

    // Text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
    });
    const text = new Text({ text: `${current}/${max}`, style: textStyle });
    text.anchor.set(0.5);
    container.addChild(text);

    return container;
  }

  private renderHand(): void {
    this.handContainer.removeChildren();

    const gameState = this.game.getState();
    const hand = gameState.hand;

    const cardWidth = 120;
    const cardHeight = 160;
    const handWidth = Math.min(hand.length * (cardWidth - 20), window.innerWidth - 200);
    const startX = (window.innerWidth - handWidth) / 2;
    const baseY = window.innerHeight - cardHeight / 2 - 30;

    hand.forEach((cardId, index) => {
      const cardDef = CardDatabase.get(cardId);
      if (!cardDef) return;

      const card = this.createCardGraphic(cardDef, index);

      // Fan arrangement
      const xOffset = hand.length > 1 ? (index / (hand.length - 1)) * handWidth : handWidth / 2;
      const yOffset = Math.abs(index - (hand.length - 1) / 2) * 5; // Slight arc

      card.position.set(startX + xOffset, baseY + yOffset);

      // Rotation for fan effect
      const rotation = ((index - (hand.length - 1) / 2) / hand.length) * 0.1;
      card.rotation = rotation;

      this.handContainer.addChild(card);
    });
  }

  private createCardGraphic(cardDef: ReturnType<typeof CardDatabase.get>, index: number): Container {
    if (!cardDef) return new Container();

    const container = new Container();
    const width = 120;
    const height = 160;

    // Card background
    const bg = new Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, 8);

    const bgColor = cardDef.type === 'attack' ? 0x8b4513 :
                    cardDef.type === 'skill' ? 0x4169e1 :
                    cardDef.type === 'power' ? 0x9370db : 0x444444;

    bg.fill({ color: bgColor });
    bg.stroke({ width: 2, color: 0xffffff });
    container.addChild(bg);

    // Cost orb
    const costOrb = new Graphics();
    costOrb.circle(-width / 2 + 15, -height / 2 + 15, 15);
    costOrb.fill({ color: 0xffd700 });
    container.addChild(costOrb);

    const costStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0x000000,
    });
    const costText = new Text({ text: cardDef.cost.toString(), style: costStyle });
    costText.anchor.set(0.5);
    costText.position.set(-width / 2 + 15, -height / 2 + 15);
    container.addChild(costText);

    // Card name
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'bold',
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: width - 20,
    });
    const nameText = new Text({ text: cardDef.name, style: nameStyle });
    nameText.anchor.set(0.5);
    nameText.position.y = -height / 2 + 50;
    container.addChild(nameText);

    // Card description
    const descStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xe0e0e0,
      wordWrap: true,
      wordWrapWidth: width - 20,
    });
    const descText = new Text({ text: cardDef.description, style: descStyle });
    descText.anchor.set(0.5, 0);
    descText.position.y = 0;
    container.addChild(descText);

    // Interactivity
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      container.scale.set(1.15);
      container.position.y -= 20;
      container.zIndex = 100;
      this.handContainer.sortChildren();
    });

    container.on('pointerout', () => {
      container.scale.set(1);
      container.position.y += 20;
      container.zIndex = index;
      this.handContainer.sortChildren();
    });

    container.on('pointerdown', () => {
      this.selectedCardIndex = index;
      this.combatMachine.selectCard(index);

      // If card doesn't need target, play immediately
      if (cardDef.target !== 'enemy') {
        this.combatMachine.playSelectedCard();
        this.selectedCardIndex = null;
      }

      this.renderCombat();
    });

    container.zIndex = index;

    return container;
  }

  private renderUI(): void {
    // Additional UI elements (deck count, discard count, etc.)
    // This would show draw pile, discard pile counts
  }
}
