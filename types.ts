
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

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

// Added missing ComicFace and constants to support legacy Book and Panel components

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

/**
 * TOTAL_PAGES defines the maximum page count for the book renderer loop.
 */
export const TOTAL_PAGES = 6;

/**
 * INITIAL_PAGES is the number of pages required to start reading.
 */
export const INITIAL_PAGES = 3;

/**
 * GATE_PAGE is the threshold index that unlocks the book once generated.
 */
export const GATE_PAGE = 3;
