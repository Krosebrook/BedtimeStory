
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import { StoryState, StoryFull, AppPhase } from '../types';
import { AIClient } from '../AIClient';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';

/**
 * useStoryEngine
 * 
 * Orchestrates the complex interaction between:
 * 1. AIClient (Story and Avatar Generation)
 * 2. NarrationManager (Audio Playback)
 * 3. SoundManager (UI Feedback)
 * 
 * It manages the app's internal "Mission Control" state.
 */
export const useStoryEngine = (validateApiKey: () => Promise<boolean>, setShowApiKeyDialog: (show: boolean) => void) => {
    const [phase, setPhase] = useState<AppPhase>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [input, setInput] = useState<StoryState>({
        heroName: '',
        heroPower: '',
        setting: '',
        sidekick: '',
        problem: '',
        heroAvatarUrl: ''
    });
    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    
    // Narration State
    const [isNarrating, setIsNarrating] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);

    /** Updates the hero configuration */
    const handleInputChange = useCallback((field: keyof StoryState, value: string) => {
        setInput(prev => ({ ...prev, [field]: value }));
    }, []);

    /** Stops current TTS and resets narrator state */
    const stopNarration = useCallback(() => {
        narrationManager.stop();
        setIsNarrating(false);
    }, []);

    /** 
     * Handles the "Play/Pause" logic for the storyteller.
     * Includes logic to aggregate lesson/joke text for the final part.
     */
    const playNarration = useCallback(async () => {
        if (!story) return;
        
        const state = narrationManager.state;
        if (state.isPaused) {
            narrationManager.play();
            return;
        }
        if (state.isPlaying) {
            narrationManager.pause();
            return;
        }

        setIsNarrating(true);
        setIsNarrationLoading(true);
        
        try {
            const currentPart = story.parts[currentPartIndex];
            const isLastPart = currentPartIndex === 2;
            
            // Build the definitive text string for this part
            const textToRead = isLastPart 
                ? `${currentPart.text}. Today's lesson is: ${story.lesson}. Here is a joke: ${story.joke}. ${story.tomorrowHook}` 
                : currentPart.text;
                
            await narrationManager.fetchNarration(textToRead);
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex]);

    /** Calls the Flash Image model to create a hero portrait */
    const generateAvatar = useCallback(async () => {
        if (!input.heroName || !input.heroPower) return;
        if (!(await validateApiKey())) return;

        setIsAvatarLoading(true);
        try {
            const url = await AIClient.generateAvatar(input.heroName, input.heroPower);
            if (url) {
                handleInputChange('heroAvatarUrl', url);
                soundManager.playSparkle();
            }
        } catch (e) {
            console.error("Avatar Gen Error:", e);
        } finally {
            setIsAvatarLoading(false);
        }
    }, [input.heroName, input.heroPower, validateApiKey, handleInputChange]);

    /** Streams the story JSON from Gemini 3 Pro */
    const generateStory = useCallback(async () => {
        if (!(await validateApiKey())) return;

        setIsLoading(true);
        try {
            const data = await AIClient.streamStory(input);
            setStory(data);
            setPhase('reading');
            setCurrentPartIndex(0);
            soundManager.playPageTurn();
        } catch (error: any) {
            console.error("Story Gen Error:", error);
            if (error.message?.includes("404") || error.message?.includes("entity was not found")) {
                setShowApiKeyDialog(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [input, validateApiKey, setShowApiKeyDialog]);

    /** Advance the story based on user interaction */
    const handleChoice = useCallback((choice: string) => {
        soundManager.playChoice();
        stopNarration();
        
        if (currentPartIndex < 2) {
            const nextIndex = currentPartIndex + 1;
            setCurrentPartIndex(nextIndex);
            soundManager.playPageTurn();
            
            // Auto-advance audio if the user was already listening
            if (isNarrating) {
                setTimeout(() => playNarration(), 1200);
            }
        }
    }, [currentPartIndex, isNarrating, playNarration, stopNarration]);

    /** Reset to initial state */
    const reset = useCallback(() => {
        soundManager.playChoice();
        stopNarration();
        setPhase('setup');
        setStory(null);
        setCurrentPartIndex(0);
        setInput(prev => ({ ...prev, heroAvatarUrl: '' }));
    }, [stopNarration]);

    return {
        phase,
        isLoading,
        isAvatarLoading,
        input,
        story,
        currentPartIndex,
        isNarrating,
        isNarrationLoading,
        handleInputChange,
        generateAvatar,
        generateStory,
        handleChoice,
        reset,
        playNarration,
        stopNarration
    };
};
