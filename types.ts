
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type AppMode = 'classic' | 'madlibs';

export interface MadLibState {
    adjective: string;
    place: string;
    food: string;
    sillyWord: string;
    animal: string;
    feeling: string;
}

/** 
 * Represents the user-provided parameters for story generation.
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
}

/** 
 * A single segment of the story with optional branching paths.
 */
export interface StoryPart {
    text: string;
    choices?: string[];
    partIndex: number;
}

/** 
 * The full structured output from the Gemini model.
 */
export interface StoryFull {
    title: string;
    parts: StoryPart[];
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
}

/** 
 * Top-level application phase states.
 */
export type AppPhase = 'setup' | 'reading' | 'finished';

/**
 * ComicFace interface for managing individual comic book pages.
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

export const TOTAL_PAGES = 6;
export const INITIAL_PAGES = 3;
export const GATE_PAGE = 3;
