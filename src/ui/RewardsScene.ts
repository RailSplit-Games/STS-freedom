import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameManager, Scene } from '../core/GameManager';
import { CardDatabase, getAllCards, getCard } from '../combat/cards/CardDatabase';
import { getRandomPotion, getPotion } from '../combat/potions/PotionDatabase';
import { createPotionHotbar } from './components/UIComponents';

interface Reward {
  id: string;
  label: string;
  color: number;
  onClaim: (index: number) => boolean; // Returns true if should be removed immediately
}

/**
 * Post-combat rewards scene
 */
export class RewardsScene implements Scene {
  public container: Container;
  private game: GameManager;
  private rewardsContainer: Container;
  private rewardsList: Container;
  private rewards: Reward[] = [];
  private rewardButtons: Container[] = [];
  private panelStartY = 130;
  private goldAmount = 0;
  private goldCollected = false;
  private pendingCardRewardIndex: number = -1;

  constructor(game: GameManager) {
    this.game = game;
    this.container = new Container();
    this.rewardsContainer = new Container();
    this.rewardsList = new Container();
  }

  async init(): Promise<void> {
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x1a1a2e });
    this.container.addChild(bg);

    this.container.addChild(this.rewardsContainer);
  }

  enter(): void {
    this.rewardsContainer.removeChildren();
    this.rewardsList.removeChildren();
    this.rewards = [];
    this.rewardButtons = [];
    this.goldCollected = false;

    // Calculate gold reward
    this.goldAmount = 15 + Math.floor(this.game.rng.getStream('rewards').random() * 20);

    this.renderRewards();
  }

  exit(): void {
    this.rewardsContainer.removeChildren();
  }

  update(delta: number): void {
    // Animations handled via setTimeout
  }

  private renderRewards(): void {
    const centerX = window.innerWidth / 2;

    // Gold counter (top right)
    this.renderGoldCounter();

    // Potion hotbar (bottom of screen)
    this.renderPotionHotbar();

    // Victory text
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xffd700,
    });
    const title = new Text({ text: 'Victory!', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(centerX, 50);
    this.rewardsContainer.addChild(title);

    // Build rewards list
    this.buildRewardsList();

    // Rewards panel background
    const panelWidth = 400;
    const panelHeight = 60 + this.rewards.length * 60 + 80;
    const panel = new Graphics();
    panel.roundRect(centerX - panelWidth / 2, this.panelStartY, panelWidth, panelHeight, 12);
    panel.fill({ color: 0x222233, alpha: 0.95 });
    panel.stroke({ width: 3, color: 0x444466 });
    panel.label = 'rewardsPanel';
    this.rewardsContainer.addChild(panel);

    // Rewards header
    const headerStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const header = new Text({ text: 'Choose Your Rewards', style: headerStyle });
    header.anchor.set(0.5, 0);
    header.position.set(centerX, this.panelStartY + 15);
    this.rewardsContainer.addChild(header);

    // Rewards list container
    this.rewardsList.position.set(centerX, this.panelStartY + 55);
    this.rewardsContainer.addChild(this.rewardsList);

    // Render reward buttons
    this.renderRewardButtons();

    // Proceed button
    this.createProceedButton(centerX, this.panelStartY + panelHeight - 45);
  }

  private buildRewardsList(): void {
    this.rewards = [];

    // Gold reward
    this.rewards.push({
      id: 'gold',
      label: `Gold: +${this.goldAmount}`,
      color: 0xffd700,
      onClaim: (_index: number) => {
        this.collectGold();
        return true;
      },
    });

    // Card reward
    this.rewards.push({
      id: 'card',
      label: 'Add Card to Deck',
      color: 0x4a90d9,
      onClaim: (index: number) => {
        // Store index for removal after card is chosen
        this.pendingCardRewardIndex = index;
        // Animate button fading during delay
        const button = this.rewardButtons[index];
        if (button) {
          button.eventMode = 'none';
          this.animateButtonFade(button, () => {
            this.showCardChoices();
          });
        }
        return false; // Don't remove via normal path - handled by animation
      },
    });

    // Potion reward
    const rngPotion = this.game.rng.getStream('rewards');
    const randomPotion = getRandomPotion(rngPotion);
    this.rewards.push({
      id: 'potion',
      label: `Potion: ${randomPotion.name}`,
      color: randomPotion.color,
      onClaim: (_index: number) => {
        const added = this.game.store.getState().addPotion(randomPotion.id);
        if (!added) {
          this.showMessage('Potion slots full!');
          return false;
        }
        this.refreshPotionHotbar();
        return true;
      },
    });
  }

  private renderRewardButtons(): void {
    this.rewardsList.removeChildren();
    this.rewardButtons = [];

    this.rewards.forEach((reward, index) => {
      const button = this.createRewardButton(reward, index);
      button.position.set(0, index * 60);
      this.rewardsList.addChild(button);
      this.rewardButtons.push(button);
    });
  }

  private createRewardButton(reward: Reward, index: number): Container {
    const button = new Container();
    button.label = `reward_${reward.id}`;

    const bg = new Graphics();
    bg.roundRect(-175, -22, 350, 44, 8);
    bg.fill({ color: 0x333344 });
    bg.stroke({ width: 2, color: reward.color });
    button.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
    });
    const label = new Text({ text: reward.label, style: textStyle });
    label.anchor.set(0.5);
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-175, -22, 350, 44, 8);
      bg.fill({ color: 0x444455 });
      bg.stroke({ width: 2, color: reward.color });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-175, -22, 350, 44, 8);
      bg.fill({ color: 0x333344 });
      bg.stroke({ width: 2, color: reward.color });
    });

    button.on('pointerdown', () => {
      const success = reward.onClaim(index);
      if (success) {
        this.removeReward(index);
      }
    });

    return button;
  }

  private removeReward(index: number): void {
    // Guard against invalid index
    if (index < 0 || index >= this.rewardButtons.length) return;

    // Get button before modifying arrays
    const removedButton = this.rewardButtons[index];
    if (!removedButton) return;

    // Disable the button immediately to prevent double-clicks
    removedButton.eventMode = 'none';

    // Remove from data arrays
    this.rewards.splice(index, 1);
    this.rewardButtons.splice(index, 1);

    // Fade out the removed button
    const fadeOut = () => {
      if (!removedButton || removedButton.alpha === undefined) return;
      removedButton.alpha -= 0.15;
      if (removedButton.alpha > 0) {
        setTimeout(fadeOut, 20);
      } else {
        if (removedButton.parent) {
          removedButton.parent.removeChild(removedButton);
        }
      }
    };
    fadeOut();

    // Animate remaining buttons moving up
    this.rewardButtons.forEach((button, i) => {
      const targetY = i * 60;
      const animateUp = () => {
        const diff = targetY - button.position.y;
        if (Math.abs(diff) > 1) {
          button.position.y += diff * 0.2;
          setTimeout(animateUp, 16);
        } else {
          button.position.y = targetY;
        }
      };
      animateUp();
    });

    // Resize panel
    this.resizePanel();
  }

  private resizePanel(): void {
    const centerX = window.innerWidth / 2;
    const panelWidth = 400;
    const panelHeight = 60 + this.rewards.length * 60 + 80;

    const oldPanel = this.rewardsContainer.getChildByLabel('rewardsPanel') as Graphics;
    if (oldPanel) {
      oldPanel.clear();
      oldPanel.roundRect(centerX - panelWidth / 2, this.panelStartY, panelWidth, panelHeight, 12);
      oldPanel.fill({ color: 0x222233, alpha: 0.95 });
      oldPanel.stroke({ width: 3, color: 0x444466 });
    }

    // Move proceed button
    const proceedButton = this.rewardsContainer.getChildByLabel('proceedButton');
    if (proceedButton) {
      const targetY = this.panelStartY + panelHeight - 45;
      const animateButton = () => {
        const diff = targetY - proceedButton.position.y;
        if (Math.abs(diff) > 1) {
          proceedButton.position.y += diff * 0.2;
          setTimeout(animateButton, 16);
        } else {
          proceedButton.position.y = targetY;
        }
      };
      animateButton();
    }
  }

  private createProceedButton(x: number, y: number): void {
    const button = new Container();
    button.position.set(x, y);
    button.label = 'proceedButton';

    const bg = new Graphics();
    bg.roundRect(-100, -25, 200, 50, 10);
    bg.fill({ color: 0x228b22 });
    bg.stroke({ width: 3, color: 0x44aa44 });
    button.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const label = new Text({ text: 'Proceed', style: textStyle });
    label.anchor.set(0.5);
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-100, -25, 200, 50, 10);
      bg.fill({ color: 0x2a9d2a });
      bg.stroke({ width: 3, color: 0x55bb55 });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-100, -25, 200, 50, 10);
      bg.fill({ color: 0x228b22 });
      bg.stroke({ width: 3, color: 0x44aa44 });
    });

    button.on('pointerdown', () => {
      // Auto-collect gold if not already collected
      this.collectGold();

      // Increment floor and return to map
      const state = this.game.getState();
      if (state.run) {
        this.game.store.setState({
          run: { ...state.run, floor: state.run.floor + 1 },
        });
      }
      this.game.store.getState().setPhase('map');
    });

    this.rewardsContainer.addChild(button);
  }

  private showCardChoices(): void {
    const allCards = getAllCards();
    const rng = this.game.rng.getStream('rewards');
    const choices: string[] = [];

    const availableCards = allCards.filter(c =>
      !['strike', 'defend', 'bash'].includes(c.id) &&
      c.rarity !== 'special' &&
      c.type !== 'status' &&
      c.type !== 'curse'
    );
    for (let i = 0; i < 3 && availableCards.length > 0; i++) {
      const index = Math.floor(rng.random() * availableCards.length);
      choices.push(availableCards[index].id);
      availableCards.splice(index, 1);
    }

    const overlay = new Container();
    overlay.label = 'cardChoiceOverlay';

    const bg = new Graphics();
    bg.rect(0, 0, window.innerWidth, window.innerHeight);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    bg.eventMode = 'static';
    overlay.addChild(bg);

    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const title = new Text({ text: 'Choose a Card', style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(window.innerWidth / 2, 100);
    overlay.addChild(title);

    const cardWidth = 150;
    const cardSpacing = 50;
    const totalWidth = choices.length * cardWidth + (choices.length - 1) * cardSpacing;
    const startX = (window.innerWidth - totalWidth) / 2 + cardWidth / 2;

    choices.forEach((cardId, index) => {
      const cardDef = getCard(cardId);
      if (!cardDef) return;

      const card = this.createCardDisplay(cardDef, startX + index * (cardWidth + cardSpacing), 350);

      card.on('pointerdown', () => {
        this.game.store.getState().addCardToDeck(cardId);
        this.rewardsContainer.removeChild(overlay);
        // Remove the card reward from the list
        if (this.pendingCardRewardIndex >= 0) {
          this.removeReward(this.pendingCardRewardIndex);
          this.pendingCardRewardIndex = -1;
        }
      });

      overlay.addChild(card);
    });

    const skipButton = new Container();
    skipButton.position.set(window.innerWidth / 2, window.innerHeight - 100);

    const skipBg = new Graphics();
    skipBg.roundRect(-60, -20, 120, 40, 6);
    skipBg.fill({ color: 0x666666 });
    skipButton.addChild(skipBg);

    const skipText = new Text({
      text: 'Skip',
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fill: 0xffffff }),
    });
    skipText.anchor.set(0.5);
    skipButton.addChild(skipText);

    skipButton.eventMode = 'static';
    skipButton.cursor = 'pointer';
    skipButton.on('pointerdown', () => {
      this.rewardsContainer.removeChild(overlay);
      // Remove the card reward even if skipped
      if (this.pendingCardRewardIndex >= 0) {
        this.removeReward(this.pendingCardRewardIndex);
        this.pendingCardRewardIndex = -1;
      }
    });

    overlay.addChild(skipButton);
    this.rewardsContainer.addChild(overlay);
  }

  private renderGoldCounter(): void {
    const container = new Container();
    container.position.set(window.innerWidth - 150, 30);
    container.label = 'goldCounter';

    const bg = new Graphics();
    bg.roundRect(-60, -20, 120, 40, 8);
    bg.fill({ color: 0x222233, alpha: 0.9 });
    bg.stroke({ width: 2, color: 0xffd700 });
    container.addChild(bg);

    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xffd700,
    });
    const icon = new Text({ text: '💰', style: iconStyle });
    icon.anchor.set(0.5);
    icon.position.set(-30, 0);
    container.addChild(icon);

    const state = this.game.getState();
    const goldStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffd700,
    });
    const goldText = new Text({ text: state.player.gold.toString(), style: goldStyle });
    goldText.anchor.set(0, 0.5);
    goldText.position.set(-10, 0);
    goldText.label = 'goldAmount';
    container.addChild(goldText);

    this.rewardsContainer.addChild(container);
  }

  private renderPotionHotbar(): void {
    const potionHotbar = createPotionHotbar(this.game, () => {
      this.showMessage('Use potions from the map or combat!');
    });
    potionHotbar.position.set(window.innerWidth / 2 - 75, window.innerHeight - 80);
    potionHotbar.label = 'potionHotbar';
    this.rewardsContainer.addChild(potionHotbar);
  }

  private refreshPotionHotbar(): void {
    const oldHotbar = this.rewardsContainer.getChildByLabel('potionHotbar');
    if (oldHotbar) {
      this.rewardsContainer.removeChild(oldHotbar);
    }
    this.renderPotionHotbar();
  }

  private collectGold(): void {
    if (this.goldCollected) return;
    this.goldCollected = true;
    this.game.store.getState().updatePlayer({
      gold: this.game.getState().player.gold + this.goldAmount,
    });
    this.updateGoldDisplay();
  }

  private animateButtonFade(button: Container, onComplete: () => void): void {
    const startTime = Date.now();
    const duration = 250; // 0.25 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      button.alpha = 1 - progress;
      button.scale.set(1 - progress * 0.1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    animate();
  }

  private updateGoldDisplay(): void {
    const goldCounter = this.rewardsContainer.getChildByLabel('goldCounter', true) as Container;
    if (goldCounter) {
      const goldText = goldCounter.getChildByLabel('goldAmount', true) as Text;
      if (goldText) {
        goldText.text = this.game.getState().player.gold.toString();
      }
    }
  }

  private showMessage(text: string): void {
    const message = new Container();
    message.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const bg = new Graphics();
    bg.roundRect(-150, -30, 300, 60, 10);
    bg.fill({ color: 0x222233, alpha: 0.95 });
    bg.stroke({ width: 2, color: 0xff6666 });
    message.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xff6666,
    });
    const label = new Text({ text, style: textStyle });
    label.anchor.set(0.5);
    message.addChild(label);

    this.rewardsContainer.addChild(message);

    setTimeout(() => {
      if (message.parent) {
        message.parent.removeChild(message);
      }
    }, 2000);
  }

  private createCardDisplay(cardDef: NonNullable<ReturnType<typeof CardDatabase.get>>, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);

    const width = 150;
    const height = 200;

    const bgColor = cardDef.type === 'attack' ? 0x8b4513 :
                    cardDef.type === 'skill' ? 0x4169e1 :
                    cardDef.type === 'power' ? 0x9370db : 0x444444;

    const bg = new Graphics();
    bg.roundRect(-width / 2, -height / 2, width, height, 10);
    bg.fill({ color: bgColor });
    bg.stroke({ width: 3, color: 0xffffff });
    container.addChild(bg);

    const costOrb = new Graphics();
    costOrb.circle(-width / 2 + 20, -height / 2 + 20, 18);
    costOrb.fill({ color: 0xffd700 });
    container.addChild(costOrb);

    const costText = new Text({
      text: cardDef.cost.toString(),
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0x000000 }),
    });
    costText.anchor.set(0.5);
    costText.position.set(-width / 2 + 20, -height / 2 + 20);
    container.addChild(costText);

    const nameText = new Text({
      text: cardDef.name,
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: width - 20,
      }),
    });
    nameText.anchor.set(0.5);
    nameText.position.y = -height / 2 + 60;
    container.addChild(nameText);

    const descText = new Text({
      text: cardDef.description,
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xe0e0e0,
        wordWrap: true,
        wordWrapWidth: width - 20,
      }),
    });
    descText.anchor.set(0.5, 0);
    descText.position.y = 10;
    container.addChild(descText);

    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      container.scale.set(1.1);
    });

    container.on('pointerout', () => {
      container.scale.set(1);
    });

    return container;
  }
}
