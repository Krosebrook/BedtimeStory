
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { StoryState, StoryFull, AppPhase, MadLibState, SleepConfig } from '../types';
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
    
    const [input, setInput] = useState<StoryState>({
        heroName: '',
        heroPower: '',
        setting: '',
        sidekick: '',
        problem: '',
        heroAvatarUrl: '',
        mode: 'classic',
        narratorVoice: 'Kore',
        storyLength: 'medium',
        madlibs: { adjective: '', place: '', food: '', sillyWord: '', animal: '', feeling: '' },
        sleepConfig: { 
            subMode: 'automatic', 
            texture: '', 
            sound: '', 
            scent: '', 
            theme: 'Cloud Kingdom',
            ambientTheme: 'auto'
        }
    });

    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [scenes, setScenes] = useState<Record<number, string>>({}); // PartIndex -> Base64
    const [isNarrating, setIsNarrating] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);

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

    const handleInputChange = useCallback((field: keyof StoryState, value: any) => {
        setInput(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleMadLibChange = useCallback((field: keyof MadLibState, value: string) => {
        setInput(prev => ({ ...prev, madlibs: { ...prev.madlibs, [field]: value } }));
    }, []);

    const handleSleepConfigChange = useCallback((field: keyof SleepConfig, value: string) => {
        setInput(prev => ({ ...prev, sleepConfig: { ...prev.sleepConfig, [field]: value } }));
    }, []);

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
            const currentPart = story.parts[currentPartIndex];
            const isLastPart = currentPartIndex === story.parts.length - 1;
            const textToRead = isLastPart 
                ? `${currentPart.text}. Today's lesson is: ${story.lesson}. Here is a joke: ${story.joke}. ${story.tomorrowHook}` 
                : currentPart.text;
            
            await narrationManager.fetchNarration(textToRead, input.narratorVoice);
        } catch (err) {
            console.error("Narration failed", err);
            setIsNarrating(false);
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex, input.narratorVoice]);

    // Handle auto-advance for sleep mode
    useEffect(() => {
        narrationManager.onEnded = () => {
            setIsNarrating(false);
            if (input.mode === 'sleep' && story) {
                // Auto-advance logic
                if (currentPartIndex < story.parts.length - 1) {
                    setTimeout(() => {
                        setCurrentPartIndex(prev => prev + 1);
                    }, 1500); // 1.5s pause between chapters
                }
            }
        };
    }, [input.mode, story, currentPartIndex]);

    // Effect to auto-play when part index changes in sleep mode
    useEffect(() => {
        if (input.mode === 'sleep' && phase === 'reading' && story) {
            // Wait a bit then play
            const timer = setTimeout(() => {
                 if (!narrationManager.state.isPlaying) {
                     playNarration();
                 }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentPartIndex, input.mode, phase, story, playNarration]);

    const generateAvatar = useCallback(async () => {
        if (!isOnline) {
            alert("✨ Halt Citizen! You must be connected to the Multiverse to spark a new Avatar.");
            return;
        }
        const name = input.mode === 'classic' ? input.heroName : (input.mode === 'sleep' ? input.heroName : input.madlibs.animal);
        const power = input.mode === 'classic' ? input.heroPower : (input.mode === 'sleep' ? 'Sleeping' : input.madlibs.adjective);
        if (!name) return;
        if (!(await validateApiKey())) return;

        setIsAvatarLoading(true);
        try {
            const url = await AIClient.generateAvatar(name, power || 'Dreaming');
            if (url) {
                handleInputChange('heroAvatarUrl', url);
                soundManager.playSparkle();
            }
        } catch (error: any) {
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsAvatarLoading(false);
        }
    }, [input, validateApiKey, handleInputChange, setShowApiKeyDialog, isOnline]);

    const generateStory = useCallback(async () => {
        if (!isOnline) {
            alert("📜 The Memory Jar contains your past tales, but new adventures require a connection to the Infinite Library.");
            return;
        }
        if (!(await validateApiKey())) return;
        setIsLoading(true);
        try {
            const data = await AIClient.streamStory(input);
            const id = await storageManager.saveStory(data, input.heroAvatarUrl);
            setCurrentStoryId(id);
            
            // Refresh history
            const newHistory = await storageManager.getAllStories();
            setHistory(newHistory);
            
            setStory(data);
            setScenes({});
            setPhase('reading');
            setCurrentPartIndex(0);
            soundManager.playPageTurn();
        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsLoading(false);
        }
    }, [input, validateApiKey, setShowApiKeyDialog, isOnline]);

    /**
     * Generates a scene illustration for a specific part index.
     * Can be used for current scene or pre-fetching next.
     */
    const generateScene = useCallback(async (index: number) => {
        if (!story || !currentStoryId || !isOnline) return;
        // Check if scene already exists or is being fetched (we can track loading per index if needed, but simplest is check cache)
        if (scenes[index]) return; 
        
        // Ensure index is valid
        if (index < 0 || index >= story.parts.length) return;

        if (!(await validateApiKey())) return;

        // If we are generating the *current* scene, show loading state. 
        // If pre-fetching, we can be silent or use a separate loading state, but for now we reuse isSceneLoading if it's the current one.
        const isCurrent = index === currentPartIndex;
        if (isCurrent) setIsSceneLoading(true);

        try {
            const text = story.parts[index].text;
            const heroDesc = `${input.heroName} with power of ${input.heroPower || 'imagination'}`;
            const imageUrl = await AIClient.generateSceneIllustration(text, heroDesc);
            
            if (imageUrl) {
                await storageManager.saveStoryScene(currentStoryId, index, imageUrl);
                setScenes(prev => ({...prev, [index]: imageUrl}));
                if (isCurrent) soundManager.playSparkle();
            }
        } catch (error: any) {
             console.error(`Scene generation failed for index ${index}`, error);
             // Only show dialog if it was an explicit user action for current scene
             if (isCurrent && error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            if (isCurrent) setIsSceneLoading(false);
        }
    }, [story, currentStoryId, currentPartIndex, scenes, input, validateApiKey, setShowApiKeyDialog, isOnline]);

    const generateCurrentScene = useCallback(() => {
        return generateScene(currentPartIndex);
    }, [generateScene, currentPartIndex]);

    const loadStoryFromHistory = useCallback((cached: CachedStory) => {
        setStory(cached.story);
        setCurrentStoryId(cached.id);
        handleInputChange('heroAvatarUrl', cached.avatar || '');
        setScenes(cached.scenes || {});
        setPhase('reading');
        setCurrentPartIndex(0);
        soundManager.playPageTurn();
    }, [handleInputChange]);

    const prepareSequel = useCallback((cached: CachedStory) => {
        handleInputChange('heroAvatarUrl', cached.avatar || '');
        handleInputChange('sequelContext', {
            lastTitle: cached.story.title,
            lastHook: cached.story.tomorrowHook,
            lastLesson: cached.story.lesson
        });
        handleInputChange('problem', '');
        soundManager.playSparkle();
    }, [handleInputChange]);

    const deleteStory = useCallback(async (id: string) => {
        await storageManager.deleteStory(id);
        const newHistory = await storageManager.getAllStories();
        setHistory(newHistory);
        soundManager.playDelete();
    }, []);

    const submitFeedback = useCallback(async (rating: number, text: string) => {
        if (currentStoryId) {
            await storageManager.updateFeedback(currentStoryId, rating, text);
            const newHistory = await storageManager.getAllStories();
            setHistory(newHistory);
        }
    }, [currentStoryId]);

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
        setCurrentStoryId(null);
        setScenes({});
        setCurrentPartIndex(0);
        setInput(prev => ({ ...prev, heroAvatarUrl: '', sequelContext: undefined }));
    }, [stopNarration]);

    return {
        phase, isLoading, isAvatarLoading, isSceneLoading, input, story, currentPartIndex, scenes, isNarrating, isNarrationLoading,
        isOnline, history,
        handleInputChange, handleMadLibChange, handleSleepConfigChange, 
        generateAvatar, generateStory, generateCurrentScene, generateScene, prepareSequel,
        handleChoice, reset, playNarration, stopNarration, loadStoryFromHistory, deleteStory, submitFeedback
    };
};
