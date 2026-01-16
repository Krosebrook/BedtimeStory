
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect } from 'react';
import { StoryState, StoryFull, AppPhase, MadLibState } from '../types';
import { AIClient } from '../AIClient';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';
import { storageManager, CachedStory } from '../lib/StorageManager';

export const useStoryEngine = (validateApiKey: () => Promise<boolean>, setShowApiKeyDialog: (show: boolean) => void) => {
    const [phase, setPhase] = useState<AppPhase>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
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
        madlibs: { adjective: '', place: '', food: '', sillyWord: '', animal: '', feeling: '' }
    });

    const [story, setStory] = useState<StoryFull | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
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
            await narrationManager.fetchNarration(textToRead);
        } finally {
            setIsNarrationLoading(false);
        }
    }, [story, currentPartIndex]);

    const generateAvatar = useCallback(async () => {
        if (!isOnline) return;
        const name = input.mode === 'classic' ? input.heroName : input.madlibs.animal;
        const power = input.mode === 'classic' ? input.heroPower : input.madlibs.adjective;
        if (!name || !power) return;
        if (!(await validateApiKey())) return;

        setIsAvatarLoading(true);
        try {
            const url = await AIClient.generateAvatar(name, power);
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
        if (!isOnline) return;
        if (!(await validateApiKey())) return;
        setIsLoading(true);
        try {
            const data = await AIClient.streamStory(input);
            // Save to offline storage automatically
            await storageManager.saveStory(data, input.heroAvatarUrl);
            // Refresh history
            const newHistory = await storageManager.getAllStories();
            setHistory(newHistory);
            
            setStory(data);
            setPhase('reading');
            setCurrentPartIndex(0);
            soundManager.playPageTurn();
        } catch (error: any) {
            if (error.message?.includes("404")) setShowApiKeyDialog(true);
        } finally {
            setIsLoading(false);
        }
    }, [input, validateApiKey, setShowApiKeyDialog, isOnline]);

    const loadStoryFromHistory = useCallback((cached: CachedStory) => {
        setStory(cached.story);
        handleInputChange('heroAvatarUrl', cached.avatar || '');
        setPhase('reading');
        setCurrentPartIndex(0);
        soundManager.playPageTurn();
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
        setInput(prev => ({ ...prev, heroAvatarUrl: '' }));
    }, [stopNarration]);

    return {
        phase, isLoading, isAvatarLoading, input, story, currentPartIndex, isNarrating, isNarrationLoading,
        isOnline, history,
        handleInputChange, handleMadLibChange, generateAvatar, generateStory, handleChoice, reset, playNarration, stopNarration, loadStoryFromHistory
    };
};
