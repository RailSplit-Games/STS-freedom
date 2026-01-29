import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameManager, Scene } from '../core/GameManager';

/**
 * Game over scene - shown when player dies
 */
export class GameOverScene implements Scene {
  public container: Container;
  private game: GameManager;

  constructor(game: GameManager) {
    this.game = game;
    this.container = new Container();
  }

  async init(): Promise<void> {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x1a0a0a });
    this.container.addChild(bg);
  }

  enter(): void {
    this.render();
  }

  exit(): void {
    // Keep only background
    while (this.container.children.length > 1) {
      this.container.removeChildAt(1);
    }
  }

  update(delta: number): void {}

  private render(): void {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Game over text
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 64,
      fontWeight: 'bold',
      fill: 0x8b0000,
    });
    const title = new Text({ text: 'Game Over', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(centerX, centerY - 100);
    this.container.addChild(title);

    // Stats
    const state = this.game.getState();
    const statsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xcccccc,
    });
    const stats = new Text({
      text: `Floor Reached: ${state.run?.floor || 0}\nGold: ${state.player.gold}`,
      style: statsStyle,
    });
    stats.anchor.set(0.5);
    stats.position.set(centerX, centerY);
    this.container.addChild(stats);

    // Return to menu button
    const button = new Container();
    button.position.set(centerX, centerY + 120);

    const buttonBg = new Graphics();
    buttonBg.roundRect(-120, -30, 240, 60, 10);
    buttonBg.fill({ color: 0x444444 });
    buttonBg.stroke({ width: 2, color: 0x666666 });
    button.addChild(buttonBg);

    const buttonText = new Text({
      text: 'Return to Menu',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 22,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.roundRect(-120, -30, 240, 60, 10);
      buttonBg.fill({ color: 0x555555 });
      buttonBg.stroke({ width: 2, color: 0x888888 });
    });

    button.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.roundRect(-120, -30, 240, 60, 10);
      buttonBg.fill({ color: 0x444444 });
      buttonBg.stroke({ width: 2, color: 0x666666 });
    });

    button.on('pointerdown', () => {
      this.game.store.getState().endRun(false);
    });

    this.container.addChild(button);
  }
}
