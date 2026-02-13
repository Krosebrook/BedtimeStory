/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, MadLibState, SleepConfig, AppMode } from '../../types';
import { HeroHeader } from '../../HeroHeader';
import { CachedStory } from '../../lib/StorageManager';
import { LoadingFX } from '../../LoadingFX';
import { ModeSetup } from './ModeSetup';
import { VoiceSelector } from './VoiceSelector';
import { MemoryJar } from './MemoryJar';
import { soundManager } from '../../SoundManager';

interface SetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
    onLaunch: () => void;
    onGenerateAvatar: () => void;
    isLoading: boolean;
    isAvatarLoading: boolean;
    isOnline: boolean;
    history: CachedStory[];
    onLoadHistory: (cached: CachedStory) => void;
    handleSleepConfigChange: (field: keyof SleepConfig, value: string) => void;
    onDeleteHistory: (id: string) => void;
    onPrepareSequel: (cached: CachedStory) => void;
    error?: string | null;
    onClearError?: () => void;
    onOpenSettings: () => void;
}

/**
 * Helper to determine if the current configuration is valid for launch.
 */
const checkIsReady = (input: StoryState): boolean => {
    switch (input.mode) {
        case 'sleep':
            return !!input.heroName && input.heroName.trim().length > 0;
        case 'madlibs':
            return Object.values(input.madlibs).every(v => (v as string).trim().length > 0);
        case 'classic':
        default:
            return !!input.heroName && input.heroName.trim().length > 0 && 
                   !!input.setting && input.setting.trim().length > 0;
    }
};

/**
 * Helper to get the context-aware label for the primary action button.
 */
const getLaunchButtonText = (mode: AppMode, isLoading: boolean): string => {
    if (isLoading) return 'INITIATING...';
    return mode === 'sleep' ? 'BEGIN DREAM-LOG' : 'ENGAGE MISSION';
};

export const Setup: React.FC<SetupProps> = ({ 
    input, 
    onChange, 
    handleMadLibChange,
    onLaunch, 
    onGenerateAvatar, 
    isLoading, 
    isAvatarLoading, 
    isOnline, 
    history, 
    onLoadHistory, 
    handleSleepConfigChange, 
    onDeleteHistory, 
    error,
    onClearError,
    onOpenSettings
}) => {
    const isReady = useMemo(() => checkIsReady(input), [input]);
    const launchButtonText = useMemo(() => getLaunchButtonText(input.mode, isLoading), [input.mode, isLoading]);
    const [isMemoryJarOpen, setIsMemoryJarOpen] = useState(false);

    return (
        <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center py-6 md:py-10 px-4 md:px-8 overflow-y-auto" role="main">
            
            {/* Full Screen Loading Overlay with Dynamic Context */}
            <AnimatePresence>
                {isLoading && (
                    <LoadingFX 
                        embedded={false} 
                        mode={input.mode} 
                        heroName={input.mode === 'madlibs' ? input.madlibs.animal : input.heroName} 
                    />
                )}
            </AnimatePresence>

            {/* Utility Bar */}
            <div className="absolute top-4 right-4 z-50 flex gap-4">
                <button 
                    onClick={() => { setIsMemoryJarOpen(true); soundManager.playChoice(); }}
                    className="w-12 h-12 bg-indigo-900 rounded-full border-4 border-black flex items-center justify-center text-2xl shadow-[4px_4px_0px_black] hover:scale-110 transition-transform active:scale-95"
                    aria-label="Open Memory Jar"
                    title="Saved Stories"
                >
                    🏺
                </button>
                <button 
                    onClick={() => { onOpenSettings(); soundManager.playChoice(); }}
                    className="w-12 h-12 bg-white rounded-full border-4 border-black flex items-center justify-center text-2xl shadow-[4px_4px_0px_black] hover:scale-110 transition-transform hover:rotate-90 active:scale-95"
                    aria-label="Settings"
                    title="Settings"
                >
                    ⚙️
                </button>
            </div>

            <HeroHeader activeMode={input.mode} onModeChange={(mode) => onChange('mode', mode)} onImageUpload={(url) => {
                    onChange('heroAvatarUrl', url);
                    soundManager.playSparkle();
                }} />

            <div className="max-w-4xl w-full">
                <motion.section 
                    layout 
                    className={`border-[6px] border-black shadow-[12px_12px_0px_rgba(30,58,138,0.3)] p-4 md:p-10 relative z-20 rounded-sm flex flex-col min-h-[450px] md:min-h-[500px] overflow-hidden transition-colors duration-1000 ${input.mode === 'sleep' ? 'bg-indigo-950 text-indigo-50' : 'bg-white text-black'}`}
                >
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-500 text-white p-4 border-4 border-black mb-6 rounded-xl flex items-center justify-between shadow-[4px_4px_0px_black] z-50 relative"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">⚠️</span>
                                    <div>
                                        <p className="font-comic text-xl uppercase leading-none">Transmission Interrupted!</p>
                                        <p className="text-sm opacity-90 font-mono mt-1">{error}</p>
                                    </div>
                                </div>
                                <button onClick={onClearError} className="bg-black/20 hover:bg-black/40 p-2 rounded-lg text-sm font-bold uppercase">Dismiss</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="flex-1 w-full overflow-x-hidden">
                        <ModeSetup 
                            input={input}
                            onChange={onChange}
                            handleMadLibChange={handleMadLibChange}
                            handleSleepConfigChange={handleSleepConfigChange}
                            isAvatarLoading={isAvatarLoading}
                            onGenerateAvatar={onGenerateAvatar}
                        />
                    </div>

                    <VoiceSelector 
                        selectedVoice={input.narratorVoice}
                        onVoiceChange={(v) => onChange('narratorVoice', v)}
                        mode={input.mode}
                    />

                    <button 
                        onClick={onLaunch} 
                        disabled={!isReady || isLoading || !isOnline} 
                        className={`comic-btn w-full mt-10 md:mt-12 py-5 md:py-6 text-2xl md:text-4xl rounded-2xl transition-all ${isReady && !isLoading ? (input.mode === 'sleep' ? 'bg-indigo-600 text-white border-white shadow-[0_10px_40px_rgba(99,102,241,0.5)]' : 'bg-red-600 text-white shadow-[10px_10px_0px_black] active:translate-y-1') : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300'}`} 
                        aria-label="Start Story"
                    >
                        {launchButtonText}
                    </button>
                </motion.section>
            </div>

            {/* Collapsible Memory Jar Drawer */}
            <MemoryJar 
                isOpen={isMemoryJarOpen}
                onClose={() => setIsMemoryJarOpen(false)}
                history={history}
                onLoadHistory={onLoadHistory}
                onDeleteHistory={onDeleteHistory}
            />
        </main>
    );
};