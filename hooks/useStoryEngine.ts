
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { StoryState, StoryFull, AppPhase, SleepConfig, MadLibState } from '../types';
import { AIClient } from '../AIClient';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';
import { storageManager, CachedStory } from '../lib/StorageManager';
import { logger } from '../lib/Logger';

export const useStoryEngine = (validateApiKey: () => Promise<boolean>, setShowApiKeyDialog: (show: boolean) => void) => {
    const [phase, setPhase] = useState<AppPhase>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const [isSceneLoading, setIsSceneLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [history, setHistory] = useState<CachedStory[]>([]);
    
    const [input, setInput] = useState<StoryState>({
        heroName: '', heroPower: '', setting: '', sidekick: '', problem: '',
        heroAvatarUrl: '', mode: 'classic', narratorVoice: 'Kore', storyLength: 'medium',
        madlibs: { adjective: '', place: '', food: '', sillyWord: '', animal: '', feeling: '' },
        sleepConfig: { subMode: 'automatic', texture: '', sound: '', scent: '', theme: 'Cloud Kingdom', ambientTheme: 'auto' }
    });

    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [scenes, setScenes] = useState<Record<number, string>>({}); 
    const [isNarrating, setIsNarrating] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);

    useEffect(() => {
        storageManager.getAllStories().then(setHistory);
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const stopNarration = useCallback(() => {
        narrationManager.stop();
        setIsNarrating(false);
    }, []);

    // Implement avatar generation using AIClient
    const generateAvatar = useCallback(async () => {
        if (!isOnline) return;
        const name = input.mode === 'classic' ? input.heroName : (input.mode === 'sleep' ? input.heroName : input.madlibs.animal);
        const power = input.mode === 'classic' ? input.heroPower : (input.mode === 'sleep' ? 'Sleeping' : input.madlibs.adjective);
        if (!name) return;
        if (!(await validateApiKey())) return;

        setIsAvatarLoading(true);
        try {
            const url = await AIClient.generateAvatar(name, power || 'Dreaming');
            if (url) {
                setInput(p => ({ ...p, heroAvatarUrl: url }));
                soundManager.playSparkle();
            }
        } catch (error: any) {
            logger.error('Avatar generation failed', error);
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsAvatarLoading(false);
        }
    }, [input, validateApiKey, isOnline, setShowApiKeyDialog]);

    const generateStory = useCallback(async () => {
        if (!isOnline) return;
        if (!(await validateApiKey())) return;
        setIsLoading(true);
        logger.info('Generating story', { mode: input.mode });
        try {
            const data = await AIClient.streamStory(input);
            const id = await storageManager.saveStory(data, input.heroAvatarUrl);
            setCurrentStoryId(id);
            setStory(data);
            setPhase('reading');
            setCurrentPartIndex(0);
            setHistory(await storageManager.getAllStories());
            soundManager.playPageTurn();
        } catch (error: any) {
            logger.error('Generation failed', error);
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsLoading(false);
        }
    }, [input, validateApiKey, isOnline, setShowApiKeyDialog]);

    // Implement scene illustration generation
    const generateScene = useCallback(async (index: number) => {
        if (!story || !currentStoryId || isSceneLoading || !isOnline) return;
        if (!(await validateApiKey())) return;
        
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
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsSceneLoading(false);
        }
    }, [story, currentStoryId, input, isSceneLoading, isOnline, validateApiKey, setShowApiKeyDialog]);

    const generateCurrentScene = useCallback(() => {
        generateScene(currentPartIndex);
    }, [generateScene, currentPartIndex]);

    // Implement sequel preparation logic
    const prepareSequel = useCallback((cached: CachedStory) => {
        setInput(prev => ({
            ...prev,
            heroName: cached.story.title.split(' ')[0],
            heroAvatarUrl: cached.avatar
        }));
        setPhase('setup');
    }, []);

    // Implement narration playback logic
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
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex, input.narratorVoice]);

    const handleChoice = useCallback((choice: string) => {
        if (currentPartIndex >= (story?.parts.length || 0) - 1) {
            setPhase('finished');
        } else {
            setCurrentPartIndex(prev => prev + 1);
            soundManager.playPageTurn();
        }
    }, [story, currentPartIndex]);

    const reset = useCallback(() => {
        stopNarration();
        setPhase('setup');
        setStory(null);
        setCurrentPartIndex(0);
        setScenes({});
    }, [stopNarration]);

    return {
        phase, isLoading, isAvatarLoading, isSceneLoading, input, story, currentPartIndex, scenes, isNarrating, isNarrationLoading,
        isOnline, history,
        handleInputChange: (f: keyof StoryState, v: any) => setInput(p => ({...p, [f]: v})),
        handleMadLibChange: (f: keyof MadLibState, v: string) => setInput(p => ({...p, madlibs: {...p.madlibs, [f]: v}})),
        handleSleepConfigChange: (f: keyof SleepConfig, v: string) => setInput(p => ({...p, sleepConfig: {...p.sleepConfig, [f]: v}})),
        generateAvatar,
        generateStory,
        generateCurrentScene,
        generateScene,
        prepareSequel,
        handleChoice,
        reset,
        playNarration,
        stopNarration,
        loadStoryFromHistory: (c: CachedStory) => { setStory(c.story); setScenes(c.scenes || {}); setPhase('reading'); },
        deleteStory: async (id: string) => { await storageManager.deleteStory(id); setHistory(await storageManager.getAllStories()); },
        submitFeedback: async (rating: number, text: string) => {
            if (currentStoryId) {
                await storageManager.updateFeedback(currentStoryId, rating, text);
            }
        }
    };
};
