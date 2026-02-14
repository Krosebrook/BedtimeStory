
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsModal } from './components/SettingsModal';

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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const {
        phase,
        isLoading,
        isAvatarLoading,
        isSceneLoading,
        input,
        story,
        currentPartIndex,
        scenes,
        isNarrating,
        isNarrationLoading,
        isOnline,
        history,
        error,
        userPreferences,
        handleInputChange,
        handleMadLibChange,
        handleSleepConfigChange,
        generateAvatar,
        generateStory,
        generateCurrentScene,
        generateScene,
        prepareSequel,
        handleChoice,
        reset,
        playNarration,
        stopNarration,
        loadStoryFromHistory,
        deleteStory,
        submitFeedback,
        saveUserPreferences,
        clearError
    } = useStoryEngine(validateApiKey, setShowApiKeyDialog);

    const { narrationTime, narrationDuration, playbackRate, setPlaybackRate } = useNarrationSync(isNarrating);

    // Apply reduced motion globally if preferred
    if (userPreferences.reducedMotion) {
        document.documentElement.style.scrollBehavior = 'auto';
    } else {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

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
                {isSettingsOpen && (
                    <SettingsModal 
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        currentPrefs={userPreferences}
                        onSave={saveUserPreferences}
                        onReset={() => saveUserPreferences({...userPreferences, ...{narratorVoice:'Kore', storyLength:'medium', fontSize:'normal', isMuted:false, reducedMotion:false}})} // Basic reset for now
                    />
                )}
            </AnimatePresence>
            
            <Suspense fallback={<LoadingFX />}>
                {phase === 'setup' && (
                    <ErrorBoundary>
                        <Setup 
                            input={input} 
                            onChange={handleInputChange} 
                            handleMadLibChange={handleMadLibChange}
                            onLaunch={generateStory} 
                            onGenerateAvatar={generateAvatar}
                            isLoading={isLoading} 
                            isAvatarLoading={isAvatarLoading}
                            isOnline={isOnline}
                            history={history}
                            onLoadHistory={loadStoryFromHistory}
                            handleSleepConfigChange={handleSleepConfigChange}
                            onDeleteHistory={deleteStory}
                            onPrepareSequel={prepareSequel}
                            error={error}
                            onClearError={clearError}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    </ErrorBoundary>
                )}

                {phase === 'reading' && story && (
                    <ErrorBoundary>
                        <ReadingView 
                            story={story}
                            input={input}
                            currentPartIndex={currentPartIndex}
                            narrationTime={narrationTime}
                            narrationDuration={narrationDuration}
                            isNarrating={isNarrating}
                            isNarrationLoading={isNarrationLoading}
                            scenes={scenes}
                            isSceneLoading={isSceneLoading}
                            onGenerateScene={generateCurrentScene}
                            onGenerateSceneIndex={generateScene}
                            onTogglePlayback={playNarration}
                            onStopNarration={stopNarration}
                            onChoice={handleChoice}
                            onReset={reset}
                            toggleMute={() => saveUserPreferences({...userPreferences, isMuted: !userPreferences.isMuted})}
                            isMuted={userPreferences.isMuted}
                            playbackRate={playbackRate}
                            setPlaybackRate={setPlaybackRate}
                            onSubmitFeedback={submitFeedback}
                            fontSize={userPreferences.fontSize}
                            onChangeFontSize={(size) => saveUserPreferences({...userPreferences, fontSize: size})}
                        />
                    </ErrorBoundary>
                )}
            </Suspense>
        </div>
    );
};

export default App;
