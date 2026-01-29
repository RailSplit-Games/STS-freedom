# STS Freedom - Dynamic Roguelike Deckbuilder

A Slay the Spire-style roguelike deckbuilder with dynamic LLM-generated content and Hades-style narrative progression.

## Features

### Core Gameplay
- **Card Combat System**: Turn-based combat with energy, cards, and status effects
- **Procedural Map Generation**: StS-style branching paths with weighted room types
- **Seeded RNG**: Reproducible runs with separate streams for map, combat, and rewards

### Dynamic Content (LLM-Powered)
- **Procedural Items**: Affix-based relic generation with unique names and descriptions
- **Dynamic Events**: Context-aware narrative events with player tag unlocks
- **NPC Dialogue**: Character memory and relationship-affected conversations
- **Combat Barks**: Situational enemy/player exclamations

### Narrative Systems
- **Hub Area**: Hades-style sanctuary with persistent NPCs
- **Character Relationships**: Affinity tracking and unlockable dialogue topics
- **Tag System**: Earned character traits unlock special dialogue options
- **Quality-Based Narrative**: Flag-driven storylet unlocks

## Tech Stack

- **Framework**: Vite + TypeScript
- **Rendering**: Pixi.js v8
- **State**: Zustand (vanilla)
- **Narrative**: inkjs
- **Persistence**: IndexedDB (idb-keyval)
- **LLM**: OpenAI / Anthropic / Local (Ollama) with fallback content

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# LLM Provider: openai, anthropic, local, none
VITE_LLM_PROVIDER=none

# API Keys (if using cloud LLM)
VITE_OPENAI_API_KEY=your-key
VITE_ANTHROPIC_API_KEY=your-key

# Local LLM URL (if using Ollama/LM Studio)
VITE_LOCAL_LLM_URL=http://localhost:11434
```

## Project Structure

```
src/
├── core/           # Game manager, ECS, events, RNG
├── combat/         # Cards, enemies, combat state machine
├── generation/     # Procedural map, items, encounters
├── narrative/      # Dialogue, characters, flags
├── llm/            # LLM client, prompts, cache, fallback
├── ui/             # Pixi.js scenes (menu, map, combat, hub)
├── persistence/    # Save/load system
└── data/           # JSON content definitions
```

## Architecture

### Entity Component System
- Lightweight ECS for combat entities
- Components: Health, Block, Energy, Intent, StatusEffects, Position
- Systems: DamageSystem, StatusSystem, TurnSystem

### Event-Driven
- Central EventBus for decoupled communication
- Event types: Combat, Status, Map, Rewards, Narrative

### LLM Integration
- Abstract provider interface (OpenAI, Anthropic, Local)
- Persistent cache with IndexedDB
- Pre-written fallback content for offline play
- Prompt templates for consistent generation

## Content Systems

### Cards
- Types: Attack, Skill, Power, Status, Curse
- Effects: Damage, Block, Draw, Energy, Status application
- Keywords: Innate, Ethereal, Exhaust, Retain

### Relics
- Fixed relics with known effects
- Procedural relics with affix combinations
- LLM-generated names and flavor text

### Enemies
- AI patterns: Sequential, Random, Conditional
- Intent system showing upcoming actions
- Status effect interactions

## Roadmap

- [ ] Full card library
- [ ] All enemy patterns
- [ ] Potion system
- [ ] Card upgrade system
- [ ] Achievement tracking
- [ ] Sound effects and music
- [ ] Mobile responsive UI
- [ ] Multiplayer spectating

## License

MIT
