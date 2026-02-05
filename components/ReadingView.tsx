
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
    const isSleepMode = input.mode === 'sleep';

    const progressPercent = narrationDuration > 0 ? (narrationTime / narrationDuration) * 100 : 0;
    const storyProgress = ((currentPartIndex + 1) / story.parts.length) * 100;

    // Responsive fluid font size
    const getFontSizeClass = () => fontSize === 'large' ? 'text-xl md:text-3xl lg:text-4xl' : 'text-base md:text-xl lg:text-2xl';

    // Auto-scroll logic for extended sleep narratives
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
        <motion.main 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="relative w-full h-[100dvh] flex flex-col bg-slate-950 font-serif overflow-hidden" 
            role="main" 
            aria-label={`Reading story: ${story.title}`}
        >
            
            {/* Header Controls */}
            <header className="absolute top-0 inset-x-0 p-3 md:p-4 flex justify-between items-center z-[120] pointer-events-none">
                <div className="pointer-events-auto flex gap-2">
                    <button 
                        onClick={() => { onReset(); soundManager.playChoice(); }} 
                        className="bg-black/40 hover:bg-black/60 px-3 md:px-5 py-2 rounded-full border border-white/20 backdrop-blur-lg text-white font-comic text-[10px] md:text-xs uppercase tracking-widest outline-none ring-blue-500 focus:ring-2" 
                        aria-label="Back to home"
                    >Menu</button>
                </div>
                <div className="pointer-events-auto flex gap-2 md:gap-3">
                    <button 
                        onClick={() => { setFontSize(f => f === 'normal' ? 'large' : 'normal'); soundManager.playChoice(); }} 
                        className="bg-black/40 hover:bg-black/60 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 backdrop-blur-lg text-white font-bold flex items-center justify-center outline-none ring-blue-500 focus:ring-2" 
                        aria-label="Adjust font size"
                        title="Text Size"
                    >
                        {fontSize === 'normal' ? 'A' : 'A+'}
                    </button>
                    <button 
                        onClick={() => { toggleMute(); soundManager.playChoice(); }} 
                        className="bg-black/40 hover:bg-black/60 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 backdrop-blur-lg text-xl md:text-2xl flex items-center justify-center outline-none ring-blue-500 focus:ring-2" 
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </div>
            </header>

            {/* Content Scroller */}
            <div 
                ref={scrollRef} 
                className={`flex-1 overflow-y-auto custom-scrollbar transition-colors duration-2000 px-4 md:px-12 lg:px-24 py-16 md:py-24 ${isSleepMode ? 'bg-indigo-950 text-indigo-100/90' : 'bg-[#fcf8ef] text-gray-800'}`}
            >
                <article className="max-w-prose mx-auto space-y-12 md:space-y-16 pb-48">
                    <header className="flex flex-col items-center mb-12">
                        <motion.div 
                            layoutId="avatar" 
                            className={`w-28 h-28 md:w-40 md:h-40 border-[6px] border-black rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 bg-white shrink-0 rotate-1 ${isSleepMode ? 'opacity-80' : ''}`}
                        >
                            <img src={scenes[currentPartIndex] || input.heroAvatarUrl} alt={`Scene ${currentPartIndex + 1}`} className="w-full h-full object-cover" />
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl text-center uppercase font-black tracking-tight leading-none px-4 drop-shadow-sm">
                            {story.title}
                        </h1>
                        <div className="h-1.5 w-16 bg-red-600 mt-6 rounded-full opacity-50"></div>
                    </header>

                    {story.parts.map((part, i) => (
                        <motion.section 
                            key={i} 
                            data-part={i}
                            initial={{ opacity: 0, y: 40 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
                            className={`${getFontSizeClass()} leading-relaxed font-serif ${i > currentPartIndex ? 'opacity-10 grayscale blur-[2px] pointer-events-none' : 'opacity-100'} transition-all duration-1000`}
                        >
                            <SyncedText text={part.text} isActive={isNarrating && i === currentPartIndex} currentTime={narrationTime} duration={narrationDuration} />
                            
                            {i === currentPartIndex && part.choices && part.choices.length > 0 && !isSleepMode && (
                                <nav className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Story Decisions">
                                    {part.choices.map((c, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => onChoice(c)} 
                                            className="comic-btn p-4 text-left bg-blue-500 text-white rounded-2xl border-4 border-black shadow-[6px_6px_0px_black] hover:scale-[1.03] active:scale-[0.97] transition-all text-sm md:text-lg font-comic uppercase tracking-wide"
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </nav>
                            )}
                        </motion.section>
                    ))}

                    {currentPartIndex === story.parts.length - 1 && (
                        <footer className="pt-24 border-t-4 border-dashed border-black/10 space-y-12 text-center">
                            <section className="bg-black/5 p-6 md:p-10 rounded-3xl border-2 border-black/10">
                                <h3 className="font-comic text-xl md:text-3xl uppercase mb-4 tracking-widest text-red-600">The Wise Hero's Lesson</h3>
                                <p className="text-xl md:text-2xl leading-relaxed italic">"{story.lesson}"</p>
                            </section>
                            
                            <section className="bg-yellow-100/50 p-6 md:p-8 rounded-3xl border-2 border-yellow-200">
                                <h4 className="font-comic text-lg md:text-xl uppercase mb-2 text-yellow-800 tracking-wide">A Chuckle for the Road</h4>
                                <p className="text-lg md:text-xl font-comic text-slate-700">{story.joke}</p>
                            </section>

                            <button 
                                onClick={() => { onReset(); soundManager.playChoice(); }} 
                                className="comic-btn w-full bg-red-600 text-white py-5 md:py-6 text-2xl md:text-4xl rounded-2xl shadow-[10px_10px_0px_black] uppercase font-comic tracking-widest"
                            >
                                MISSION COMPLETE
                            </button>
                        </footer>
                    )}
                </article>
            </div>

            {/* Persistent Control Hub */}
            <motion.nav 
                layout 
                className={`p-3 md:p-6 border-t-[6px] border-black z-[130] flex flex-wrap items-center justify-between md:justify-center gap-4 md:gap-12 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] ${isSleepMode ? 'bg-indigo-900 text-white' : 'bg-white text-black'}`}
                aria-label="Playback Controls"
            >
                <div className="flex flex-col items-center md:items-start order-2 md:order-1 min-w-[100px]">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">
                        Journey Segment {currentPartIndex + 1} / {story.parts.length}
                    </span>
                    <div className="w-20 md:w-32 h-2 bg-black/10 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            className="h-full bg-blue-500 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${storyProgress}%` }}
                            transition={{ type: 'spring', stiffness: 50 }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8 order-1 md:order-2">
                    <div className="relative w-14 h-14 md:w-20 md:h-20 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle 
                                cx="50%" cy="50%" r="42%" 
                                fill="transparent" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                                strokeDasharray="260" 
                                strokeDashoffset={260 - (260 * progressPercent) / 100} 
                                className="opacity-20 transition-all duration-300" 
                            />
                        </svg>
                        <button 
                            onClick={() => { onTogglePlayback(); soundManager.playChoice(); }} 
                            disabled={isNarrationLoading}
                            className={`text-3xl md:text-5xl hover:scale-110 active:scale-90 transition-transform flex items-center justify-center outline-none ${isNarrationLoading ? 'animate-pulse opacity-50' : ''}`} 
                            aria-label={isNarrating ? "Pause" : "Play"}
                        >
                            {isNarrationLoading ? '⏳' : (isNarrating ? '⏸️' : '▶️')}
                        </button>
                    </div>
                    <button 
                        onClick={() => { onStopNarration(); soundManager.playChoice(); }} 
                        className="text-2xl md:text-3xl opacity-30 hover:opacity-100 hover:text-red-500 transition-all outline-none" 
                        aria-label="Stop Playback"
                    >⏹️</button>
                </div>

                <div className="flex flex-col items-center md:items-end order-3 md:order-3 min-w-[120px]">
                    <span className="font-comic text-[10px] md:text-sm uppercase tracking-wider opacity-60">
                        {input.narratorVoice} Spirit
                    </span>
                    <div className="flex gap-1.5 mt-2" role="group" aria-label="Playback speed">
                        {[0.8, 1.0, 1.2].map(r => (
                            <button 
                                key={r} 
                                onClick={() => { setPlaybackRate(r); soundManager.playChoice(); }} 
                                className={`text-[8px] md:text-[10px] font-black border-2 border-current px-2 py-0.5 rounded-full transition-all ${playbackRate === r ? 'bg-current text-white scale-110' : 'opacity-30 hover:opacity-60'}`}
                                aria-pressed={playbackRate === r}
                            >
                                {r}x
                            </button>
                        ))}
                    </div>
                </div>
            </motion.nav>
        </motion.main>
    );
};
