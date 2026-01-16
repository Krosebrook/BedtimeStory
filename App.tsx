
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Setup } from './Setup';
import { ReadingView } from './components/ReadingView';
import { ApiKeyDialog } from './ApiKeyDialog';
import { LoadingFX } from './LoadingFX';
import { soundManager } from './SoundManager';
import { useApiKey } from './useApiKey';
import { useStoryEngine } from './hooks/useStoryEngine';
import { useNarrationSync } from './hooks/useNarrationSync';

const App: React.FC = () => {
    // 1. Core Services
    const { 
        validateApiKey, 
        setShowApiKeyDialog, 
        showApiKeyDialog, 
        handleApiKeyDialogContinue 
    } = useApiKey();

    const [isMuted, setIsMuted] = useState(false);

    // 2. Business Logic Engine
    const {
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
    } = useStoryEngine(validateApiKey, setShowApiKeyDialog);

    // 3. Audio Synchronization Logic
    const { narrationTime, narrationDuration } = useNarrationSync(isNarrating);

    // 4. UI Handlers
    const toggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        soundManager.setMuted(nextMute);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-comic selection:bg-yellow-200">
            <AnimatePresence>
                {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
                {isLoading && <LoadingFX key="loading" />}
            </AnimatePresence>
            
            {phase === 'setup' && (
                <Setup 
                    input={input} 
                    onChange={handleInputChange} 
                    onLaunch={generateStory} 
                    onGenerateAvatar={generateAvatar}
                    isLoading={isLoading} 
                    isAvatarLoading={isAvatarLoading}
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
                />
            )}
        </div>
    );
};

export default App;
