
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { StoryFull, StoryState } from '../types';
import { SyncedText } from './SyncedText';
import { narrationManager } from '../NarrationManager';
import { soundManager } from '../SoundManager';

interface ReadingViewProps {
    story: StoryFull;
    input: StoryState;
    currentPartIndex: number;
    narrationTime: number;
    narrationDuration: number;
    isNarrating: boolean;
    isNarrationLoading: boolean;
    scenes?: Record<number, string>;
    isSceneLoading?: boolean;
    onGenerateScene?: () => void;
    onGenerateSceneIndex?: (index: number) => void;
    onTogglePlayback: () => void;
    onStopNarration: () => void;
    onChoice: (choice: string) => void;
    onReset: () => void;
    toggleMute: () => void;
    isMuted: boolean;
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    onSubmitFeedback?: (rating: number, text: string) => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
    story, input, currentPartIndex, narrationTime, narrationDuration, isNarrating, isNarrationLoading,
    scenes = {}, isSceneLoading = false, onGenerateScene, onGenerateSceneIndex, onTogglePlayback, 
    onStopNarration, onChoice, onReset, toggleMute, isMuted, playbackRate, setPlaybackRate, onSubmitFeedback
}) => {
    const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: scrollRef });
    const isSleepMode = input.mode === 'sleep';

    const progressPercent = narrationDuration > 0 ? (narrationTime / narrationDuration) * 100 : 0;
    const storyProgress = ((currentPartIndex + 1) / story.parts.length) * 100;

    // Responsive font logic
    const getFontSizeClass = () => fontSize === 'large' ? 'text-2xl md:text-4xl' : 'text-lg md:text-2xl';

    // Auto-scroll for Sleep Mode (focus on current part)
    useEffect(() => {
        if (isSleepMode && scrollRef.current) {
            const container = scrollRef.current;
            const currentPart = container.querySelector(`[data-part="${currentPartIndex}"]`);
            if (currentPart) {
                currentPart.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentPartIndex, isSleepMode]);

    return (
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-[100dvh] flex flex-col bg-slate-950 font-serif" role="main" aria-label={`Story: ${story.title}`}>
            
            {/* Header Controls */}
            <header className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-[120] pointer-events-none">
                <div className="pointer-events-auto flex gap-2">
                    <button onClick={onReset} className="bg-white/10 hover:bg-white/20 p-2 rounded-full border border-white/20 backdrop-blur-md text-white px-4 font-comic text-xs uppercase" aria-label="Exit to menu">Menu</button>
                </div>
                <div className="pointer-events-auto flex gap-3">
                    <button onClick={() => setFontSize(f => f === 'normal' ? 'large' : 'normal')} className="bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/20 backdrop-blur-md text-white font-bold w-12 h-12 flex items-center justify-center" aria-label="Toggle font size">A+</button>
                    <button onClick={toggleMute} className="bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/20 backdrop-blur-md text-2xl w-12 h-12 flex items-center justify-center" aria-label={isMuted ? "Unmute" : "Mute"}>{isMuted ? '🔇' : '🔊'}</button>
                </div>
            </header>

            {/* Main Content Area */}
            <div ref={scrollRef} className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-1000 p-6 md:p-12 lg:p-24 ${isSleepMode ? 'bg-indigo-950 text-indigo-100' : 'bg-[#fdf6e3] text-gray-900'}`}>
                <div className="max-w-prose mx-auto space-y-16 pb-40">
                    <header className="flex flex-col items-center mb-10">
                        <motion.div layoutId="avatar" className="w-24 h-24 md:w-32 md:h-32 border-4 border-black rounded-full overflow-hidden shadow-xl mb-6 bg-white shrink-0">
                            <img src={scenes[currentPartIndex] || input.heroAvatarUrl} alt="Hero" className="w-full h-full object-cover" />
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl text-center uppercase font-black tracking-tight">{story.title}</h1>
                        <div className="h-1 w-20 bg-red-600 mt-4 rounded-full"></div>
                    </header>

                    {story.parts.map((part, i) => (
                        <motion.section 
                            key={i} 
                            data-part={i}
                            initial={{ opacity: 0, y: 30 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true, margin: "-100px" }}
                            className={`${getFontSizeClass()} leading-relaxed ${i > currentPartIndex ? 'opacity-20 pointer-events-none' : ''}`}
                        >
                            <SyncedText text={part.text} isActive={isNarrating && i === currentPartIndex} currentTime={narrationTime} duration={narrationDuration} />
                            
                            {i === currentPartIndex && part.choices && part.choices.length > 0 && !isSleepMode && (
                                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {part.choices.map((c, idx) => (
                                        <button key={idx} onClick={() => onChoice(c)} className="comic-btn p-4 text-left bg-blue-500 text-white rounded-xl border-4 border-black shadow-[4px_4px_0px_black] hover:scale-[1.02] active:scale-[0.98] transition-all">
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    ))}

                    {currentPartIndex === story.parts.length - 1 && (
                        <footer className="pt-20 border-t-4 border-dashed border-current space-y-10">
                            <div className="bg-white/5 p-8 rounded-3xl text-center border-2 border-current italic">
                                <h3 className="font-comic text-2xl uppercase mb-2">Lesson of the Day</h3>
                                <p className="text-xl md:text-2xl">{story.lesson}</p>
                            </div>
                            <button onClick={onReset} className="comic-btn w-full bg-red-600 text-white py-6 text-3xl rounded-xl shadow-[8px_8px_0px_black] uppercase font-comic">End Adventure</button>
                        </footer>
                    )}
                </div>
            </div>

            {/* Player Bar */}
            <motion.nav layout className={`p-4 md:p-6 border-t-4 border-black z-[130] flex flex-wrap items-center justify-center gap-4 md:gap-8 shadow-2xl ${isSleepMode ? 'bg-indigo-900 text-white' : 'bg-white text-black'}`}>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase opacity-60">Part {currentPartIndex + 1} of {story.parts.length}</span>
                    <div className="w-24 h-1.5 bg-black/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-current transition-all" style={{ width: `${storyProgress}%` }}></div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="260" strokeDashoffset={260 - (260 * progressPercent) / 100} className="opacity-40" />
                        </svg>
                        <button onClick={onTogglePlayback} className="text-4xl md:text-5xl hover:scale-110 active:scale-90 transition-transform" aria-label={isNarrating ? "Pause" : "Play"}>
                            {isNarrating ? '⏸️' : '▶️'}
                        </button>
                    </div>
                    <button onClick={onStopNarration} className="text-3xl opacity-40 hover:opacity-100 transition-opacity" aria-label="Stop">⏹️</button>
                </div>

                <div className="hidden sm:flex flex-col">
                    <span className="font-comic text-xl leading-none">Narrator: {input.narratorVoice}</span>
                    <div className="flex gap-2 mt-2">
                        {[0.8, 1.0, 1.2].map(r => (
                            <button key={r} onClick={() => setPlaybackRate(r)} className={`text-[10px] font-bold border-2 border-current px-2 py-0.5 rounded-full ${playbackRate === r ? 'bg-current text-white' : 'opacity-40'}`}>{r}x</button>
                        ))}
                    </div>
                </div>
            </motion.nav>
        </motion.main>
    );
};
