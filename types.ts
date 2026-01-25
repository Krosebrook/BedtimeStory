
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Defines the operational mode of the story engine.
 */
export type AppMode = 'classic' | 'madlibs' | 'sleep';

/**
 * Sub-modes for Sleepy Time.
 */
export type SleepSubMode = 'automatic' | 'parent-madlib' | 'child-friendly';

/**
 * Defines the desired length/complexity of the story.
 */
export type StoryLength = 'short' | 'medium' | 'long' | 'eternal';

/**
 * Available ambient sound themes.
 */
export type AmbientTheme = 'space' | 'rain' | 'forest' | 'magic' | 'auto';

/**
 * Configuration for the Sleepy Time mode.
 */
export interface SleepConfig {
    subMode: SleepSubMode;
    texture: string;
    sound: string;
    scent: string;
    theme: string;
    ambientTheme: AmbientTheme;
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
 * Context from a previous story to generate a sequel.
 */
export interface SequelContext {
    lastTitle: string;
    lastHook: string;
    lastLesson?: string;
}

/** 
 * Represents the user-provided parameters used to seed the generative model.
 */
export interface StoryState {
    heroName: string;
    heroPower: string;
    setting: string;
    sidekick: string;
    problem: string;
    heroAvatarUrl?: string;
    mode: AppMode;
    madlibs: MadLibState;
    sleepConfig: SleepConfig;
    /** Expanded Voice selection with softer profiles. */
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr' | 'Lira';
    storyLength: StoryLength;
    sequelContext?: SequelContext;
}

/** 
 * A single segment of the narrative.
 */
export interface StoryPart {
    text: string;
    choices?: string[];
    partIndex: number;
}

/** 
 * The full structured response object from the Gemini model.
 */
export interface StoryFull {
    title: string;
    parts: StoryPart[];
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
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
export const TOTAL_PAGES = 12; // Increased for longer sleep stories
export const INITIAL_PAGES = 3;
export const GATE_PAGE = 3;
