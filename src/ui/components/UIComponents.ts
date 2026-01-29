import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getPotion, PotionDefinition } from '../../combat/potions/PotionDatabase';
import type { GameManager } from '../../core/GameManager';

/**
 * Shared UI components for use across scenes
 */

// ============================================
// TOOLTIP SYSTEM
// ============================================

let activeTooltip: Container | null = null;

export function showTooltip(
  parent: Container,
  x: number,
  y: number,
  title: string,
  description: string,
  stats?: { label: string; value: string | number }[]
): Container {
  hideTooltip();

  const tooltip = new Container();
  tooltip.label = 'tooltip';
  tooltip.zIndex = 1000;

  const padding = 12;
  const maxWidth = 250;

  // Calculate content
  const titleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold',
    fill: 0xffffff,
    wordWrap: true,
    wordWrapWidth: maxWidth - padding * 2,
  });

  const descStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 13,
    fill: 0xcccccc,
    wordWrap: true,
    wordWrapWidth: maxWidth - padding * 2,
  });

  const statStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 12,
    fill: 0xaaaaaa,
  });

  const titleText = new Text({ text: title, style: titleStyle });
  const descText = new Text({ text: description, style: descStyle });

  let contentHeight = titleText.height + 8 + descText.height;
  let contentWidth = Math.max(titleText.width, descText.width);

  // Stats
  const statTexts: Text[] = [];
  if (stats && stats.length > 0) {
    contentHeight += 12;
    for (const stat of stats) {
      const statText = new Text({
        text: `${stat.label}: ${stat.value}`,
        style: statStyle,
      });
      statTexts.push(statText);
      contentHeight += statText.height + 4;
      contentWidth = Math.max(contentWidth, statText.width);
    }
  }

  const width = Math.min(maxWidth, contentWidth + padding * 2);
  const height = contentHeight + padding * 2;

  // Background
  const bg = new Graphics();
  bg.roundRect(0, 0, width, height, 8);
  bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
  bg.stroke({ width: 2, color: 0x444466 });
  tooltip.addChild(bg);

  // Position text
  titleText.position.set(padding, padding);
  tooltip.addChild(titleText);

  descText.position.set(padding, padding + titleText.height + 8);
  tooltip.addChild(descText);

  let statY = padding + titleText.height + 8 + descText.height + 12;
  for (const statText of statTexts) {
    statText.position.set(padding, statY);
    tooltip.addChild(statText);
    statY += statText.height + 4;
  }

  // Position tooltip (keep on screen)
  let tooltipX = x + 15;
  let tooltipY = y + 15;

  if (tooltipX + width > window.innerWidth - 10) {
    tooltipX = x - width - 15;
  }
  if (tooltipY + height > window.innerHeight - 10) {
    tooltipY = y - height - 15;
  }

  tooltip.position.set(tooltipX, tooltipY);
  parent.addChild(tooltip);
  activeTooltip = tooltip;

  return tooltip;
}

export function hideTooltip(): void {
  if (activeTooltip && activeTooltip.parent) {
    activeTooltip.parent.removeChild(activeTooltip);
  }
  activeTooltip = null;
}

// ============================================
// POTION HOTBAR
// ============================================

export function createPotionHotbar(
  game: GameManager,
  onUsePotion?: (slotIndex: number) => void
): Container {
  const container = new Container();
  container.label = 'potionHotbar';

  const slotCount = 3;
  const slotSize = 45;
  const spacing = 8;
  const totalWidth = slotCount * slotSize + (slotCount - 1) * spacing;

  // Background panel
  const panelPadding = 8;
  const panel = new Graphics();
  panel.roundRect(
    -panelPadding,
    -panelPadding,
    totalWidth + panelPadding * 2,
    slotSize + panelPadding * 2,
    8
  );
  panel.fill({ color: 0x222233, alpha: 0.9 });
  panel.stroke({ width: 2, color: 0x444466 });
  container.addChild(panel);

  const state = game.getState();
  const potions = state.potions || [];

  for (let i = 0; i < slotCount; i++) {
    const slot = createPotionSlot(
      i,
      potions[i] || null,
      slotSize,
      container,
      () => onUsePotion?.(i)
    );
    slot.position.set(i * (slotSize + spacing), 0);
    container.addChild(slot);
  }

  return container;
}

function createPotionSlot(
  index: number,
  potionId: string | null,
  size: number,
  tooltipParent: Container,
  onUse: () => void
): Container {
  const slot = new Container();

  // Slot background
  const bg = new Graphics();
  bg.roundRect(0, 0, size, size, 6);
  bg.fill({ color: 0x333344 });
  bg.stroke({ width: 2, color: 0x555566 });
  slot.addChild(bg);

  // Hotkey number
  const numStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 10,
    fill: 0x888888,
  });
  const numText = new Text({ text: (index + 1).toString(), style: numStyle });
  numText.position.set(4, 2);
  slot.addChild(numText);

  if (potionId) {
    const potion = getPotion(potionId);
    if (potion) {
      // Potion flask
      const flask = new Graphics();

      // Flask body
      flask.roundRect(size / 2 - 10, size / 2 - 8, 20, 20, 4);
      flask.fill({ color: potion.color });

      // Flask neck
      flask.rect(size / 2 - 5, size / 2 - 14, 10, 8);
      flask.fill({ color: 0x888888 });

      // Cork
      flask.roundRect(size / 2 - 4, size / 2 - 18, 8, 5, 2);
      flask.fill({ color: 0x8b4513 });

      slot.addChild(flask);

      // Interactivity
      slot.eventMode = 'static';
      slot.cursor = 'pointer';

      slot.on('pointerover', (e) => {
        bg.clear();
        bg.roundRect(0, 0, size, size, 6);
        bg.fill({ color: 0x444455 });
        bg.stroke({ width: 2, color: potion.color });

        const globalPos = slot.getGlobalPosition();
        showTooltip(
          tooltipParent,
          globalPos.x,
          globalPos.y + size,
          potion.name,
          potion.description,
          [
            { label: 'Rarity', value: potion.rarity },
            { label: 'Hotkey', value: (index + 1).toString() },
          ]
        );
      });

      slot.on('pointerout', () => {
        bg.clear();
        bg.roundRect(0, 0, size, size, 6);
        bg.fill({ color: 0x333344 });
        bg.stroke({ width: 2, color: 0x555566 });
        hideTooltip();
      });

      slot.on('pointerdown', onUse);
    }
  } else {
    // Empty slot
    const emptyStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0x444444,
    });
    const emptyText = new Text({ text: '-', style: emptyStyle });
    emptyText.anchor.set(0.5);
    emptyText.position.set(size / 2, size / 2);
    slot.addChild(emptyText);
  }

  return slot;
}

// ============================================
// GOLD DISPLAY
// ============================================

export function createGoldDisplay(game: GameManager): Container {
  const container = new Container();
  container.label = 'goldDisplay';

  const bg = new Graphics();
  bg.roundRect(0, 0, 100, 36, 6);
  bg.fill({ color: 0x222233, alpha: 0.9 });
  bg.stroke({ width: 2, color: 0xffd700 });
  container.addChild(bg);

  const iconStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 18,
    fill: 0xffd700,
  });
  const icon = new Text({ text: '💰', style: iconStyle });
  icon.position.set(8, 8);
  container.addChild(icon);

  const state = game.getState();
  const goldStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'bold',
    fill: 0xffd700,
  });
  const goldText = new Text({ text: state.player.gold.toString(), style: goldStyle });
  goldText.position.set(35, 9);
  goldText.label = 'goldAmount';
  container.addChild(goldText);

  return container;
}

export function updateGoldDisplay(container: Container, gold: number): void {
  const goldText = container.getChildByLabel('goldAmount', true) as Text;
  if (goldText) {
    goldText.text = gold.toString();
  }
}

// ============================================
// ENTITY STATS TOOLTIP
// ============================================

export interface EntityStats {
  name: string;
  hp: number;
  maxHp: number;
  block?: number;
  strength?: number;
  dexterity?: number;
  statuses?: { name: string; stacks: number }[];
}

export function showEntityTooltip(
  parent: Container,
  x: number,
  y: number,
  stats: EntityStats
): Container {
  const statsList: { label: string; value: string | number }[] = [
    { label: 'HP', value: `${stats.hp}/${stats.maxHp}` },
  ];

  if (stats.block && stats.block > 0) {
    statsList.push({ label: 'Block', value: stats.block });
  }
  if (stats.strength && stats.strength !== 0) {
    statsList.push({ label: 'Strength', value: stats.strength });
  }
  if (stats.dexterity && stats.dexterity !== 0) {
    statsList.push({ label: 'Dexterity', value: stats.dexterity });
  }

  let statusDesc = '';
  if (stats.statuses && stats.statuses.length > 0) {
    statusDesc = '\n\nStatuses:\n' + stats.statuses.map(s => `• ${s.name}: ${s.stacks}`).join('\n');
  }

  return showTooltip(parent, x, y, stats.name, `Current statistics${statusDesc}`, statsList);
}

// ============================================
// DECK VIEWER BUTTON
// ============================================

export function createDeckViewerButton(onClick: () => void): Container {
  const button = new Container();
  button.label = 'deckViewerButton';

  const bg = new Graphics();
  bg.roundRect(0, 0, 80, 80, 8);
  bg.fill({ color: 0x333344 });
  bg.stroke({ width: 2, color: 0x666688 });
  button.addChild(bg);

  // Card stack icon
  const cardStack = new Graphics();
  // Back cards
  cardStack.roundRect(25, 12, 30, 40, 4);
  cardStack.fill({ color: 0x555566 });
  cardStack.roundRect(22, 15, 30, 40, 4);
  cardStack.fill({ color: 0x666677 });
  // Front card
  cardStack.roundRect(19, 18, 30, 40, 4);
  cardStack.fill({ color: 0x4a4a6a });
  cardStack.stroke({ width: 1, color: 0x8888aa });
  button.addChild(cardStack);

  // Label
  const labelStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 11,
    fill: 0xaaaaaa,
  });
  const label = new Text({ text: 'Deck', style: labelStyle });
  label.anchor.set(0.5, 0);
  label.position.set(40, 62);
  button.addChild(label);

  button.eventMode = 'static';
  button.cursor = 'pointer';

  button.on('pointerover', () => {
    bg.clear();
    bg.roundRect(0, 0, 80, 80, 8);
    bg.fill({ color: 0x444455 });
    bg.stroke({ width: 2, color: 0x8888aa });
  });

  button.on('pointerout', () => {
    bg.clear();
    bg.roundRect(0, 0, 80, 80, 8);
    bg.fill({ color: 0x333344 });
    bg.stroke({ width: 2, color: 0x666688 });
  });

  button.on('pointerdown', onClick);

  return button;
}
