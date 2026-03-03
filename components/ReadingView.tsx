
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryFull, StoryState } from '../types';
import { SyncedText } from './SyncedText';

interface ReadingViewProps {
    story: StoryFull;
    input: StoryState;
    currentPartIndex: number;
    narrationTime: number;
    narrationDuration: number;
    isNarrating: boolean;
    isNarrationLoading: boolean;
    onTogglePlayback: () => void;
    onChoice: (choice: string) => void;
    onReset: () => void;
    fontSize: 'normal' | 'large';
}

export const ReadingView: React.FC<ReadingViewProps> = ({
    story, input, currentPartIndex, narrationTime, narrationDuration, isNarrating, isNarrationLoading,
    onTogglePlayback, onChoice, onReset, fontSize
}) => {
    const isSleepMode = input.mode === 'sleep';
    const progressPercent = narrationDuration > 0 ? (narrationTime / narrationDuration) * 100 : 0;
    const isExpanding = !story.isComplete;

    return (
        <div className={`min-h-screen w-full flex flex-col transition-colors duration-1000 ${isSleepMode ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-50 text-slate-900'}`}>
            
            {/* Epic Navigation Bar */}
            <header className="p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
                <button onClick={onReset} className="font-comic text-xl uppercase tracking-widest text-blue-400">Exit</button>
                <div className="flex flex-col items-center">
                    <h2 className="font-comic text-sm opacity-50 uppercase tracking-tighter">Issue: {story.title}</h2>
                    {isExpanding && (
                        <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[10px] text-green-400 font-mono font-bold"
                        >
                            • WRITING EPIC FINALE...
                        </motion.div>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center font-bold">
                    {currentPartIndex + 1}
                </div>
            </header>

            {/* Main Narrative Area */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-8 md:p-16">
                <AnimatePresence mode="wait">
                    <motion.article 
                        key={currentPartIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`${fontSize === 'large' ? 'text-3xl' : 'text-xl'} font-serif leading-relaxed`}
                    >
                        <SyncedText 
                            text={story.parts[currentPartIndex].text} 
                            isActive={isNarrating} 
                            currentTime={narrationTime} 
                            duration={narrationDuration} 
                        />
                    </motion.article>
                </AnimatePresence>

                {/* Interaction Footer */}
                {!isSleepMode && story.parts[currentPartIndex].choices && (
                    <div className="mt-12 grid gap-4">
                        {story.parts[currentPartIndex].choices?.map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => onChoice(c)}
                                className="comic-btn bg-blue-600 text-white p-6 text-xl rounded-2xl"
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* Audio Control Dock */}
            <footer className="p-8 border-t border-white/5 bg-black/20 backdrop-blur-2xl">
                <div className="flex items-center gap-8 justify-center">
                    <button 
                        onClick={onTogglePlayback}
                        className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-3xl shadow-2xl relative overflow-hidden"
                    >
                        {isNarrationLoading ? '⏳' : (isNarrating ? '⏸' : '▶')}
                        {/* Waveform Visualization Placeholder */}
                        {isNarrating && (
                            <div className="absolute inset-0 flex items-end gap-1 px-4 pb-2 opacity-30">
                                {[1,2,3,4,5].map(i => (
                                    <motion.div 
                                        key={i} 
                                        animate={{ height: ['20%', '80%', '20%'] }} 
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="flex-1 bg-white rounded-t-sm"
                                    />
                                ))}
                            </div>
                        )}
                    </button>
                    <div className="flex-1 max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-blue-400"
                            animate={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </footer>
        </div>
    );
};
