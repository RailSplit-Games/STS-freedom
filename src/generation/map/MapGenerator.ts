import { SeededRNG } from '../../core/rng/SeededRNG';

export type NodeType =
  | 'monster'
  | 'elite'
  | 'rest'
  | 'merchant'
  | 'treasure'
  | 'event'
  | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  column: number;
  type: NodeType;
  connections: string[]; // Node IDs this connects to
  visited: boolean;
  x: number; // Screen position
  y: number;
}

export interface GameMap {
  nodes: Map<string, MapNode>;
  floors: number;
  columns: number;
  currentNodeId: string | null;
  act: number;
}

/**
 * Slay the Spire-style map generator
 * Creates a branching path map with weighted room types
 */
export class MapGenerator {
  private rng: SeededRNG;

  // Room type weights (StS-inspired)
  private readonly WEIGHTS: Record<NodeType, number> = {
    monster: 53,
    event: 22,
    merchant: 11,
    elite: 8,
    rest: 6,
    treasure: 0, // Assigned by floor
    boss: 0, // Assigned by floor
  };

  // Configuration - simpler map
  private readonly FLOORS = 15;
  private readonly COLUMNS = 4; // Reduced from 7 for simpler paths
  private readonly MIN_PATHS = 3; // Reduced from 6
  private readonly MAX_WIDTH_JUMP = 1; // Max columns a path can move

  constructor(rng: SeededRNG) {
    this.rng = rng.getStream('map');
  }

  /**
   * Generate a complete map for an act
   */
  generate(act: number): GameMap {
    const nodes = new Map<string, MapNode>();

    // Generate paths from bottom to top
    const paths = this.generatePaths();

    // Assign node types based on floor and weights
    for (const path of paths) {
      for (let floor = 0; floor < this.FLOORS; floor++) {
        const column = path[floor];
        const nodeId = `${floor}-${column}`;

        if (!nodes.has(nodeId)) {
          const type = this.assignNodeType(floor, act);
          nodes.set(nodeId, {
            id: nodeId,
            floor,
            column,
            type,
            connections: [],
            visited: false,
            x: this.columnToX(column),
            y: this.floorToY(floor),
          });
        }
      }
    }

    // Create connections between floors
    this.createConnections(nodes, paths);

    // Override specific floor types
    this.setFixedFloors(nodes, act);

    return {
      nodes,
      floors: this.FLOORS,
      columns: this.COLUMNS,
      currentNodeId: null,
      act,
    };
  }

  /**
   * Generate branching paths through the map
   */
  private generatePaths(): number[][] {
    const paths: number[][] = [];

    // Start with MIN_PATHS spread across bottom row
    const startPositions: number[] = [];
    for (let i = 0; i < this.MIN_PATHS; i++) {
      const col = Math.floor((i / (this.MIN_PATHS - 1)) * (this.COLUMNS - 1));
      if (!startPositions.includes(col)) {
        startPositions.push(col);
      } else {
        // Find nearest unoccupied
        for (let c = 0; c < this.COLUMNS; c++) {
          if (!startPositions.includes(c)) {
            startPositions.push(c);
            break;
          }
        }
      }
    }

    // Generate each path
    for (const startCol of startPositions) {
      const path: number[] = [];
      let currentCol = startCol;

      for (let floor = 0; floor < this.FLOORS; floor++) {
        path.push(currentCol);

        // Move to next floor with some randomness
        if (floor < this.FLOORS - 1) {
          const possibleMoves = [];
          for (let delta = -this.MAX_WIDTH_JUMP; delta <= this.MAX_WIDTH_JUMP; delta++) {
            const newCol = currentCol + delta;
            if (newCol >= 0 && newCol < this.COLUMNS) {
              possibleMoves.push(newCol);
            }
          }
          currentCol = this.rng.pick(possibleMoves);
        }
      }

      paths.push(path);
    }

    return paths;
  }

  /**
   * Assign a node type based on weights and floor
   */
  private assignNodeType(floor: number, act: number): NodeType {
    // Floor 0 is always monster
    if (floor === 0) return 'monster';

    // Floor 8 (9th) is always treasure
    if (floor === 8) return 'treasure';

    // Floor 14 (15th) is always rest before boss
    if (floor === this.FLOORS - 1) return 'rest';

    // No elites in first few floors
    const weights = { ...this.WEIGHTS };
    if (floor < 6) {
      weights.elite = 0;
    }

    // More elites in later floors
    if (floor >= 10) {
      weights.elite *= 1.5;
    }

    // No merchant in early floors
    if (floor < 5) {
      weights.merchant = 0;
    }

    // Calculate total weight
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = this.rng.random() * total;

    for (const [type, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) {
        return type as NodeType;
      }
    }

    return 'monster';
  }

  /**
   * Create connections between nodes
   */
  private createConnections(nodes: Map<string, MapNode>, paths: number[][]): void {
    for (const path of paths) {
      for (let floor = 0; floor < this.FLOORS - 1; floor++) {
        const currentId = `${floor}-${path[floor]}`;
        const nextId = `${floor + 1}-${path[floor + 1]}`;

        const currentNode = nodes.get(currentId);
        const nextNode = nodes.get(nextId);

        if (currentNode && nextNode && !currentNode.connections.includes(nextId)) {
          currentNode.connections.push(nextId);
        }
      }
    }

    // Add occasional cross-connections (reduced for simpler paths)
    for (let floor = 0; floor < this.FLOORS - 1; floor++) {
      const floorNodes = Array.from(nodes.values()).filter(n => n.floor === floor);
      const nextFloorNodes = Array.from(nodes.values()).filter(n => n.floor === floor + 1);

      for (const node of floorNodes) {
        for (const nextNode of nextFloorNodes) {
          // Can connect to adjacent columns only
          if (Math.abs(node.column - nextNode.column) <= 1) {
            if (!node.connections.includes(nextNode.id) && this.rng.chance(0.15)) {
              node.connections.push(nextNode.id);
            }
          }
        }
      }
    }

    // Ensure no paths cross (remove connections that would cross)
    this.removePathCrossings(nodes);
  }

  /**
   * Remove connections that would cause path crossings
   */
  private removePathCrossings(nodes: Map<string, MapNode>): void {
    for (let floor = 0; floor < this.FLOORS - 1; floor++) {
      const floorNodes = Array.from(nodes.values())
        .filter(n => n.floor === floor)
        .sort((a, b) => a.column - b.column);

      for (let i = 0; i < floorNodes.length - 1; i++) {
        const leftNode = floorNodes[i];
        const rightNode = floorNodes[i + 1];

        // Check for crossings
        for (const leftConn of leftNode.connections) {
          for (const rightConn of rightNode.connections) {
            const leftTarget = nodes.get(leftConn)!;
            const rightTarget = nodes.get(rightConn)!;

            // Crossing occurs if left connects to right of right's target
            // or right connects to left of left's target
            if (leftTarget.column > rightTarget.column) {
              // Remove one of the connections (the one to the farther column)
              if (leftTarget.column - leftNode.column > rightNode.column - rightTarget.column) {
                leftNode.connections = leftNode.connections.filter(c => c !== leftConn);
              } else {
                rightNode.connections = rightNode.connections.filter(c => c !== rightConn);
              }
            }
          }
        }
      }
    }

    // Ensure every node has at least one connection forward
    for (let floor = 0; floor < this.FLOORS - 1; floor++) {
      const floorNodes = Array.from(nodes.values()).filter(n => n.floor === floor);
      const nextFloorNodes = Array.from(nodes.values()).filter(n => n.floor === floor + 1);

      for (const node of floorNodes) {
        if (node.connections.length === 0 && nextFloorNodes.length > 0) {
          // Connect to closest node on next floor
          const closest = nextFloorNodes.reduce((best, n) => {
            const bestDist = Math.abs(best.column - node.column);
            const nDist = Math.abs(n.column - node.column);
            return nDist < bestDist ? n : best;
          });
          node.connections.push(closest.id);
        }
      }
    }
  }

  /**
   * Set fixed floor types (overrides)
   */
  private setFixedFloors(nodes: Map<string, MapNode>, act: number): void {
    // All floor 0 nodes are monsters
    for (const node of nodes.values()) {
      if (node.floor === 0) {
        node.type = 'monster';
      }
    }

    // Floor 8 is treasure
    for (const node of nodes.values()) {
      if (node.floor === 8) {
        node.type = 'treasure';
      }
    }

    // Last floor before boss is rest
    for (const node of nodes.values()) {
      if (node.floor === this.FLOORS - 1) {
        node.type = 'rest';
      }
    }

    // Add boss node at top (single node)
    const bossId = `${this.FLOORS}-boss`;
    const bossNode: MapNode = {
      id: bossId,
      floor: this.FLOORS,
      column: Math.floor(this.COLUMNS / 2),
      type: 'boss',
      connections: [],
      visited: false,
      x: this.columnToX(Math.floor(this.COLUMNS / 2)),
      y: this.floorToY(this.FLOORS),
    };
    nodes.set(bossId, bossNode);

    // Connect all rest site nodes to boss
    for (const node of nodes.values()) {
      if (node.floor === this.FLOORS - 1) {
        node.connections.push(bossId);
      }
    }

    // Ensure minimum elite and rest distribution
    this.ensureMinimumDistribution(nodes);
  }

  /**
   * Ensure we have enough elites and rest sites
   */
  private ensureMinimumDistribution(nodes: Map<string, MapNode>): void {
    const nodeArray = Array.from(nodes.values()).filter(
      n => n.floor > 0 && n.floor < this.FLOORS - 1 && n.floor !== 8
    );

    // Count current distribution
    let eliteCount = nodeArray.filter(n => n.type === 'elite').length;
    let restCount = nodeArray.filter(n => n.type === 'rest').length;

    // Want at least 2 elites reachable
    const minElites = 2;
    const minRests = 1;

    // Add elites if needed
    while (eliteCount < minElites) {
      const candidates = nodeArray.filter(
        n => n.type === 'monster' && n.floor >= 6
      );
      if (candidates.length === 0) break;
      const node = this.rng.pick(candidates);
      node.type = 'elite';
      eliteCount++;
    }

    // Add rest sites if needed
    while (restCount < minRests) {
      const candidates = nodeArray.filter(
        n => n.type === 'monster' || n.type === 'event'
      );
      if (candidates.length === 0) break;
      const node = this.rng.pick(candidates);
      node.type = 'rest';
      restCount++;
    }
  }

  /**
   * Convert column index to screen X position
   */
  private columnToX(column: number): number {
    const mapWidth = 600;
    const padding = 100;
    return padding + (column / (this.COLUMNS - 1)) * mapWidth;
  }

  /**
   * Convert floor index to screen Y position
   */
  private floorToY(floor: number): number {
    const floorSpacing = 100; // More space between floors
    const padding = 150;
    // Floor 0 at bottom, higher floors go up
    return padding + (this.FLOORS - floor) * floorSpacing;
  }

  /**
   * Get available starting nodes (floor 0)
   */
  getStartingNodes(map: GameMap): MapNode[] {
    return Array.from(map.nodes.values()).filter(n => n.floor === 0);
  }

  /**
   * Get reachable nodes from current position
   */
  getReachableNodes(map: GameMap): MapNode[] {
    if (!map.currentNodeId) {
      return this.getStartingNodes(map);
    }

    const currentNode = map.nodes.get(map.currentNodeId);
    if (!currentNode) return [];

    return currentNode.connections
      .map(id => map.nodes.get(id))
      .filter((n): n is MapNode => n !== undefined);
  }

  /**
   * Mark a node as visited and update current position
   */
  visitNode(map: GameMap, nodeId: string): boolean {
    const node = map.nodes.get(nodeId);
    if (!node) return false;

    // Check if reachable
    const reachable = this.getReachableNodes(map);
    if (!reachable.some(n => n.id === nodeId)) {
      return false;
    }

    node.visited = true;
    map.currentNodeId = nodeId;
    return true;
  }
}
