import { World, EntityId } from '../../core/ecs/ECS';
import { EventBus, GameEvents } from '../../core/events/EventBus';
import { CardDefinition, CardEffect, TargetType } from './CardTypes';
import { CardDatabase } from './CardDatabase';

/**
 * Resolves card effects during combat
 */
export class CardEffectResolver {
  constructor(
    private world: World,
    private events: EventBus
  ) {}

  /**
   * Execute a card's effects
   */
  resolveCard(
    cardId: string,
    sourceId: EntityId,
    targetId: EntityId | null,
    upgraded: boolean
  ): void {
    const card = CardDatabase.get(cardId);
    if (!card) {
      console.warn(`Card not found: ${cardId}`);
      return;
    }

    const effects = upgraded && card.effectsUpgraded ? card.effectsUpgraded : card.effects;

    for (const effect of effects) {
      this.resolveEffect(effect, sourceId, targetId, card);
    }

    this.events.emit(GameEvents.CARD_PLAYED, {
      cardId,
      sourceId,
      targetId,
      cost: card.cost,
    });
  }

  /**
   * Resolve a single effect
   */
  resolveEffect(
    effect: CardEffect,
    sourceId: EntityId,
    targetId: EntityId | null,
    card: CardDefinition
  ): void {
    const times = effect.times || 1;

    for (let i = 0; i < times; i++) {
      switch (effect.type) {
        case 'damage':
          this.resolveDamage(effect, sourceId, targetId, card.target);
          break;
        case 'damage_all':
          this.resolveDamageAll(effect, sourceId);
          break;
        case 'block':
          this.resolveBlock(effect, sourceId);
          break;
        case 'draw':
          this.resolveDraw(effect, sourceId);
          break;
        case 'energy':
          this.resolveEnergy(effect, sourceId);
          break;
        case 'apply_status':
          this.resolveApplyStatus(effect, sourceId, targetId, card.target);
          break;
        case 'heal':
          this.resolveHeal(effect, sourceId, targetId);
          break;
        case 'add_card_to_discard':
        case 'add_card_to_draw':
        case 'add_card_to_hand':
          this.resolveAddCard(effect);
          break;
        default:
          console.warn(`Unhandled effect type: ${effect.type}`);
      }
    }
  }

  /**
   * Deal damage to a single target
   */
  private resolveDamage(
    effect: CardEffect,
    sourceId: EntityId,
    targetId: EntityId | null,
    cardTarget: TargetType
  ): void {
    // Handle self-damage (negative value)
    if (effect.value < 0 || effect.target === 'self') {
      const actualTarget = sourceId;
      const damage = Math.abs(effect.value);
      this.applyDamage(sourceId, actualTarget, damage, false);
      return;
    }

    // Determine actual target
    let actualTarget = targetId;

    if (cardTarget === 'random_enemy') {
      const enemies = this.world.getEntitiesByTag('enemy');
      if (enemies.length > 0) {
        actualTarget = enemies[Math.floor(Math.random() * enemies.length)];
      }
    }

    if (actualTarget === null) {
      console.warn('No target for damage effect');
      return;
    }

    this.applyDamage(sourceId, actualTarget, effect.value, true);
  }

  /**
   * Deal damage to all enemies
   */
  private resolveDamageAll(effect: CardEffect, sourceId: EntityId): void {
    const enemies = this.world.getEntitiesByTag('enemy');
    for (const enemyId of enemies) {
      this.applyDamage(sourceId, enemyId, effect.value, true);
    }
  }

  /**
   * Apply damage with modifiers
   */
  private applyDamage(
    sourceId: EntityId,
    targetId: EntityId,
    baseDamage: number,
    isAttack: boolean
  ): void {
    let damage = baseDamage;

    // Apply strength if it's an attack
    if (isAttack) {
      const sourceStatus = this.world.getComponent(sourceId, 'statusEffects');
      if (sourceStatus) {
        const strength = sourceStatus.effects.get('strength') || 0;
        damage += strength;
      }

      // Check for weak debuff
      if (sourceStatus?.effects.get('weak')) {
        damage = Math.floor(damage * 0.75);
      }
    }

    // Check target for vulnerable
    const targetStatus = this.world.getComponent(targetId, 'statusEffects');
    if (isAttack && targetStatus?.effects.get('vulnerable')) {
      damage = Math.floor(damage * 1.5);
    }

    // Check target for intangible
    if (targetStatus?.effects.get('intangible')) {
      damage = 1;
    }

    // Apply block first
    let blocked = 0;
    const targetBlock = this.world.getComponent(targetId, 'block');
    if (targetBlock && targetBlock.amount > 0) {
      blocked = Math.min(targetBlock.amount, damage);
      targetBlock.amount -= blocked;
      damage -= blocked;
    }

    // Apply remaining damage to health
    if (damage > 0) {
      const targetHealth = this.world.getComponent(targetId, 'health');
      if (targetHealth) {
        targetHealth.current = Math.max(0, targetHealth.current - damage);
      }
    }

    this.events.emit(GameEvents.DAMAGE, {
      sourceId,
      targetId,
      amount: baseDamage,
      blocked,
      type: isAttack ? 'attack' : 'effect',
    });

    // Check for thorns
    if (isAttack && targetStatus?.effects.get('thorns')) {
      const thornsDamage = targetStatus.effects.get('thorns')!;
      this.applyDamage(targetId, sourceId, thornsDamage, false);
    }
  }

  /**
   * Gain block
   */
  private resolveBlock(effect: CardEffect, sourceId: EntityId): void {
    let blockAmount = effect.value;

    // Apply dexterity
    const sourceStatus = this.world.getComponent(sourceId, 'statusEffects');
    if (sourceStatus) {
      const dexterity = sourceStatus.effects.get('dexterity') || 0;
      blockAmount += dexterity;
    }

    // Check for frail
    if (sourceStatus?.effects.get('frail')) {
      blockAmount = Math.floor(blockAmount * 0.75);
    }

    const block = this.world.getComponent(sourceId, 'block');
    if (block) {
      block.amount += Math.max(0, blockAmount);
    }

    this.events.emit(GameEvents.BLOCK_GAINED, {
      entityId: sourceId,
      amount: blockAmount,
    });
  }

  /**
   * Draw cards
   */
  private resolveDraw(effect: CardEffect, sourceId: EntityId): void {
    // Check for no_draw status
    const sourceStatus = this.world.getComponent(sourceId, 'statusEffects');
    if (sourceStatus?.effects.get('no_draw')) {
      return;
    }

    this.events.emit(GameEvents.CARD_DRAWN, {
      entityId: sourceId,
      count: effect.value,
    });
  }

  /**
   * Gain energy
   */
  private resolveEnergy(effect: CardEffect, sourceId: EntityId): void {
    const energy = this.world.getComponent(sourceId, 'energy');
    if (energy) {
      energy.current += effect.value;
    }

    this.events.emit(GameEvents.ENERGY_CHANGED, {
      entityId: sourceId,
      change: effect.value,
    });
  }

  /**
   * Apply a status effect
   */
  private resolveApplyStatus(
    effect: CardEffect,
    sourceId: EntityId,
    targetId: EntityId | null,
    cardTarget: TargetType
  ): void {
    if (!effect.statusId) return;

    const targets: EntityId[] = [];

    if (effect.target === 'all_enemies' || cardTarget === 'all_enemies') {
      targets.push(...this.world.getEntitiesByTag('enemy'));
    } else if (effect.target === 'self' || cardTarget === 'self') {
      targets.push(sourceId);
    } else if (targetId !== null) {
      targets.push(targetId);
    }

    for (const target of targets) {
      // Check for artifact (negates debuffs)
      const statusComponent = this.world.getComponent(target, 'statusEffects');
      if (!statusComponent) continue;

      const isDebuff = ['vulnerable', 'weak', 'frail', 'poison'].includes(effect.statusId);
      if (isDebuff && statusComponent.effects.get('artifact')) {
        const artifact = statusComponent.effects.get('artifact')!;
        if (artifact > 0) {
          statusComponent.effects.set('artifact', artifact - 1);
          this.events.emit(GameEvents.STATUS_TRIGGERED, {
            targetId: target,
            statusId: 'artifact',
          });
          continue;
        }
      }

      // Apply the status
      const current = statusComponent.effects.get(effect.statusId) || 0;
      statusComponent.effects.set(effect.statusId, current + effect.value);

      this.events.emit(GameEvents.STATUS_APPLIED, {
        targetId: target,
        statusId: effect.statusId,
        stacks: effect.value,
      });
    }
  }

  /**
   * Heal HP
   */
  private resolveHeal(
    effect: CardEffect,
    sourceId: EntityId,
    targetId: EntityId | null
  ): void {
    const target = effect.target === 'self' ? sourceId : targetId;
    if (target === null) return;

    const health = this.world.getComponent(target, 'health');
    if (health) {
      health.current = Math.min(health.max, health.current + effect.value);
    }

    this.events.emit(GameEvents.HEAL, {
      targetId: target,
      amount: effect.value,
      source: 'card',
    });
  }

  /**
   * Add card to a pile
   */
  private resolveAddCard(effect: CardEffect): void {
    if (!effect.cardId) return;

    // This is handled by the combat state machine
    // Emit event for it to handle
    this.events.emit('combat:add_card', {
      cardId: effect.cardId,
      destination: effect.type.replace('add_card_to_', ''),
    });
  }
}
