import { Story } from 'inkjs';

export interface DialogueChoice {
  text: string;
  index: number;
  tags: string[];
}

export interface DialogueLine {
  text: string;
  speaker?: string;
  tags: string[];
  choices: DialogueChoice[];
  canContinue: boolean;
}

/**
 * Wrapper for Ink story runtime
 * Handles dialogue flow, choices, and variable binding
 */
export class InkRunner {
  private story: Story | null = null;
  private globalVariables: Map<string, any> = new Map();

  /**
   * Load an Ink story from JSON
   */
  loadStory(inkJson: string): void {
    this.story = new Story(inkJson);
    this.bindVariables();
  }

  /**
   * Bind external variables to the story
   */
  private bindVariables(): void {
    if (!this.story) return;

    // Observe variable changes from the story
    this.story.variablesState.variableChangedEvent = (name: string, value: any) => {
      this.globalVariables.set(name, value);
    };
  }

  /**
   * Set a variable in the story
   */
  setVariable(name: string, value: any): void {
    if (!this.story) return;

    try {
      this.story.variablesState[name] = value;
      this.globalVariables.set(name, value);
    } catch (e) {
      // Variable may not exist in story
      console.warn(`Failed to set variable ${name}:`, e);
    }
  }

  /**
   * Get a variable from the story
   */
  getVariable(name: string): any {
    if (!this.story) return undefined;
    return this.story.variablesState[name];
  }

  /**
   * Set multiple variables at once
   */
  setVariables(vars: Record<string, any>): void {
    for (const [name, value] of Object.entries(vars)) {
      this.setVariable(name, value);
    }
  }

  /**
   * Jump to a specific knot/stitch in the story
   */
  goTo(path: string): boolean {
    if (!this.story) return false;

    try {
      this.story.ChoosePathString(path);
      return true;
    } catch (e) {
      console.warn(`Failed to go to path ${path}:`, e);
      return false;
    }
  }

  /**
   * Check if we can continue the story
   */
  canContinue(): boolean {
    return this.story?.canContinue ?? false;
  }

  /**
   * Check if the story has ended
   */
  hasEnded(): boolean {
    if (!this.story) return true;
    return !this.story.canContinue && this.story.currentChoices.length === 0;
  }

  /**
   * Get the next line of dialogue
   */
  continue(): DialogueLine | null {
    if (!this.story || !this.story.canContinue) return null;

    const text = this.story.Continue()?.trim() ?? '';
    const tags = this.story.currentTags ?? [];

    // Parse speaker from tags (format: #speaker:name)
    let speaker: string | undefined;
    const otherTags: string[] = [];

    for (const tag of tags) {
      if (tag.startsWith('speaker:')) {
        speaker = tag.replace('speaker:', '');
      } else {
        otherTags.push(tag);
      }
    }

    // Get current choices
    const choices: DialogueChoice[] = this.story.currentChoices.map((choice, i) => ({
      text: choice.text,
      index: i,
      tags: choice.tags ?? [],
    }));

    return {
      text,
      speaker,
      tags: otherTags,
      choices,
      canContinue: this.story.canContinue,
    };
  }

  /**
   * Continue until we hit choices or end
   */
  continueUntilChoice(): DialogueLine[] {
    const lines: DialogueLine[] = [];

    while (this.canContinue()) {
      const line = this.continue();
      if (line) {
        lines.push(line);
        if (line.choices.length > 0) break;
      }
    }

    return lines;
  }

  /**
   * Select a choice
   */
  choose(index: number): boolean {
    if (!this.story) return false;

    try {
      this.story.ChooseChoiceIndex(index);
      return true;
    } catch (e) {
      console.warn(`Failed to choose option ${index}:`, e);
      return false;
    }
  }

  /**
   * Get current state for saving
   */
  getState(): string | null {
    if (!this.story) return null;
    return this.story.state.toJson();
  }

  /**
   * Restore state from save
   */
  setState(json: string): boolean {
    if (!this.story) return false;

    try {
      this.story.state.LoadJson(json);
      return true;
    } catch (e) {
      console.warn('Failed to restore story state:', e);
      return false;
    }
  }

  /**
   * Reset story to beginning
   */
  reset(): void {
    if (!this.story) return;
    this.story.ResetState();
  }

  /**
   * Check if a path/knot exists
   */
  hasPath(path: string): boolean {
    if (!this.story) return false;

    try {
      return this.story.ContentAtPath(path as any) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get all global tags
   */
  getGlobalTags(): string[] {
    return this.story?.globalTags ?? [];
  }

  /**
   * Bind an external function that can be called from Ink
   */
  bindFunction(name: string, fn: (...args: any[]) => any): void {
    if (!this.story) return;

    this.story.BindExternalFunction(name, fn);
  }

  /**
   * Unbind an external function
   */
  unbindFunction(name: string): void {
    if (!this.story) return;

    this.story.UnbindExternalFunction(name);
  }
}

/**
 * Sample Ink story for testing/fallback
 */
export const SAMPLE_INK_STORY = `
VAR player_name = "Traveler"
VAR affinity = 0
VAR has_gold = true

=== start ===
# speaker:Keeper
Welcome to the House of Rest, {player_name}. You look weary from your climb.

+ [Ask about the Spire]
    # speaker:Keeper
    The Spire? It has stood since before memory. Many climb, few return.
    ~ affinity = affinity + 1
    -> ask_more

+ [Rest silently]
    You find a quiet corner and close your eyes.
    -> rest

+ {has_gold} [Offer gold for information]
    # speaker:Keeper
    ~ has_gold = false
    Ah, generous. Very well, I shall share what I know.
    ~ affinity = affinity + 2
    -> secrets

=== ask_more ===
# speaker:Keeper
What else would you know?

+ [About the enemies]
    # speaker:Keeper
    Creatures of shadow and spite. They grow stronger the higher you go.
    -> ask_more

+ [About yourself]
    # speaker:Keeper
    I am merely a keeper of this place. A rest stop for the doomed.
    -> ask_more

+ [Leave]
    # speaker:Keeper
    Safe travels, climber. I doubt we shall meet again.
    -> END

=== rest ===
You drift into an uneasy sleep, filled with visions of the summit.
-> END

=== secrets ===
# speaker:Keeper
The Spire feeds on ambition. It gives power to those who climb, but takes something in return.
# speaker:Keeper
The higher you go, the less you remember of who you were. Is the summit worth your soul?
-> ask_more
`;
