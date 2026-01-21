
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ApiKeyDialog } from './ApiKeyDialog';
import { LoadingFX } from './LoadingFX';
import { soundManager } from './SoundManager';
import { useApiKey } from './useApiKey';
import { useStoryEngine } from './hooks/useStoryEngine';
import { useNarrationSync } from './hooks/useNarrationSync';

// Lazy load main views for better initial chunking
const Setup = lazy(() => import('./Setup').then(m => ({ default: m.Setup })));
const ReadingView = lazy(() => import('./components/ReadingView').then(m => ({ default: m.ReadingView })));

const App: React.FC = () => {
    const { 
        validateApiKey, 
        setShowApiKeyDialog, 
        showApiKeyDialog, 
        handleApiKeyDialogContinue 
    } = useApiKey();

    const [isMuted, setIsMuted] = useState(false);

    const {
        phase,
        isLoading,
        isAvatarLoading,
        input,
        story,
        currentPartIndex,
        isNarrating,
        isNarrationLoading,
        isOnline,
        history,
        handleInputChange,
        handleMadLibChange,
        handleSleepConfigChange,
        generateAvatar,
        generateStory,
        handleChoice,
        reset,
        playNarration,
        stopNarration,
        loadStoryFromHistory,
        deleteStory,
        submitFeedback
    } = useStoryEngine(validateApiKey, setShowApiKeyDialog);

    const { narrationTime, narrationDuration, playbackRate, setPlaybackRate } = useNarrationSync(isNarrating);

    const toggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        soundManager.setMuted(nextMute);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-comic selection:bg-yellow-200 overflow-hidden">
            {/* Connection Status Banner */}
            {!isOnline && (
                <motion.div 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    className="fixed top-0 inset-x-0 bg-amber-500 text-black py-2 text-center text-sm font-bold z-[500] shadow-md border-b-2 border-black"
                >
                    🌙 OFFLINE MODE: Reading from Memory Jar only.
                </motion.div>
            )}

            <AnimatePresence>
                {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
            </AnimatePresence>
            
            <Suspense fallback={<LoadingFX />}>
                {phase === 'setup' && (
                    <Setup 
                        input={input} 
                        onChange={handleInputChange} 
                        onLaunch={generateStory} 
                        onGenerateAvatar={generateAvatar}
                        isLoading={isLoading} 
                        isAvatarLoading={isAvatarLoading}
                        isOnline={isOnline}
                        history={history}
                        onLoadHistory={loadStoryFromHistory}
                        handleSleepConfigChange={handleSleepConfigChange}
                        onDeleteHistory={deleteStory}
                    />
                )}

                {phase === 'reading' && story && (
                    <ReadingView 
                        story={story}
                        input={input}
                        currentPartIndex={currentPartIndex}
                        narrationTime={narrationTime}
                        narrationDuration={narrationDuration}
                        isNarrating={isNarrating}
                        isNarrationLoading={isNarrationLoading}
                        onTogglePlayback={playNarration}
                        onStopNarration={stopNarration}
                        onChoice={handleChoice}
                        onReset={reset}
                        toggleMute={toggleMute}
                        isMuted={isMuted}
                        playbackRate={playbackRate}
                        setPlaybackRate={setPlaybackRate}
                        onSubmitFeedback={submitFeedback}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default App;
