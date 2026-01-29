import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getCard } from '../../combat/cards/CardDatabase';
import type { GameManager } from '../../core/GameManager';

/**
 * Full-screen deck viewer overlay
 */
export function createDeckViewer(game: GameManager, onClose: () => void): Container {
  const overlay = new Container();
  overlay.label = 'deckViewer';

  // Semi-transparent background
  const bg = new Graphics();
  bg.rect(0, 0, window.innerWidth, window.innerHeight);
  bg.fill({ color: 0x000000, alpha: 0.9 });
  bg.eventMode = 'static';
  overlay.addChild(bg);

  // Title
  const titleStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 32,
    fontWeight: 'bold',
    fill: 0xffffff,
  });
  const title = new Text({ text: 'Your Deck', style: titleStyle });
  title.anchor.set(0.5, 0);
  title.position.set(window.innerWidth / 2, 30);
  overlay.addChild(title);

  // Deck count
  const state = game.getState();
  const deck = state.deck;
  const countStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 18,
    fill: 0xaaaaaa,
  });
  const countText = new Text({ text: `${deck.length} cards`, style: countStyle });
  countText.anchor.set(0.5, 0);
  countText.position.set(window.innerWidth / 2, 70);
  overlay.addChild(countText);

  // Cards container with scroll
  const cardsContainer = new Container();
  cardsContainer.position.set(0, 110);
  overlay.addChild(cardsContainer);

  // Card grid
  const cardWidth = 130;
  const cardHeight = 180;
  const padding = 15;
  const cardsPerRow = Math.floor((window.innerWidth - 100) / (cardWidth + padding));
  const startX = (window.innerWidth - (cardsPerRow * (cardWidth + padding) - padding)) / 2;

  // Count cards by ID for stacking display
  const cardCounts = new Map<string, number>();
  for (const cardId of deck) {
    cardCounts.set(cardId, (cardCounts.get(cardId) || 0) + 1);
  }

  // Display unique cards with counts
  const uniqueCards = Array.from(cardCounts.keys());
  uniqueCards.forEach((cardId, index) => {
    const cardDef = getCard(cardId);
    if (!cardDef) return;

    const count = cardCounts.get(cardId) || 1;
    const col = index % cardsPerRow;
    const row = Math.floor(index / cardsPerRow);

    const card = createCardDisplay(cardDef, count);
    card.position.set(
      startX + col * (cardWidth + padding),
      row * (cardHeight + padding)
    );
    cardsContainer.addChild(card);
  });

  // Close button
  const closeButton = new Container();
  closeButton.position.set(window.innerWidth - 60, 30);

  const closeBg = new Graphics();
  closeBg.circle(0, 0, 25);
  closeBg.fill({ color: 0x444444 });
  closeBg.stroke({ width: 2, color: 0x666666 });
  closeButton.addChild(closeBg);

  const closeStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0xffffff,
  });
  const closeX = new Text({ text: '×', style: closeStyle });
  closeX.anchor.set(0.5);
  closeButton.addChild(closeX);

  closeButton.eventMode = 'static';
  closeButton.cursor = 'pointer';

  closeButton.on('pointerover', () => {
    closeBg.clear();
    closeBg.circle(0, 0, 25);
    closeBg.fill({ color: 0x666666 });
    closeBg.stroke({ width: 2, color: 0x888888 });
  });

  closeButton.on('pointerout', () => {
    closeBg.clear();
    closeBg.circle(0, 0, 25);
    closeBg.fill({ color: 0x444444 });
    closeBg.stroke({ width: 2, color: 0x666666 });
  });

  closeButton.on('pointerdown', onClose);

  overlay.addChild(closeButton);

  // Scroll handling
  let scrollY = 0;
  const maxScroll = Math.max(0, Math.ceil(uniqueCards.length / cardsPerRow) * (cardHeight + padding) - (window.innerHeight - 150));

  bg.on('wheel', (e: WheelEvent) => {
    scrollY = Math.max(0, Math.min(maxScroll, scrollY + e.deltaY * 0.5));
    cardsContainer.position.y = 110 - scrollY;
  });

  return overlay;
}

function createCardDisplay(
  cardDef: NonNullable<ReturnType<typeof getCard>>,
  count: number
): Container {
  const container = new Container();
  const width = 130;
  const height = 180;

  const bgColor =
    cardDef.type === 'attack' ? 0x8b4513 :
    cardDef.type === 'skill' ? 0x4169e1 :
    cardDef.type === 'power' ? 0x9370db : 0x444444;

  // Card background
  const bg = new Graphics();
  bg.roundRect(0, 0, width, height, 8);
  bg.fill({ color: bgColor });
  bg.stroke({ width: 2, color: 0xffffff });
  container.addChild(bg);

  // Cost orb
  const costOrb = new Graphics();
  costOrb.circle(18, 18, 16);
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
  costText.position.set(18, 18);
  container.addChild(costText);

  // Card name
  const nameStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 13,
    fontWeight: 'bold',
    fill: 0xffffff,
    wordWrap: true,
    wordWrapWidth: width - 16,
  });
  const nameText = new Text({ text: cardDef.name, style: nameStyle });
  nameText.anchor.set(0.5, 0);
  nameText.position.set(width / 2, 45);
  container.addChild(nameText);

  // Card type
  const typeStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 10,
    fill: 0xcccccc,
  });
  const typeText = new Text({
    text: cardDef.type.charAt(0).toUpperCase() + cardDef.type.slice(1),
    style: typeStyle,
  });
  typeText.anchor.set(0.5, 0);
  typeText.position.set(width / 2, 70);
  container.addChild(typeText);

  // Description
  const descStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 11,
    fill: 0xe0e0e0,
    wordWrap: true,
    wordWrapWidth: width - 16,
  });
  const descText = new Text({ text: cardDef.description, style: descStyle });
  descText.anchor.set(0.5, 0);
  descText.position.set(width / 2, 90);
  container.addChild(descText);

  // Count badge (if more than 1)
  if (count > 1) {
    const badge = new Graphics();
    badge.circle(width - 15, 15, 14);
    badge.fill({ color: 0xff4444 });
    badge.stroke({ width: 2, color: 0xffffff });
    container.addChild(badge);

    const badgeStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const badgeText = new Text({ text: `×${count}`, style: badgeStyle });
    badgeText.anchor.set(0.5);
    badgeText.position.set(width - 15, 15);
    container.addChild(badgeText);
  }

  // Rarity indicator
  const rarityColors: Record<string, number> = {
    starter: 0x888888,
    common: 0xffffff,
    uncommon: 0x4488ff,
    rare: 0xffd700,
    special: 0x9370db,
  };
  const rarityBar = new Graphics();
  rarityBar.roundRect(10, height - 15, width - 20, 5, 2);
  rarityBar.fill({ color: rarityColors[cardDef.rarity] || 0x888888 });
  container.addChild(rarityBar);

  return container;
}
