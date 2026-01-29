import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameManager, Scene } from '../core/GameManager';

/**
 * Main menu scene
 */
export class MainMenuScene implements Scene {
  public container: Container;
  private game: GameManager;
  private buttons: Map<string, Container> = new Map();

  constructor(game: GameManager) {
    this.game = game;
    this.container = new Container();
  }

  async init(): Promise<void> {
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 64,
      fontWeight: 'bold',
      fill: 0xe0e0e0,
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        distance: 4,
      },
    });

    const title = new Text({ text: 'STS FREEDOM', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(window.innerWidth / 2, 150);
    this.container.addChild(title);

    // Subtitle
    const subtitleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0x888888,
    });

    const subtitle = new Text({ text: 'A Roguelike Deckbuilder', style: subtitleStyle });
    subtitle.anchor.set(0.5);
    subtitle.position.set(window.innerWidth / 2, 220);
    this.container.addChild(subtitle);

    // Menu buttons
    const buttonY = 350;
    const buttonSpacing = 80;

    this.createButton('New Run', buttonY, () => {
      this.game.startNewRun();
    });

    this.createButton('Continue', buttonY + buttonSpacing, () => {
      // Load saved run
      console.log('Load game - not implemented yet');
    });

    this.createButton('Options', buttonY + buttonSpacing * 2, () => {
      console.log('Options - not implemented yet');
    });

    // Version text
    const versionStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x666666,
    });

    const version = new Text({ text: 'v0.1.0 - Development Build', style: versionStyle });
    version.anchor.set(0.5, 1);
    version.position.set(window.innerWidth / 2, window.innerHeight - 20);
    this.container.addChild(version);
  }

  private createButton(label: string, y: number, onClick: () => void): void {
    const buttonContainer = new Container();
    buttonContainer.position.set(window.innerWidth / 2, y);

    // Button background
    const bg = new Graphics();
    bg.roundRect(-150, -25, 300, 50, 8);
    bg.fill({ color: 0x333344 });
    bg.stroke({ width: 2, color: 0x4a4a6a });
    buttonContainer.addChild(bg);

    // Button text
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xe0e0e0,
    });

    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5);
    buttonContainer.addChild(text);

    // Interactivity
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    buttonContainer.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-150, -25, 300, 50, 8);
      bg.fill({ color: 0x444466 });
      bg.stroke({ width: 2, color: 0x6a6a8a });
    });

    buttonContainer.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-150, -25, 300, 50, 8);
      bg.fill({ color: 0x333344 });
      bg.stroke({ width: 2, color: 0x4a4a6a });
    });

    buttonContainer.on('pointerdown', onClick);

    this.container.addChild(buttonContainer);
    this.buttons.set(label, buttonContainer);
  }

  enter(): void {
    // Reset positions on enter (for resize handling)
    const centerX = window.innerWidth / 2;
    const title = this.container.getChildAt(0) as Text;
    title.position.x = centerX;

    const subtitle = this.container.getChildAt(1) as Text;
    subtitle.position.x = centerX;

    for (const button of this.buttons.values()) {
      button.position.x = centerX;
    }
  }

  exit(): void {
    // Cleanup if needed
  }

  update(delta: number): void {
    // Animate title or background if desired
  }
}
