import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameManager, Scene } from '../../core/GameManager';
import { MapGenerator, GameMap, MapNode, NodeType } from '../../generation/map/MapGenerator';
import { createPotionHotbar, createDeckViewerButton, createGoldDisplay, updateGoldDisplay } from '../components/UIComponents';
import { createDeckViewer } from '../components/DeckViewer';
import { getPotion } from '../../combat/potions/PotionDatabase';

const NODE_COLORS: Record<NodeType, number> = {
  monster: 0x8b4513,    // Brown
  elite: 0xffd700,      // Gold
  rest: 0x228b22,       // Green
  merchant: 0x4169e1,   // Blue
  treasure: 0xffa500,   // Orange
  event: 0x9370db,      // Purple
  boss: 0xff0000,       // Red
};

const NODE_ICONS: Record<NodeType, string> = {
  monster: '⚔',
  elite: '💀',
  rest: '🔥',
  merchant: '💰',
  treasure: '📦',
  event: '❓',
  boss: '👑',
};

/**
 * Map navigation scene
 */
export class MapScene implements Scene {
  public container: Container;
  private game: GameManager;
  private mapGenerator: MapGenerator;
  private currentMap: GameMap | null = null;

  private nodesContainer: Container;
  private connectionsContainer: Container;
  private scrollContainer: Container;
  private uiContainer: Container;
  private deckViewerOverlay: Container | null = null;

  private isDragging = false;
  private lastDragY = 0;
  private scrollY = 0;

  constructor(game: GameManager) {
    this.game = game;
    this.mapGenerator = new MapGenerator(game.rng);
    this.container = new Container();
    this.scrollContainer = new Container();
    this.connectionsContainer = new Container();
    this.nodesContainer = new Container();
  }

  async init(): Promise<void> {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x1a1a2e });
    this.container.addChild(bg);

    // Scroll container
    this.scrollContainer.addChild(this.connectionsContainer);
    this.scrollContainer.addChild(this.nodesContainer);
    this.container.addChild(this.scrollContainer);

    // UI overlay (fixed position)
    this.createUI();

    // Enable scrolling
    this.setupScrolling();
  }

  private createUI(): void {
    this.uiContainer = new Container();
    this.uiContainer.label = 'uiContainer';

    // Player stats panel (left side)
    const statsPanel = new Graphics();
    statsPanel.roundRect(10, 10, 200, 80, 8);
    statsPanel.fill({ color: 0x222233, alpha: 0.9 });
    statsPanel.stroke({ width: 2, color: 0x444466 });
    this.uiContainer.addChild(statsPanel);

    // Stats text
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xe0e0e0,
    });

    const statsText = new Text({
      text: this.getStatsText(),
      style: statsStyle,
    });
    statsText.position.set(20, 18);
    statsText.label = 'statsText';
    this.uiContainer.addChild(statsText);

    // Potion hotbar (top center)
    const potionHotbar = createPotionHotbar(this.game, (slotIndex) => {
      this.usePotion(slotIndex);
    });
    potionHotbar.position.set(window.innerWidth / 2 - 75, 10);
    this.uiContainer.addChild(potionHotbar);

    // Gold display (top right)
    const goldDisplay = createGoldDisplay(this.game);
    goldDisplay.position.set(window.innerWidth - 120, 10);
    this.uiContainer.addChild(goldDisplay);

    // Floor indicator (below potions)
    const floorStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const floorText = new Text({
      text: 'Floor 1',
      style: floorStyle,
    });
    floorText.anchor.set(0.5, 0);
    floorText.position.set(window.innerWidth / 2, 75);
    floorText.label = 'floorText';
    this.uiContainer.addChild(floorText);

    // Seed display (below gold)
    const seedStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0x888888,
    });

    const seedText = new Text({
      text: `Seed: ${this.game.rng.getSeed()}`,
      style: seedStyle,
    });
    seedText.anchor.set(1, 0);
    seedText.position.set(window.innerWidth - 15, 52);
    seedText.label = 'seedText';
    this.uiContainer.addChild(seedText);

    // Deck viewer button (bottom left)
    const deckButton = createDeckViewerButton(() => {
      this.showDeckViewer();
    });
    deckButton.position.set(15, window.innerHeight - 95);
    this.uiContainer.addChild(deckButton);

    this.container.addChild(this.uiContainer);
  }

  private usePotion(slotIndex: number): void {
    const potions = this.game.getState().potions;
    const potionId = potions[slotIndex];
    if (!potionId) return;

    const potion = getPotion(potionId);
    if (!potion) return;

    // Check if combat only
    if (potion.combatOnly) {
      this.showMessage('This potion can only be used in combat!');
      return;
    }

    // Consume potion
    this.game.store.getState().usePotion(slotIndex);

    // Apply potion effects (only non-combat effects work on map)
    for (const effect of potion.effects) {
      if (effect.type === 'heal') {
        const state = this.game.getState();
        const newHealth = Math.min(state.player.maxHealth, state.player.currentHealth + effect.value);
        this.game.store.getState().updatePlayer({ currentHealth: newHealth });
      }
    }

    // Refresh UI
    this.refreshUI();
  }

  private showMessage(text: string): void {
    const message = new Container();
    message.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const bg = new Graphics();
    bg.roundRect(-180, -25, 360, 50, 10);
    bg.fill({ color: 0x222233, alpha: 0.95 });
    bg.stroke({ width: 2, color: 0xff6666 });
    message.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xff6666,
    });
    const label = new Text({ text, style: textStyle });
    label.anchor.set(0.5);
    message.addChild(label);

    this.container.addChild(message);

    setTimeout(() => {
      if (message.parent) {
        message.parent.removeChild(message);
      }
    }, 2000);
  }

  private showDeckViewer(): void {
    if (this.deckViewerOverlay) return;

    this.deckViewerOverlay = createDeckViewer(this.game, () => {
      this.hideDeckViewer();
    });
    this.container.addChild(this.deckViewerOverlay);
  }

  private hideDeckViewer(): void {
    if (this.deckViewerOverlay) {
      this.container.removeChild(this.deckViewerOverlay);
      this.deckViewerOverlay = null;
    }
  }

  private refreshUI(): void {
    // Remove old UI and recreate
    const oldUI = this.container.getChildByLabel('uiContainer');
    if (oldUI) {
      this.container.removeChild(oldUI);
    }
    this.createUI();
    this.updateUI();
  }

  private getStatsText(): string {
    const state = this.game.getState();
    return `HP: ${state.player.currentHealth}/${state.player.maxHealth}\nGold: ${state.player.gold}\nDeck: ${state.deck.length} cards`;
  }

  private setupScrolling(): void {
    // Enable interaction on background
    const bg = this.container.getChildAt(0) as Graphics;
    bg.eventMode = 'static';

    bg.on('pointerdown', (e: FederatedPointerEvent) => {
      this.isDragging = true;
      this.lastDragY = e.globalY;
    });

    bg.on('pointerup', () => {
      this.isDragging = false;
    });

    bg.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    bg.on('pointermove', (e: FederatedPointerEvent) => {
      if (!this.isDragging) return;

      const deltaY = e.globalY - this.lastDragY;
      this.lastDragY = e.globalY;

      this.scrollY += deltaY;

      // Clamp scroll
      const maxScroll = 0;
      const minScroll = -1500; // Based on map height (15 floors * 100 spacing)
      this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY));

      this.scrollContainer.position.y = this.scrollY;
    });

    // Mouse wheel
    bg.on('wheel', (e: WheelEvent) => {
      this.scrollY -= e.deltaY * 0.5;

      const maxScroll = 0;
      const minScroll = -1500;
      this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY));

      this.scrollContainer.position.y = this.scrollY;
    });
  }

  enter(): void {
    // Generate map if needed
    if (!this.currentMap) {
      const act = this.game.getState().run?.act || 1;
      this.currentMap = this.mapGenerator.generate(act);
    }

    // Re-render map to update greyed out nodes
    this.renderMap();

    // Refresh UI to show current potions/gold
    this.refreshUI();

    // Scroll to current position with animation
    const offsetY = 150; // Match the render offset
    if (this.currentMap?.currentNodeId) {
      const node = this.currentMap.nodes.get(this.currentMap.currentNodeId);
      if (node) {
        const targetY = -(node.y + offsetY) + window.innerHeight / 2;
        this.animateScrollTo(targetY);
      }
    } else {
      // Scroll to bottom (start) - floor 0 nodes
      const startNodes = Array.from(this.currentMap!.nodes.values()).filter(n => n.floor === 0);
      if (startNodes.length > 0) {
        const targetY = -(startNodes[0].y + offsetY) + window.innerHeight / 2;
        this.animateScrollTo(targetY);
      }
    }
  }

  private animateScrollTo(targetY: number): void {
    const startY = this.scrollY;
    const startTime = Date.now();
    const duration = 300;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);

      this.scrollY = startY + (targetY - startY) * eased;
      this.scrollContainer.position.y = this.scrollY;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  exit(): void {
    // Cleanup
  }

  update(delta: number): void {
    // Update any animations
  }

  private renderMap(): void {
    if (!this.currentMap) return;

    this.connectionsContainer.removeChildren();
    this.nodesContainer.removeChildren();

    // Offset for centering
    const offsetX = (window.innerWidth - 600) / 2;
    const offsetY = 150;

    // Determine current floor for greying out passed paths
    let currentFloor = -1;
    if (this.currentMap.currentNodeId) {
      const currentNode = this.currentMap.nodes.get(this.currentMap.currentNodeId);
      if (currentNode) {
        currentFloor = currentNode.floor;
      }
    }

    // Draw connections first (behind nodes)
    for (const node of this.currentMap.nodes.values()) {
      for (const targetId of node.connections) {
        const targetNode = this.currentMap.nodes.get(targetId);
        if (!targetNode) continue;

        // Grey out connections in passed rows
        const isPassed = currentFloor >= 0 && node.floor < currentFloor;
        const isVisitedPath = node.visited && targetNode.visited;

        const line = new Graphics();
        line.moveTo(node.x + offsetX, node.y + offsetY);
        line.lineTo(targetNode.x + offsetX, targetNode.y + offsetY);
        line.stroke({
          width: isVisitedPath ? 3 : 2,
          color: isVisitedPath ? 0x88aa88 : (isPassed ? 0x222222 : 0x444466),
          alpha: isPassed ? 0.3 : (isVisitedPath ? 0.8 : 0.6),
        });

        this.connectionsContainer.addChild(line);
      }
    }

    // Draw nodes
    for (const node of this.currentMap.nodes.values()) {
      const nodeContainer = this.createNodeGraphic(node, offsetX, offsetY);
      this.nodesContainer.addChild(nodeContainer);
    }
  }

  private createNodeGraphic(node: MapNode, offsetX: number, offsetY: number): Container {
    const container = new Container();
    container.position.set(node.x + offsetX, node.y + offsetY);

    const radius = node.type === 'boss' ? 35 : 25;
    const color = NODE_COLORS[node.type];

    // Determine if this node is in a passed row (floor below current position)
    let currentFloor = -1;
    if (this.currentMap?.currentNodeId) {
      const currentNode = this.currentMap.nodes.get(this.currentMap.currentNodeId);
      if (currentNode) {
        currentFloor = currentNode.floor;
      }
    }
    const isPassed = currentFloor >= 0 && node.floor < currentFloor && !node.visited;
    const isGreyedOut = node.visited || isPassed;

    // Node circle
    const circle = new Graphics();
    circle.circle(0, 0, radius);
    circle.fill({ color: isGreyedOut ? 0x2a2a2a : color });
    circle.stroke({
      width: 3,
      color: isGreyedOut ? 0x444444 : 0xffffff,
      alpha: isGreyedOut ? 0.4 : 1,
    });
    container.addChild(circle);

    // Node icon
    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: radius * 0.8,
      fill: isGreyedOut ? 0x555555 : 0xffffff,
    });

    const icon = new Text({
      text: NODE_ICONS[node.type],
      style: iconStyle,
    });
    icon.anchor.set(0.5);
    container.addChild(icon);

    // Set overall alpha for passed nodes
    if (isPassed) {
      container.alpha = 0.4;
    }

    // Interactivity
    const reachable = this.currentMap
      ? this.mapGenerator.getReachableNodes(this.currentMap)
      : [];
    const isReachable = reachable.some((n) => n.id === node.id);

    if (isReachable && !node.visited) {
      container.eventMode = 'static';
      container.cursor = 'pointer';

      // Glow effect for reachable nodes
      const glow = new Graphics();
      glow.circle(0, 0, radius + 5);
      glow.fill({ color: 0xffffff, alpha: 0 });
      glow.stroke({ width: 3, color: 0xffffff, alpha: 0.3 });
      container.addChildAt(glow, 0);

      container.on('pointerover', () => {
        glow.clear();
        glow.circle(0, 0, radius + 5);
        glow.fill({ color: 0xffffff, alpha: 0 });
        glow.stroke({ width: 4, color: 0xffffff, alpha: 0.6 });
        container.scale.set(1.1);
      });

      container.on('pointerout', () => {
        glow.clear();
        glow.circle(0, 0, radius + 5);
        glow.fill({ color: 0xffffff, alpha: 0 });
        glow.stroke({ width: 3, color: 0xffffff, alpha: 0.3 });
        container.scale.set(1);
      });

      container.on('pointerdown', () => {
        this.selectNode(node);
      });
    }

    return container;
  }

  private selectNode(node: MapNode): void {
    if (!this.currentMap) return;

    // Mark as visited
    this.mapGenerator.visitNode(this.currentMap, node.id);

    // Transition to appropriate scene based on node type
    switch (node.type) {
      case 'monster':
      case 'elite':
      case 'boss':
        // Start combat
        this.game.store.getState().setPhase('combat');
        break;
      case 'event':
        this.game.store.getState().setPhase('event');
        break;
      case 'merchant':
        this.game.store.getState().setPhase('merchant');
        break;
      case 'rest':
        this.game.store.getState().setPhase('rest');
        break;
      case 'treasure':
        this.game.store.getState().setPhase('rewards');
        break;
    }

    // Re-render map
    this.renderMap();
  }

  private updateUI(): void {
    const state = this.game.getState();

    // Update stats
    const statsText = this.container.getChildByLabel('statsText', true) as Text;
    if (statsText) {
      statsText.text = this.getStatsText();
    }

    // Update floor
    const floorText = this.container.getChildByLabel('floorText', true) as Text;
    if (floorText && state.run) {
      floorText.text = `Floor ${state.run.floor + 1}`;
    }
  }
}
