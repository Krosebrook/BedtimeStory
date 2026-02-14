
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { StoryState, StoryFull, AppPhase, MadLibState, SleepConfig, UserPreferences, DEFAULT_PREFERENCES } from '../types';
import { AIClient } from '../AIClient';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';
import { storageManager, CachedStory } from '../lib/StorageManager';
import { logger } from '../lib/Logger';

export const useStoryEngine = (checkHealth: () => Promise<boolean>) => {
    const [phase, setPhase] = useState<AppPhase>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [history, setHistory] = useState<CachedStory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    
    const [input, setInput] = useState<StoryState>({
        heroName: '',
        heroPower: '',
        setting: '',
        sidekick: '',
        problem: '',
        heroAvatarUrl: '',
        mode: 'classic',
        madlibs: { adjective: '', place: '', food: '', sillyWord: '', animal: '' },
        sleepConfig: { 
            subMode: 'automatic', 
            texture: '', 
            sound: '', 
            scent: '', 
            theme: DEFAULT_PREFERENCES.sleepTheme,
            ambientTheme: 'auto'
        },
        narratorVoice: DEFAULT_PREFERENCES.narratorVoice,
        storyLength: DEFAULT_PREFERENCES.storyLength
    });

    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [scenes, setScenes] = useState<Record<number, string>>({});
    const [isNarrating, setIsNarrating] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);
    const [isSceneLoading, setIsSceneLoading] = useState(false);
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);

    // Load preferences and history
    useEffect(() => {
        const initData = async () => {
            try {
                // Load Prefs
                const prefs = await storageManager.getPreferences();
                setUserPreferences(prefs);
                
                // Update input defaults with loaded prefs
                setInput(prev => ({
                    ...prev,
                    narratorVoice: prefs.narratorVoice,
                    storyLength: prefs.storyLength,
                    sleepConfig: { ...prev.sleepConfig, theme: prefs.sleepTheme }
                }));

                // Load History
                const hist = await storageManager.getAllStories();
                setHistory(hist);
            } catch (e) {
                console.error("Failed to load data", e);
            }
        };

        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        
        initData();
        
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const saveUserPreferences = useCallback(async (newPrefs: UserPreferences) => {
        await storageManager.savePreferences(newPrefs);
        setUserPreferences(newPrefs);
        
        // Update current session if in Setup phase
        if (phase === 'setup') {
            setInput(prev => ({
                ...prev,
                narratorVoice: newPrefs.narratorVoice,
                storyLength: newPrefs.storyLength,
                sleepConfig: { ...prev.sleepConfig, theme: newPrefs.sleepTheme }
            }));
        }
        
        // Update global managers immediately
        soundManager.setMuted(newPrefs.isMuted);
    }, [phase]);

    const handleInputChange = useCallback((field: keyof StoryState, value: any) => {
        setInput(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    }, [error]);

    const handleMadLibChange = useCallback((field: keyof MadLibState, value: string) => {
        setInput(prev => ({ ...prev, madlibs: { ...prev.madlibs, [field]: value } }));
        if (error) setError(null);
    }, [error]);

    const handleSleepConfigChange = useCallback((field: keyof SleepConfig, value: string) => {
        setInput(prev => ({ ...prev, sleepConfig: { ...prev.sleepConfig, [field]: value } }));
        if (error) setError(null);
    }, [error]);

    const stopNarration = useCallback(() => {
        narrationManager.stop();
        setIsNarrating(false);
    }, []);

    const playNarration = useCallback(async () => {
        if (!story) return;
        const state = narrationManager.state;
        if (state.isPaused) { narrationManager.play(); return; }
        if (state.isPlaying) { narrationManager.pause(); return; }

        setIsNarrating(true);
        setIsNarrationLoading(true);
        try {
            // 1. Play Current
            const currentPart = story.parts[currentPartIndex];
            const isLastPart = currentPartIndex === story.parts.length - 1;
            const textToRead = isLastPart 
                ? `${currentPart.text}. Today's lesson is: ${story.lesson}. Here is a joke: ${story.joke}. ${story.tomorrowHook}` 
                : currentPart.text;
            
            // Wait for current to load and play
            await narrationManager.fetchNarration(textToRead, input.narratorVoice, true);

            // 2. Preload Next (Fire and Forget)
            if (!isLastPart) {
                const nextPart = story.parts[currentPartIndex + 1];
                const nextIsLast = currentPartIndex + 1 === story.parts.length - 1;
                const nextText = nextIsLast
                    ? `${nextPart.text}. Today's lesson is: ${story.lesson}. Here is a joke: ${story.joke}. ${story.tomorrowHook}`
                    : nextPart.text;
                
                // Preload with autoPlay = false
                narrationManager.fetchNarration(nextText, input.narratorVoice, false)
                    .catch(err => console.warn("Preload failed", err));
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex, input.narratorVoice]);

    // Handle auto-advance for sleep mode
    useEffect(() => {
        narrationManager.onEnded = () => {
            setIsNarrating(false);
            if (input.mode === 'sleep' && story) {
                if (currentPartIndex < story.parts.length - 1) {
                    // Reduced delay for continuous feel, relying on preloaded audio
                    setTimeout(() => {
                        setCurrentPartIndex(prev => prev + 1);
                    }, 500); 
                }
            }
        };
    }, [input.mode, story, currentPartIndex]);

    // Effect to auto-play when part index changes in sleep mode
    useEffect(() => {
        if (input.mode === 'sleep' && phase === 'reading' && story) {
            const timer = setTimeout(() => {
                 if (!narrationManager.state.isPlaying) {
                     playNarration();
                 }
            }, 100); // Fast auto-play trigger
            return () => clearTimeout(timer);
        }
    }, [currentPartIndex, input.mode, phase, story, playNarration]);

    const generateAvatar = useCallback(async () => {
        if (!isOnline) {
             setError("You are offline. Connect to internet to generate avatar.");
             return;
        }
        
        const name = input.mode === 'classic' || input.mode === 'sleep' ? input.heroName : input.madlibs.animal;
        const power = input.mode === 'classic' ? input.heroPower : (input.mode === 'sleep' ? 'Sleeping' : input.madlibs.adjective);
        
        if (!name || name.trim().length === 0) {
            setError("Please name your hero first!");
            return;
        }

        if (!(await checkHealth())) return;

        setIsAvatarLoading(true);
        setError(null);
        try {
            const url = await AIClient.generateAvatar(name, power || 'Dreaming');
            if (url) {
                handleInputChange('heroAvatarUrl', url);
                soundManager.playSparkle();
            }
        } catch (error: any) {
            logger.error("Avatar generation failed", error);
            setError(`Avatar Error: ${error.message || "Could not generate hero."}`);
        } finally {
            setIsAvatarLoading(false);
        }
    }, [input, checkHealth, handleInputChange, isOnline]);

    const generateStory = useCallback(async () => {
        if (!isOnline) {
            setError("You are currently offline. Please connect to the internet to generate a new story.");
            return;
        }
        if (!(await checkHealth())) return;
        
        setIsLoading(true);
        setError(null);

        try {
            const data = await AIClient.streamStory(input);
            const id = await storageManager.saveStory(data, input.heroAvatarUrl);
            setCurrentStoryId(id);
            const newHistory = await storageManager.getAllStories();
            setHistory(newHistory);
            
            setStory(data);
            setPhase('reading');
            setCurrentPartIndex(0);
            soundManager.playPageTurn();
        } catch (error: any) {
            logger.error("Story generation failed", error);
            const msg = error.message || "Unknown error";
            setError(msg.includes("API_KEY") ? "Invalid API Key configuration." : `Mission Failed: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    }, [input, checkHealth, isOnline]);

    const generateScene = useCallback(async (index: number) => {
        if (!story || !currentStoryId || isSceneLoading || !isOnline) return;
        if (!(await checkHealth())) return;
        
        setIsSceneLoading(true);
        try {
            const context = story.parts[index].text;
            const heroDescription = `${input.heroName} with ${input.heroPower}`;
            const imageUrl = await AIClient.generateSceneIllustration(context, heroDescription);
            if (imageUrl) {
                setScenes(prev => ({ ...prev, [index]: imageUrl }));
                await storageManager.saveStoryScene(currentStoryId, index, imageUrl);
            }
        } catch (error: any) {
            logger.error('Scene generation failed', error);
        } finally {
            setIsSceneLoading(false);
        }
    }, [story, currentStoryId, input, isSceneLoading, isOnline, checkHealth]);

    const generateCurrentScene = useCallback(() => {
        generateScene(currentPartIndex);
    }, [generateScene, currentPartIndex]);

    const prepareSequel = useCallback((cached: CachedStory) => {
        setInput(prev => ({
            ...prev,
            heroName: cached.story.title.split(' ')[0],
            heroAvatarUrl: cached.avatar
        }));
        setPhase('setup');
        setError(null);
    }, []);

    const loadStoryFromHistory = useCallback((cached: CachedStory) => {
        setStory(cached.story);
        handleInputChange('heroAvatarUrl', cached.avatar || '');
        setScenes(cached.scenes || {});
        setPhase('reading');
        setCurrentPartIndex(0);
        soundManager.playPageTurn();
        setError(null);
    }, [handleInputChange]);

    const handleChoice = useCallback((choice: string) => {
        soundManager.playChoice();
        stopNarration();
        if (currentPartIndex < (story?.parts.length || 0) - 1) {
            setCurrentPartIndex(prev => prev + 1);
            soundManager.playPageTurn();
            if (isNarrating) setTimeout(() => playNarration(), 1200);
        }
    }, [story, currentPartIndex, isNarrating, playNarration, stopNarration]);

    const reset = useCallback(() => {
        stopNarration();
        setPhase('setup');
        setStory(null);
        setCurrentPartIndex(0);
        setScenes({});
        setInput(prev => ({ ...prev, heroAvatarUrl: '' }));
        setError(null);
    }, [stopNarration]);

    const deleteStory = async (id: string) => { 
        await storageManager.deleteStory(id); 
        setHistory(await storageManager.getAllStories()); 
    };

    const submitFeedback = async (rating: number, text: string) => {
        if (currentStoryId) {
            await storageManager.updateFeedback(currentStoryId, rating, text);
        }
    };

    return {
        phase, isLoading, isAvatarLoading, isSceneLoading, input, story, currentPartIndex, scenes, isNarrating, isNarrationLoading,
        isOnline, history, error, userPreferences,
        handleInputChange, handleMadLibChange, handleSleepConfigChange, 
        generateAvatar, generateStory, generateCurrentScene, generateScene,
        handleChoice, reset, playNarration, stopNarration, loadStoryFromHistory, 
        prepareSequel, deleteStory, submitFeedback, saveUserPreferences,
        clearError: () => setError(null)
    };
};
