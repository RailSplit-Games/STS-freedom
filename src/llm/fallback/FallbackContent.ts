/**
 * Pre-written fallback content for when LLM is unavailable
 * Provides variety without requiring API calls
 */

export class FallbackContent {
  private rng: () => number = Math.random;

  setRng(rng: () => number): void {
    this.rng = rng;
  }

  private pick<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }

  get(type: string): string {
    switch (type) {
      case 'item':
        return JSON.stringify(this.getItem('weapon', ['magic']));
      case 'event':
        return JSON.stringify(this.getEvent('encounter'));
      case 'dialogue':
        return this.getDialogue();
      case 'bark':
        return this.getBark('attack');
      case 'quest':
        return JSON.stringify(this.getQuest('kill', 'enemy'));
      default:
        return 'Content unavailable.';
    }
  }

  getItem(
    baseItem: string,
    affixes: string[]
  ): { name: string; description: string; flavor: string } {
    const names: Record<string, string[]> = {
      weapon: [
        "Bloodthirster", "Soulrend", "Nightfall", "Harbinger",
        "Whisperwind", "Doomcaller", "Faithbreaker", "Voidtouched Blade",
        "Serpent's Fang", "Winter's Edge", "Ashen Striker", "Crimson Dawn"
      ],
      armor: [
        "Aegis of Resolve", "Shadowmail", "Ironheart Plate", "Wraithguard",
        "Sentinel's Bulwark", "Thornweave Vest", "Eclipse Mantle", "Bastion Shell"
      ],
      accessory: [
        "Eye of Fortune", "Cursed Pendant", "Ring of Spite", "Amulet of Echoes",
        "Shard of the Fallen", "Binding Stone", "Hollow Charm", "Nexus Crystal"
      ],
    };

    const descriptions: string[] = [
      "Deals additional damage based on your missing HP.",
      "Has a chance to apply Vulnerable on hit.",
      "Grants Block at the start of each turn.",
      "Increases all damage dealt by 15%.",
      "Heals you when you defeat an enemy.",
      "Your first attack each turn costs 0 energy.",
      "Enemies take damage when they attack you.",
      "Gain Strength whenever you play a Power.",
    ];

    const flavors: string[] = [
      "Forged in the depths where light fears to tread.",
      "Its previous owner left it in a hurry.",
      "The inscription has worn away, but the power remains.",
      "Cold to the touch, even in summer.",
      "It hums softly when danger approaches.",
      "The metal seems to drink in shadows.",
      "Legends speak of its terrible price.",
      "",
    ];

    const itemNames = names[baseItem] || names.weapon;

    return {
      name: this.pick(itemNames),
      description: this.pick(descriptions),
      flavor: this.pick(flavors),
    };
  }

  getEvent(eventType: string): {
    title: string;
    description: string;
    choices: Array<{ text: string; tags?: string[] }>;
  } {
    const events = [
      {
        title: "The Abandoned Camp",
        description: "You discover a hastily abandoned camp. The fire still smolders, and supplies are scattered about. Whoever was here left in a panic.",
        choices: [
          { text: "Search the supplies carefully" },
          { text: "Check for tracks leading away" },
          { text: "Take what you can and leave quickly" },
          { text: "Rest by the dying fire" },
        ],
      },
      {
        title: "Mysterious Shrine",
        description: "A weathered shrine stands at the crossroads, its deity long forgotten. Offerings of coins and trinkets litter its base. The air feels heavy with old magic.",
        choices: [
          { text: "Make an offering of gold", tags: [] },
          { text: "Take some of the offerings" },
          { text: "Pray at the shrine", tags: ["DEVOUT"] },
          { text: "Pass by without stopping" },
        ],
      },
      {
        title: "The Wounded Stranger",
        description: "A cloaked figure stumbles toward you, clutching a wound. They reach out with a bloodied hand, mumbling about 'the thing in the dark.'",
        choices: [
          { text: "Help bandage their wounds" },
          { text: "Ask about what attacked them" },
          { text: "Tend to them with expertise", tags: ["HEALER"] },
          { text: "Keep your distance" },
        ],
      },
      {
        title: "Gambling Ghost",
        description: "A spectral figure materializes before you, cards floating in ethereal hands. 'Care to test your luck?' it whispers with a hollow grin.",
        choices: [
          { text: "Play a game of chance" },
          { text: "Decline politely" },
          { text: "Ask what happens if you lose" },
          { text: "Challenge it to a different game", tags: ["GAMBLER"] },
        ],
      },
      {
        title: "The Locked Chest",
        description: "A ornate chest sits in an alcove, bound with complex locks. Strange runes glow faintly on its surface. Whatever's inside was meant to stay there.",
        choices: [
          { text: "Attempt to pick the locks" },
          { text: "Try to force it open" },
          { text: "Study the runes carefully", tags: ["SCHOLAR"] },
          { text: "Leave it alone" },
        ],
      },
    ];

    return this.pick(events);
  }

  getQuest(
    questType: string,
    target: string
  ): { title: string; description: string; objectiveText: string } {
    const quests: Record<string, Array<{ title: string; description: string; objectiveText: string }>> = {
      kill: [
        {
          title: "Silence the Howling",
          description: "Something stalks the lower levels, its cries echoing through the stone. Travelers speak of a beast with too many eyes and a hunger that knows no end.",
          objectiveText: `Defeat the ${target} lurking below.`,
        },
        {
          title: "End the Terror",
          description: "A creature has claimed these halls as its hunting ground. Its victims' screams still echo in the walls. This cannot continue.",
          objectiveText: `Hunt down and eliminate the ${target}.`,
        },
      ],
      collect: [
        {
          title: "Gather the Scattered",
          description: "Ancient artifacts have been scattered throughout the tower. Each one pulses with residual power that could prove useful in the climb ahead.",
          objectiveText: `Collect the ${target} from this area.`,
        },
        {
          title: "Salvage Operation",
          description: "Previous climbers left behind valuable resources. Finding them could mean the difference between survival and becoming another corpse on the stairs.",
          objectiveText: `Recover ${target} from the fallen.`,
        },
      ],
      explore: [
        {
          title: "Chart the Unknown",
          description: "This section of the tower remains unmapped. Knowledge of its layout could reveal shortcuts or hidden dangers worth avoiding.",
          objectiveText: `Explore the ${target} thoroughly.`,
        },
        {
          title: "Uncover the Truth",
          description: "Rumors speak of hidden passages and forgotten chambers. The truth of this place lies waiting for those brave enough to seek it.",
          objectiveText: `Investigate the ${target} area.`,
        },
      ],
    };

    const questList = quests[questType] || quests.kill;
    return this.pick(questList);
  }

  getDialogue(): string {
    const dialogues = [
      "I've seen many climbers come through here. Most don't make it past the first few floors.",
      "The Spire changes those who stay too long. Can you feel it already?",
      "Gold means little up here. Power is the only currency that matters.",
      "Be careful who you trust. Not everyone here wishes to see you succeed.",
      "The higher you climb, the stranger things become. Reality itself starts to fray.",
      "I used to be like you once. Full of hope. The tower took that from me.",
      "Some say the Spire is alive. That it feeds on the ambition of climbers.",
      "Rest while you can. Sleep becomes harder to find the higher you go.",
    ];

    return this.pick(dialogues);
  }

  getBark(situation: string): string {
    const barks: Record<string, string[]> = {
      attack: [
        "Take this!",
        "Strike true!",
        "You cannot stop me!",
        "For glory!",
        "Feel my wrath!",
        "This ends now!",
      ],
      hurt: [
        "Argh!",
        "That... hurt...",
        "You'll pay for that!",
        "Is that all?",
        "I won't fall!",
        "Merely a scratch!",
      ],
      death: [
        "No... not like this...",
        "The climb... ends here...",
        "Darkness... takes me...",
        "Tell them... I tried...",
        "So cold...",
        "At last... rest...",
      ],
      victory: [
        "Another step forward.",
        "The climb continues.",
        "Worthy opponents, poor choices.",
        "Rest now, fools.",
        "The Spire is mine.",
        "Nothing can stop me.",
      ],
      taunt: [
        "Is that your best?",
        "Come, let us finish this!",
        "You bore me!",
        "Pathetic!",
        "Try harder!",
        "Running won't save you!",
      ],
    };

    const list = barks[situation] || barks.attack;
    return this.pick(list);
  }

  getRunSummary(won: boolean): string {
    if (won) {
      const victories = [
        "Against all odds, the climber reached the summit. The Spire had found a new master.",
        "Through blood and determination, victory was claimed. The heart of the tower beats no more.",
        "The climb is complete. What awaits beyond the peak, none can say.",
      ];
      return this.pick(victories);
    } else {
      const defeats = [
        "The Spire claims another soul. The climb proved too steep, the enemies too fierce.",
        "So close, yet so far. The tower's depths swallow another ambitious fool.",
        "The story ends here, but the tower remembers. Perhaps another will succeed where this one fell.",
      ];
      return this.pick(defeats);
    }
  }
}
