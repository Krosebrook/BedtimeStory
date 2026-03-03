
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type AppMode = 'classic' | 'madlibs' | 'sleep';
export type SleepSubMode = 'automatic' | 'parent-madlib' | 'child-friendly';
export type StoryLength = 'short' | 'medium' | 'long' | 'epic' | 'eternal';
export type AmbientTheme = 'space' | 'rain' | 'forest' | 'magic' | 'ocean' | 'crickets' | 'campfire' | 'auto';

// Added ComicFace and constants for Book/Panel components
export interface ComicFace {
    pageIndex?: number;
    imageUrl?: string;
    isLoading?: boolean;
    type: 'cover' | 'story' | 'back_cover';
    isDecisionPage?: boolean;
    choices: string[];
    resolvedChoice?: string | null;
}

export const TOTAL_PAGES = 10;
export const INITIAL_PAGES = 4;
export const GATE_PAGE = 3;

export interface SleepConfig {
    subMode: SleepSubMode;
    texture: string;
    sound: string;
    scent: string;
    theme: string;
    ambientTheme: AmbientTheme;
}

export interface MadLibState {
    adjective: string;
    place: string;
    food: string;
    sillyWord: string;
    animal: string;
}

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
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr' | 'Leda';
    storyLength: StoryLength;
}

export interface StoryPart {
    text: string;
    choices?: string[];
    partIndex: number;
    isGenerated: boolean; // Tracking for background expansion
}

export interface StoryOutline {
    title: string;
    chapterOutlines: string[]; // High level summaries for context pinning
    totalExpectedParts: number;
    vocabWord: { word: string; definition: string };
    rewardBadge: { emoji: string; title: string; description: string };
}

export interface StoryFull {
    title: string;
    parts: StoryPart[];
    outline?: StoryOutline;
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
    rewardBadge: { emoji: string; title: string; description: string };
    isComplete: boolean; // Whether the background expansion has finished
}

export type AppPhase = 'setup' | 'reading' | 'finished';

export interface UserPreferences {
    narratorVoice: StoryState['narratorVoice'];
    storyLength: StoryLength;
    sleepTheme: string;
    fontSize: 'normal' | 'large';
    isMuted: boolean;
    reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    narratorVoice: 'Kore',
    storyLength: 'medium',
    sleepTheme: 'Cloud Kingdom',
    fontSize: 'normal',
    isMuted: false,
    reducedMotion: false
};
