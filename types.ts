
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Defines the operational mode of the story engine.
 * - 'classic': Standard hero's journey with choices.
 * - 'madlibs': User fills in words to generate a funny story.
 * - 'sleep': Passive, choice-free mode with dark UI and soothing narration.
 */
export type AppMode = 'classic' | 'madlibs' | 'sleep';

/**
 * Sub-modes for Sleepy Time.
 * - 'automatic': Standard generation (Hero + Setting).
 * - 'parent-madlib': User provides specific sensory details (Sound, Scent, Texture).
 * - 'child-friendly': Simple preset themes.
 */
export type SleepSubMode = 'automatic' | 'parent-madlib' | 'child-friendly';

/**
 * Defines the desired length/complexity of the story.
 */
export type StoryLength = 'short' | 'medium' | 'long';

/**
 * Configuration for the Sleepy Time mode.
 */
export interface SleepConfig {
    subMode: SleepSubMode;
    // Fields for 'parent-madlib'
    texture: string;
    sound: string;
    scent: string;
    // Field for 'child-friendly'
    theme: string;
}

/**
 * State container for the Mad Libs input fields.
 */
export interface MadLibState {
    adjective: string;
    place: string;
    food: string;
    sillyWord: string;
    animal: string;
    feeling: string;
}

/** 
 * Represents the user-provided parameters used to seed the generative model.
 */
export interface StoryState {
    /** Name of the main character. */
    heroName: string;
    /** The special ability of the hero (Classic mode only). */
    heroPower: string;
    /** The environment where the story takes place. */
    setting: string;
    /** The hero's companion (Classic mode only). */
    sidekick: string;
    /** The central conflict or obstacle (Classic mode only). */
    problem: string;
    /** Base64 or URL string for the generated avatar image. */
    heroAvatarUrl?: string;
    /** Current application mode. */
    mode: AppMode;
    /** specific inputs for Mad Libs mode. */
    madlibs: MadLibState;
    /** Configuration for Sleepy Time mode. */
    sleepConfig: SleepConfig;
    /** The specific Gemini voice to use for TTS. */
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
    /** Desired length of the story. */
    storyLength: StoryLength;
}

/** 
 * A single segment of the narrative.
 */
export interface StoryPart {
    /** The narrative content to be read aloud. */
    text: string;
    /** 
     * Optional choices for branching narratives. 
     * If empty or null, the story proceeds linearly (Sleep mode).
     */
    choices?: string[];
    /** The sequential index of this part. */
    partIndex: number;
}

/** 
 * The full structured response object from the Gemini model.
 * This matches the JSON schema enforced in AIClient.
 */
export interface StoryFull {
    /** The generated title of the story. */
    title: string;
    /** Array of story segments. */
    parts: StoryPart[];
    /** Educational element: a complex word found in the story. */
    vocabWord: { word: string; definition: string };
    /** A joke related to the story context. */
    joke: string;
    /** The moral or takeaway of the story. */
    lesson: string;
    /** A teaser sentence for a potential sequel. */
    tomorrowHook: string;
    /** Gamification reward for completing the story. */
    rewardBadge: { emoji: string; title: string; description: string };
}

/** 
 * Top-level application phase states for routing views.
 */
export type AppPhase = 'setup' | 'reading' | 'finished';

/**
 * Interface for managing individual comic book pages (Legacy/Visualizer support).
 */
export interface ComicFace {
    pageIndex?: number;
    imageUrl?: string;
    isLoading?: boolean;
    type: 'cover' | 'back_cover' | 'story';
    isDecisionPage?: boolean;
    choices: string[];
    resolvedChoice?: string;
}

// Constants for pagination logic
export const TOTAL_PAGES = 6;
export const INITIAL_PAGES = 3;
export const GATE_PAGE = 3;
