
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type AppMode = 'classic' | 'madlibs' | 'sleep';
export type SleepSubMode = 'automatic' | 'parent-madlib' | 'child-friendly';
export type StoryLength = 'short' | 'medium' | 'long' | 'eternal';
export type AmbientTheme = 'space' | 'rain' | 'forest' | 'magic' | 'ocean' | 'crickets' | 'auto';

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
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr' | 'Lira';
    storyLength: StoryLength;
}

export interface StoryPart {
    text: string;
    choices?: string[];
    partIndex: number;
}

export interface StoryFull {
    title: string;
    parts: StoryPart[];
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
    rewardBadge: { emoji: string; title: string; description: string };
}

export type AppPhase = 'setup' | 'reading' | 'finished';

// Interface for comic panel rendering
export interface ComicFace {
    pageIndex?: number;
    type: 'cover' | 'story' | 'back_cover';
    imageUrl?: string;
    isLoading?: boolean;
    isDecisionPage?: boolean;
    choices: string[];
    resolvedChoice?: string;
}

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

export const TOTAL_PAGES = 18;
export const INITIAL_PAGES = 6;
export const GATE_PAGE = 1;
