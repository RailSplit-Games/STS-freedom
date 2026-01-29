import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import type { GameManager, Scene } from '../../core/GameManager';
import { MapGenerator, GameMap, MapNode, NodeType } from '../../generation/map/MapGenerator';

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
    const uiContainer = new Container();

    // Player stats panel
    const statsPanel = new Graphics();
    statsPanel.roundRect(10, 10, 200, 100, 8);
    statsPanel.fill({ color: 0x222233, alpha: 0.9 });
    statsPanel.stroke({ width: 2, color: 0x444466 });
    uiContainer.addChild(statsPanel);

    // Stats text
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xe0e0e0,
    });

    const statsText = new Text({
      text: this.getStatsText(),
      style: statsStyle,
    });
    statsText.position.set(20, 20);
    statsText.name = 'statsText';
    uiContainer.addChild(statsText);

    // Floor indicator
    const floorStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });

    const floorText = new Text({
      text: 'Floor 1',
      style: floorStyle,
    });
    floorText.anchor.set(0.5, 0);
    floorText.position.set(window.innerWidth / 2, 20);
    floorText.name = 'floorText';
    uiContainer.addChild(floorText);

    // Seed display
    const seedStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x888888,
    });

    const seedText = new Text({
      text: `Seed: ${this.game.rng.getSeed()}`,
      style: seedStyle,
    });
    seedText.anchor.set(1, 0);
    seedText.position.set(window.innerWidth - 20, 20);
    seedText.name = 'seedText';
    uiContainer.addChild(seedText);

    this.container.addChild(uiContainer);
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
      const minScroll = -800; // Based on map height
      this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY));

      this.scrollContainer.position.y = this.scrollY;
    });

    // Mouse wheel
    bg.on('wheel', (e: WheelEvent) => {
      this.scrollY -= e.deltaY * 0.5;

      const maxScroll = 0;
      const minScroll = -800;
      this.scrollY = Math.max(minScroll, Math.min(maxScroll, this.scrollY));

      this.scrollContainer.position.y = this.scrollY;
    });
  }

  enter(): void {
    // Generate map if needed
    if (!this.currentMap) {
      const act = this.game.getState().run?.act || 1;
      this.currentMap = this.mapGenerator.generate(act);
      this.renderMap();
    }

    // Update UI
    this.updateUI();

    // Scroll to current position
    if (this.currentMap?.currentNodeId) {
      const node = this.currentMap.nodes.get(this.currentMap.currentNodeId);
      if (node) {
        this.scrollY = -node.y + window.innerHeight / 2;
        this.scrollContainer.position.y = this.scrollY;
      }
    } else {
      // Scroll to bottom (start)
      this.scrollY = -500;
      this.scrollContainer.position.y = this.scrollY;
    }
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

    // Draw connections first (behind nodes)
    for (const node of this.currentMap.nodes.values()) {
      for (const targetId of node.connections) {
        const targetNode = this.currentMap.nodes.get(targetId);
        if (!targetNode) continue;

        const line = new Graphics();
        line.moveTo(node.x + offsetX, node.y + offsetY);
        line.lineTo(targetNode.x + offsetX, targetNode.y + offsetY);
        line.stroke({
          width: 2,
          color: node.visited ? 0x666666 : 0x333344,
          alpha: 0.6,
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

    // Node circle
    const circle = new Graphics();
    circle.circle(0, 0, radius);
    circle.fill({ color: node.visited ? 0x333333 : color });
    circle.stroke({
      width: 3,
      color: node.visited ? 0x555555 : 0xffffff,
      alpha: node.visited ? 0.5 : 1,
    });
    container.addChild(circle);

    // Node icon
    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: radius * 0.8,
      fill: node.visited ? 0x666666 : 0xffffff,
    });

    const icon = new Text({
      text: NODE_ICONS[node.type],
      style: iconStyle,
    });
    icon.anchor.set(0.5);
    container.addChild(icon);

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
    const statsText = this.container.getChildByName('statsText', true) as Text;
    if (statsText) {
      statsText.text = this.getStatsText();
    }

    // Update floor
    const floorText = this.container.getChildByName('floorText', true) as Text;
    if (floorText && state.run) {
      floorText.text = `Floor ${state.run.floor + 1}`;
    }
  }
}
