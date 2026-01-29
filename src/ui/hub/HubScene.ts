import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameManager, Scene } from '../../core/GameManager';

/**
 * Hub scene - between-run area (Hades House of Hades style)
 */
export class HubScene implements Scene {
  public container: Container;
  private game: GameManager;

  private npcContainer: Container;
  private dialogueContainer: Container;
  private menuContainer: Container;

  constructor(game: GameManager) {
    this.game = game;
    this.container = new Container();
    this.npcContainer = new Container();
    this.dialogueContainer = new Container();
    this.menuContainer = new Container();
  }

  async init(): Promise<void> {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x0d0d1a });
    this.container.addChild(bg);

    // Floor pattern
    const floor = new Graphics();
    floor.rect(0, window.innerHeight * 0.6, window.innerWidth, window.innerHeight * 0.4);
    floor.fill({ color: 0x1a1a2e });
    this.container.addChild(floor);

    this.container.addChild(this.npcContainer);
    this.container.addChild(this.dialogueContainer);
    this.container.addChild(this.menuContainer);

    // Create NPCs
    this.createNPCs();

    // Create menu
    this.createMenu();

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xe0e0e0,
    });

    const title = new Text({ text: 'The Sanctuary', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(window.innerWidth / 2, 30);
    this.container.addChild(title);
  }

  private createNPCs(): void {
    // Create NPC placeholders
    const npcs = [
      { id: 'keeper', name: 'The Keeper', x: 200, y: 450, color: 0x4a4a6a },
      { id: 'smith', name: 'Forge', x: 400, y: 420, color: 0x8b4513 },
      { id: 'scholar', name: 'Sylvia', x: 600, y: 440, color: 0x4169e1 },
      { id: 'trader', name: 'Vex', x: 800, y: 430, color: 0xffd700 },
    ];

    for (const npc of npcs) {
      const npcContainer = this.createNPC(npc);
      this.npcContainer.addChild(npcContainer);
    }
  }

  private createNPC(config: { id: string; name: string; x: number; y: number; color: number }): Container {
    const container = new Container();
    container.position.set(config.x, config.y);

    // NPC body (placeholder)
    const body = new Graphics();
    body.circle(0, 0, 40);
    body.fill({ color: config.color });
    body.stroke({ width: 3, color: 0xffffff, alpha: 0.5 });
    container.addChild(body);

    // Name label
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });
    const nameText = new Text({ text: config.name, style: nameStyle });
    nameText.anchor.set(0.5);
    nameText.position.y = 60;
    container.addChild(nameText);

    // Interactivity
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      body.clear();
      body.circle(0, 0, 45);
      body.fill({ color: config.color });
      body.stroke({ width: 4, color: 0xffffff, alpha: 0.8 });
    });

    container.on('pointerout', () => {
      body.clear();
      body.circle(0, 0, 40);
      body.fill({ color: config.color });
      body.stroke({ width: 3, color: 0xffffff, alpha: 0.5 });
    });

    container.on('pointerdown', () => {
      this.talkToNPC(config.id, config.name);
    });

    return container;
  }

  private talkToNPC(npcId: string, name: string): void {
    this.showDialogue(name, `"Greetings, traveler. Another climb awaits."`);
  }

  private showDialogue(speaker: string, text: string): void {
    this.dialogueContainer.removeChildren();

    // Dialogue box
    const boxWidth = 600;
    const boxHeight = 150;
    const boxX = (window.innerWidth - boxWidth) / 2;
    const boxY = window.innerHeight - boxHeight - 100;

    const box = new Graphics();
    box.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
    box.fill({ color: 0x1a1a2e, alpha: 0.95 });
    box.stroke({ width: 2, color: 0x4a4a6a });
    this.dialogueContainer.addChild(box);

    // Speaker name
    const speakerStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
    });
    const speakerText = new Text({ text: speaker, style: speakerStyle });
    speakerText.position.set(boxX + 20, boxY + 15);
    this.dialogueContainer.addChild(speakerText);

    // Dialogue text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xe0e0e0,
      wordWrap: true,
      wordWrapWidth: boxWidth - 40,
    });
    const dialogueText = new Text({ text, style: textStyle });
    dialogueText.position.set(boxX + 20, boxY + 50);
    this.dialogueContainer.addChild(dialogueText);

    // Close button
    const closeBtn = new Graphics();
    closeBtn.circle(boxX + boxWidth - 25, boxY + 25, 15);
    closeBtn.fill({ color: 0x4a4a6a });
    this.dialogueContainer.addChild(closeBtn);

    const closeStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xffffff,
    });
    const closeText = new Text({ text: '×', style: closeStyle });
    closeText.anchor.set(0.5);
    closeText.position.set(boxX + boxWidth - 25, boxY + 25);
    this.dialogueContainer.addChild(closeText);

    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => {
      this.dialogueContainer.removeChildren();
    });
  }

  private createMenu(): void {
    const menuItems = [
      { label: 'Start Run', action: () => this.game.startNewRun() },
      { label: 'Collection', action: () => console.log('Collection') },
      { label: 'Statistics', action: () => console.log('Stats') },
      { label: 'Settings', action: () => console.log('Settings') },
    ];

    const startY = 150;
    const spacing = 50;

    menuItems.forEach((item, index) => {
      const button = new Container();
      button.position.set(window.innerWidth - 150, startY + index * spacing);

      const bg = new Graphics();
      bg.roundRect(-100, -18, 200, 36, 6);
      bg.fill({ color: 0x333344, alpha: 0.8 });
      bg.stroke({ width: 1, color: 0x4a4a6a });
      button.addChild(bg);

      const textStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xe0e0e0,
      });
      const text = new Text({ text: item.label, style: textStyle });
      text.anchor.set(0.5);
      button.addChild(text);

      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerover', () => {
        bg.clear();
        bg.roundRect(-100, -18, 200, 36, 6);
        bg.fill({ color: 0x444466, alpha: 0.9 });
        bg.stroke({ width: 1, color: 0x6a6a8a });
      });

      button.on('pointerout', () => {
        bg.clear();
        bg.roundRect(-100, -18, 200, 36, 6);
        bg.fill({ color: 0x333344, alpha: 0.8 });
        bg.stroke({ width: 1, color: 0x4a4a6a });
      });

      button.on('pointerdown', item.action);

      this.menuContainer.addChild(button);
    });
  }

  enter(): void {
    // Show any pending dialogue or notifications
  }

  exit(): void {
    this.dialogueContainer.removeChildren();
  }

  update(delta: number): void {
    // Idle animations for NPCs
  }
}
