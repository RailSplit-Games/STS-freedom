/**
 * Lightweight Entity Component System
 * Entities are just IDs, Components are data, Systems are logic
 */

export type EntityId = number;
export type ComponentType = string;

// Base component interface
export interface Component {
  type: ComponentType;
}

// Component definitions
export interface HealthComponent extends Component {
  type: 'health';
  current: number;
  max: number;
}

export interface BlockComponent extends Component {
  type: 'block';
  amount: number;
}

export interface EnergyComponent extends Component {
  type: 'energy';
  current: number;
  max: number;
}

export interface IntentComponent extends Component {
  type: 'intent';
  action: 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';
  value: number;
  multiHit?: number;
}

export interface StatusEffectsComponent extends Component {
  type: 'statusEffects';
  effects: Map<string, number>; // effectId -> stacks
}

export interface PositionComponent extends Component {
  type: 'position';
  x: number;
  y: number;
  slot: number; // Combat slot position
}

export interface RenderComponent extends Component {
  type: 'render';
  sprite: string;
  scale: number;
  tint?: number;
}

export interface EnemyAIComponent extends Component {
  type: 'enemyAI';
  pattern: string[]; // Sequence of action IDs
  patternIndex: number;
  aiType: 'sequential' | 'random' | 'conditional';
}

export interface NameComponent extends Component {
  type: 'name';
  name: string;
  title?: string;
}

export interface CardComponent extends Component {
  type: 'card';
  cardId: string;
  cost: number;
  upgraded: boolean;
}

// Component type map for type safety
export interface ComponentTypeMap {
  health: HealthComponent;
  block: BlockComponent;
  energy: EnergyComponent;
  intent: IntentComponent;
  statusEffects: StatusEffectsComponent;
  position: PositionComponent;
  render: RenderComponent;
  enemyAI: EnemyAIComponent;
  name: NameComponent;
  card: CardComponent;
}

/**
 * Entity manager - stores all entities and their components
 */
export class World {
  private nextEntityId: EntityId = 0;
  private entities: Set<EntityId> = new Set();
  private components: Map<ComponentType, Map<EntityId, Component>> = new Map();
  private entityTags: Map<EntityId, Set<string>> = new Map();
  private tagEntities: Map<string, Set<EntityId>> = new Map();

  /**
   * Create a new entity
   */
  createEntity(): EntityId {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.entityTags.set(id, new Set());
    return id;
  }

  /**
   * Destroy an entity and all its components
   */
  destroyEntity(id: EntityId): void {
    if (!this.entities.has(id)) return;

    // Remove all components
    for (const componentMap of this.components.values()) {
      componentMap.delete(id);
    }

    // Remove tags
    const tags = this.entityTags.get(id);
    if (tags) {
      for (const tag of tags) {
        this.tagEntities.get(tag)?.delete(id);
      }
    }
    this.entityTags.delete(id);

    this.entities.delete(id);
  }

  /**
   * Check if entity exists
   */
  hasEntity(id: EntityId): boolean {
    return this.entities.has(id);
  }

  /**
   * Add a component to an entity
   */
  addComponent<T extends keyof ComponentTypeMap>(
    entityId: EntityId,
    component: ComponentTypeMap[T]
  ): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    const type = component.type;
    if (!this.components.has(type)) {
      this.components.set(type, new Map());
    }
    this.components.get(type)!.set(entityId, component);
  }

  /**
   * Get a component from an entity
   */
  getComponent<T extends keyof ComponentTypeMap>(
    entityId: EntityId,
    type: T
  ): ComponentTypeMap[T] | undefined {
    return this.components.get(type)?.get(entityId) as ComponentTypeMap[T] | undefined;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    return this.components.get(type)?.has(entityId) || false;
  }

  /**
   * Remove a component from an entity
   */
  removeComponent(entityId: EntityId, type: ComponentType): void {
    this.components.get(type)?.delete(entityId);
  }

  /**
   * Get all entities with specific components
   */
  query(...componentTypes: ComponentType[]): EntityId[] {
    const result: EntityId[] = [];

    for (const entityId of this.entities) {
      let hasAll = true;
      for (const type of componentTypes) {
        if (!this.hasComponent(entityId, type)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        result.push(entityId);
      }
    }

    return result;
  }

  /**
   * Add a tag to an entity
   */
  addTag(entityId: EntityId, tag: string): void {
    if (!this.entities.has(entityId)) return;

    this.entityTags.get(entityId)?.add(tag);

    if (!this.tagEntities.has(tag)) {
      this.tagEntities.set(tag, new Set());
    }
    this.tagEntities.get(tag)!.add(entityId);
  }

  /**
   * Remove a tag from an entity
   */
  removeTag(entityId: EntityId, tag: string): void {
    this.entityTags.get(entityId)?.delete(tag);
    this.tagEntities.get(tag)?.delete(entityId);
  }

  /**
   * Check if entity has a tag
   */
  hasTag(entityId: EntityId, tag: string): boolean {
    return this.entityTags.get(entityId)?.has(tag) || false;
  }

  /**
   * Get all entities with a tag
   */
  getEntitiesByTag(tag: string): EntityId[] {
    return Array.from(this.tagEntities.get(tag) || []);
  }

  /**
   * Get all entities
   */
  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.components.clear();
    this.entityTags.clear();
    this.tagEntities.clear();
    this.nextEntityId = 0;
  }

  /**
   * Serialize world state for saving
   */
  serialize(): object {
    const data: any = {
      nextEntityId: this.nextEntityId,
      entities: Array.from(this.entities),
      components: {},
      tags: {},
    };

    for (const [type, entityMap] of this.components) {
      data.components[type] = {};
      for (const [entityId, component] of entityMap) {
        // Handle Map in statusEffects
        if (type === 'statusEffects') {
          const seComp = component as StatusEffectsComponent;
          data.components[type][entityId] = {
            ...seComp,
            effects: Array.from(seComp.effects.entries()),
          };
        } else {
          data.components[type][entityId] = component;
        }
      }
    }

    for (const [entityId, tags] of this.entityTags) {
      data.tags[entityId] = Array.from(tags);
    }

    return data;
  }

  /**
   * Deserialize world state from save data
   */
  deserialize(data: any): void {
    this.clear();

    this.nextEntityId = data.nextEntityId;

    for (const entityId of data.entities) {
      this.entities.add(entityId);
      this.entityTags.set(entityId, new Set());
    }

    for (const [type, entityMap] of Object.entries(data.components)) {
      this.components.set(type, new Map());
      for (const [entityIdStr, component] of Object.entries(entityMap as any)) {
        const entityId = parseInt(entityIdStr);
        // Handle Map in statusEffects
        if (type === 'statusEffects') {
          (component as any).effects = new Map((component as any).effects);
        }
        this.components.get(type)!.set(entityId, component as Component);
      }
    }

    for (const [entityIdStr, tags] of Object.entries(data.tags)) {
      const entityId = parseInt(entityIdStr);
      const tagSet = new Set(tags as string[]);
      this.entityTags.set(entityId, tagSet);
      for (const tag of tagSet) {
        if (!this.tagEntities.has(tag)) {
          this.tagEntities.set(tag, new Set());
        }
        this.tagEntities.get(tag)!.add(entityId);
      }
    }
  }
}

/**
 * Base class for systems
 */
export abstract class System {
  protected world: World;

  constructor(world: World) {
    this.world = world;
  }

  abstract update(deltaTime: number): void;
}
