
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { StoryState, StoryFull, AppPhase, MadLibState, SleepConfig, UserPreferences, DEFAULT_PREFERENCES, StoryOutline, StoryPart } from '../types';
import { AIClient } from '../AIClient';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';
import { storageManager, CachedStory } from '../lib/StorageManager';

export const useStoryEngine = (validateApiKey: () => Promise<boolean>, setShowApiKeyDialog: (show: boolean) => void) => {
    const [phase, setPhase] = useState<AppPhase>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [isSceneLoading, setIsSceneLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [history, setHistory] = useState<CachedStory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    
    const [input, setInput] = useState<StoryState>({
        heroName: '', heroPower: '', setting: '', sidekick: '', problem: '', heroAvatarUrl: '',
        mode: 'classic', madlibs: { adjective: '', place: '', food: '', sillyWord: '', animal: '' },
        sleepConfig: { subMode: 'automatic', texture: '', sound: '', scent: '', theme: DEFAULT_PREFERENCES.sleepTheme, ambientTheme: 'auto' },
        narratorVoice: DEFAULT_PREFERENCES.narratorVoice, storyLength: DEFAULT_PREFERENCES.storyLength
    });

    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [scenes, setScenes] = useState<Record<number, string>>({});
    const [isNarrating, setIsNarrating] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);

    // Sync online status and load history
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        
        storageManager.getAllStories().then(setHistory);
        
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // Main Story Generation Logic: Outline -> Initial Parts -> Background Expansion
    const generateStory = useCallback(async () => {
        if (!isOnline) return;
        if (!(await validateApiKey())) return;
        
        setIsLoading(true);
        setError(null);

        try {
            // 1. Generate Outline (The Blueprint)
            const outline = await AIClient.generateOutline(input);
            
            // 2. Generate Initial Chapters (First 2) to start immediately
            const initialParts = await AIClient.expandChapters(outline, 0, 1, input);
            
            // 3. Generate Finale Metadata
            const finale = await AIClient.generateFinale(outline, input);

            const initialStory: StoryFull = {
                title: outline.title,
                parts: initialParts,
                vocabWord: outline.vocabWord,
                rewardBadge: outline.rewardBadge,
                joke: finale.joke,
                lesson: finale.lesson,
                tomorrowHook: finale.tomorrowHook,
                isComplete: false
            };

            setStory(initialStory);
            setPhase('reading');
            setCurrentPartIndex(0);
            setIsLoading(false); // Move to reading while expansion happens

            // 4. Background Expansion Pipeline
            expandRemainingChapters(outline, initialStory);

        } catch (err: any) {
            setError(err.message || "Failed to engage the Multiverse.");
            setIsLoading(false);
        }
    }, [input, isOnline, validateApiKey]);

    const expandRemainingChapters = async (outline: StoryOutline, currentStory: StoryFull) => {
        let allParts = [...currentStory.parts];
        const batchSize = 2;
        
        for (let i = 2; i < outline.totalExpectedParts; i += batchSize) {
            try {
                const end = Math.min(i + batchSize - 1, outline.totalExpectedParts - 1);
                const newParts = await AIClient.expandChapters(outline, i, end, input);
                allParts = [...allParts, ...newParts];
                
                // Update story state incrementally
                setStory(prev => prev ? { 
                    ...prev, 
                    parts: allParts,
                    isComplete: i + batchSize >= outline.totalExpectedParts
                } : null);

                // Auto-generate a scene for the first of the new batch
                AIClient.generateSceneIllustration(newParts[0].text, input.heroName)
                    .then(url => url && setScenes(prev => ({ ...prev, [i]: url })));

            } catch (err) {
                console.error("Expansion failed for batch", i, err);
            }
        }
    };

    const stopNarration = useCallback(() => {
        narrationManager.stop();
        setIsNarrating(false);
    }, []);

    const playNarration = useCallback(async () => {
        if (!story) return;
        setIsNarrating(true);
        setIsNarrationLoading(true);
        try {
            const currentPart = story.parts[currentPartIndex];
            const isLastPart = currentPartIndex === story.parts.length - 1 && story.isComplete;
            const textToRead = isLastPart 
                ? `${currentPart.text}. Today's lesson is: ${story.lesson}. ${story.joke}. ${story.tomorrowHook}` 
                : currentPart.text;
            
            await narrationManager.fetchNarration(textToRead, input.narratorVoice, true);
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex, input.narratorVoice]);

    // Cleanup & Effects
    useEffect(() => {
        narrationManager.onEnded = () => {
            setIsNarrating(false);
            if (input.mode === 'sleep' && story) {
                if (currentPartIndex < story.parts.length - 1) {
                    setTimeout(() => setCurrentPartIndex(prev => prev + 1), 1000);
                }
            }
        };
    }, [input.mode, story, currentPartIndex]);

    return {
        phase, isLoading, isAvatarLoading, isSceneLoading, input, story, currentPartIndex, scenes, isNarrating, isNarrationLoading,
        isOnline, history, error, userPreferences,
        handleInputChange: (f: any, v: any) => setInput(p => ({ ...p, [f]: v })),
        handleMadLibChange: (field: keyof MadLibState, value: string) => {
            setInput(prev => ({ ...prev, madlibs: { ...prev.madlibs, [field]: value } }));
        },
        handleSleepConfigChange: (field: keyof SleepConfig, value: string) => {
            setInput(prev => ({ ...prev, sleepConfig: { ...prev.sleepConfig, [field]: value } }));
        },
        generateAvatar: async () => {
            setIsAvatarLoading(true);
            const url = await AIClient.generateAvatar(input.heroName, input.heroPower);
            if (url) setInput(p => ({ ...p, heroAvatarUrl: url }));
            setIsAvatarLoading(false);
        },
        generateStory,
        generateCurrentScene: async () => {
            const currentPart = story?.parts[currentPartIndex];
            if (currentPart) {
                setIsSceneLoading(true);
                const url = await AIClient.generateSceneIllustration(currentPart.text, input.heroName);
                if (url) setScenes(prev => ({ ...prev, [currentPartIndex]: url }));
                setIsSceneLoading(false);
            }
        },
        generateScene: async (index: number) => {
            const part = story?.parts[index];
            if (part) {
                const url = await AIClient.generateSceneIllustration(part.text, input.heroName);
                if (url) setScenes(prev => ({ ...prev, [index]: url }));
            }
        },
        prepareSequel: (cached: CachedStory) => {
            setInput(prev => ({
                ...prev,
                heroName: cached.story.title.split(' ')[0], 
                setting: 'A new adventure'
            }));
            setPhase('setup');
        },
        handleChoice: (choice: string) => {
            if (currentPartIndex < (story?.parts.length || 0) - 1) {
                setCurrentPartIndex(p => p + 1);
                soundManager.playPageTurn();
            }
        },
        reset: () => { setPhase('setup'); setStory(null); },
        playNarration, 
        stopNarration, 
        loadStoryFromHistory: (cached: CachedStory) => {
            setStory(cached.story);
            setInput(prev => ({ ...prev, heroAvatarUrl: cached.avatar || '' }));
            setPhase('reading');
            setCurrentPartIndex(0);
            setScenes(cached.scenes || {});
        },
        deleteStory: async (id: string) => {
            await storageManager.deleteStory(id);
            setHistory(prev => prev.filter(h => h.id !== id));
        },
        submitFeedback: async (rating: number, text: string) => {
            if (currentStoryId) {
                await storageManager.updateFeedback(currentStoryId, rating, text);
            }
        },
        saveUserPreferences: (p: any) => setUserPreferences(p),
        clearError: () => setError(null)
    };
};
