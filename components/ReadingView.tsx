
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    onTogglePlayback: () => void;
    onStopNarration: () => void;
    onChoice: (choice: string) => void;
    onReset: () => void;
    toggleMute: () => void;
    isMuted: boolean;
}

/**
 * ReadingView
 * 
 * The main narrative interface. Features:
 * - Parallax background layers reacting to scroll.
 * - Staggered text entry with blur effects.
 * - Audio progress ring with interactive media controls.
 */
export const ReadingView: React.FC<ReadingViewProps> = ({
    story,
    input,
    currentPartIndex,
    narrationTime,
    narrationDuration,
    isNarrating,
    isNarrationLoading,
    onTogglePlayback,
    onStopNarration,
    onChoice,
    onReset,
    toggleMute,
    isMuted
}) => {
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Create scroll-driven parallax offsets
    const { scrollYProgress } = useScroll({ container: scrollRef });
    const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
    const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 35]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -35]);

    const progressPercent = narrationDuration > 0 ? (narrationTime / narrationDuration) * 100 : 0;

    return (
        <motion.main 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-4xl h-[92vh] flex flex-col p-4"
            role="main"
            aria-label={`Reading story: ${story.title}`}
        >
            {/* Top Toolbar */}
            <div className="absolute top-0 right-4 flex gap-4 z-[120]">
                <button 
                    onClick={toggleMute}
                    className="bg-white/10 hover:bg-white/20 p-3 rounded-full border-2 border-white/20 backdrop-blur-md transition-all text-2xl shadow-lg"
                    aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>

            <div 
                ref={scrollRef}
                className="bg-[#fdf6e3] w-full h-full p-6 md:p-16 border-[8px] border-black shadow-[24px_24px_0px_rgba(0,0,0,1)] overflow-y-auto custom-scrollbar relative overflow-hidden rounded-sm"
            >
                {/* Parallax Background Decorations */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25 select-none" aria-hidden="true">
                    <motion.div style={{ y: y1, rotate: rotate1 }} className="absolute top-10 left-10 text-9xl text-yellow-200/40">⭐</motion.div>
                    <motion.div style={{ y: y2, rotate: rotate2 }} className="absolute top-40 right-20 text-9xl text-blue-200/40">🌙</motion.div>
                    <motion.div style={{ y: y1 }} className="absolute top-[40%] left-[10%] text-8xl text-purple-200/40">☁️</motion.div>
                    <motion.div style={{ y: y2 }} className="absolute top-[70%] right-[15%] text-9xl text-pink-200/40">✨</motion.div>
                    <motion.div style={{ y: y1, rotate: rotate2 }} className="absolute bottom-20 left-20 text-9xl text-green-200/40">🚀</motion.div>
                </div>

                <div className="max-w-prose mx-auto pb-48 relative z-10">
                    
                    {/* Story Title & Avatar Header */}
                    <motion.header 
                        initial={{ y: -40, opacity: 0, filter: 'blur(8px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex flex-col items-center mb-16"
                    >
                        {input.heroAvatarUrl && (
                            <motion.div 
                                layoutId="avatar"
                                className="w-32 h-32 border-[8px] border-black rounded-full overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] mb-8 bg-white"
                            >
                                <img src={input.heroAvatarUrl} alt={`${input.heroName} avatar`} className="w-full h-full object-cover" />
                            </motion.div>
                        )}
                        <h1 className="text-4xl md:text-6xl text-center text-blue-950 tracking-tight leading-none uppercase font-black drop-shadow-md">
                            {story.title}
                        </h1>
                        <div className="h-1.5 w-32 bg-red-600 mt-6 rounded-full shadow-sm"></div>
                    </motion.header>
                    
                    {/* Dynamic Story Parts */}
                    <article className="space-y-20">
                        {story.parts.slice(0, currentPartIndex + 1).map((part, i) => (
                            <motion.section 
                                key={i} 
                                initial={{ opacity: 0, y: 80, scale: 0.98, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
                                className="text-2xl relative"
                            >
                                {/* Part Indicator */}
                                <div className="absolute -left-12 -top-6 text-7xl opacity-[0.05] font-comic -z-10 text-black select-none" aria-hidden="true">
                                    {i + 1}
                                </div>
                                
                                <SyncedText 
                                    text={part.text} 
                                    isActive={isNarrating && i === currentPartIndex} 
                                    currentTime={narrationTime} 
                                    duration={narrationDuration} 
                                />
                                
                                {/* Branching Choice Points */}
                                {i === currentPartIndex && part.choices && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="mt-16 bg-blue-50/70 backdrop-blur-md p-10 border-4 border-black border-dashed rounded-2xl shadow-inner"
                                    >
                                        <h2 className="font-comic text-2xl text-red-600 text-center mb-8 uppercase tracking-[0.2em] animate-pulse">
                                            CHOOSE YOUR DESTINY
                                        </h2>
                                        <div className="flex flex-col gap-5">
                                            {part.choices.map((choice, idx) => (
                                                <motion.button 
                                                    key={idx}
                                                    initial={{ x: -30, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 1 + (idx * 0.15) }}
                                                    whileHover={{ scale: 1.02, x: 12, backgroundColor: '#fef08a' }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => onChoice(choice)}
                                                    className="comic-btn bg-yellow-400 p-6 text-xl hover:bg-yellow-300 leading-snug text-left shadow-[6px_6px_0px_rgba(0,0,0,0.8)] flex items-center"
                                                >
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white text-sm flex items-center justify-center font-black mr-4 shadow-sm">
                                                        {idx + 1}
                                                    </span>
                                                    {choice}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.section>
                        ))}

                        {/* Story Conclusion & Education Blocks */}
                        {currentPartIndex === 2 && (
                            <motion.footer 
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.2, delay: 0.3 }}
                                className="mt-24 pt-16 border-t-[8px] border-black border-double space-y-12"
                            >
                                {/* Moral/Lesson Block */}
                                <div className="bg-green-50 p-10 border-4 border-black shadow-[12px_12px_0px_rgba(34,197,94,0.3)] -rotate-1 hover:rotate-0 transition-transform duration-500">
                                    <h3 className="font-comic text-4xl text-green-800 mb-6 underline decoration-yellow-400 underline-offset-8">Morning Mission</h3>
                                    <p className="text-3xl font-serif italic text-gray-800 leading-relaxed">{story.lesson}</p>
                                </div>

                                {/* Vocab and Joke Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="bg-purple-50 p-8 border-4 border-black shadow-[10px_10px_0px_rgba(168,85,247,0.3)] rotate-1 hover:rotate-0 transition-transform duration-500 flex flex-col justify-center">
                                        <h3 className="font-comic text-2xl text-purple-800 mb-4 uppercase">The Tickle Factor</h3>
                                        <p className="text-xl font-serif italic text-gray-700 leading-snug">"{story.joke}"</p>
                                    </div>
                                    <div className="bg-blue-50 p-8 border-4 border-black shadow-[10px_10px_0px_rgba(59,130,246,0.3)] -rotate-1 hover:rotate-0 transition-transform duration-500">
                                        <h3 className="font-comic text-2xl text-blue-800 mb-4 uppercase">Mastery Word</h3>
                                        <p className="font-black text-3xl text-blue-950 mb-2 uppercase tracking-tight">{story.vocabWord.word}</p>
                                        <p className="text-base font-serif text-gray-600 italic leading-tight">Definition: {story.vocabWord.definition}</p>
                                    </div>
                                </div>

                                {/* Hook to Tomorrow */}
                                <p className="font-comic text-5xl text-center text-red-600 mt-16 mb-12 animate-pulse tracking-tighter leading-none" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                                    {story.tomorrowHook}
                                </p>

                                {/* Interactive Feedback */}
                                <section className="bg-white border-4 border-black p-10 shadow-[16px_16px_0px_rgba(0,0,0,1)]">
                                    {hasSubmittedFeedback ? (
                                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-8">
                                            <p className="font-comic text-5xl text-green-600 mb-4">MISSION COMPLETE!</p>
                                            <p className="text-2xl text-gray-500 italic font-serif">The chronicles have been updated with your magic.</p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <h3 className="font-comic text-4xl text-center text-blue-900 mb-8">Was this adventure epic?</h3>
                                            <div className="flex justify-center gap-6 mb-10">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button 
                                                        key={s} 
                                                        onClick={() => { setRating(s); soundManager.playSparkle(); }}
                                                        className={`text-6xl transition-all hover:scale-125 hover:rotate-12 active:scale-90 ${rating >= s ? 'grayscale-0 drop-shadow-lg' : 'grayscale opacity-20'}`}
                                                        aria-label={`Rate ${s} stars`}
                                                    >
                                                        ⭐
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea 
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                placeholder="Write a message for the Multiverse..."
                                                className="w-full p-6 border-4 border-black font-serif text-2xl focus:bg-yellow-50 outline-none mb-8 min-h-[160px] shadow-inner transition-colors"
                                            />
                                            <button 
                                                onClick={() => { setHasSubmittedFeedback(true); soundManager.playSparkle(); }}
                                                className="comic-btn w-full bg-yellow-400 py-6 text-3xl hover:bg-yellow-300 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                                            >
                                                SEAL THE MAGIC
                                            </button>
                                        </>
                                    )}
                                </section>

                                <button 
                                    onClick={onReset}
                                    className="comic-btn w-full bg-blue-800 text-white text-4xl py-8 hover:bg-blue-700 shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-transform active:scale-95"
                                >
                                    SLEEP WELL, HERO
                                </button>
                            </motion.footer>
                        )}
                    </article>
                </div>

                {/* Fixed Storyteller HUD */}
                <motion.nav 
                    layout
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-10 bg-white border-[6px] border-black p-6 px-14 shadow-[20px_20px_0px_rgba(0,0,0,1)] z-[130] min-w-[420px] rounded-sm"
                >
                    {isNarrationLoading ? (
                        <div className="flex items-center justify-center w-full gap-5 font-comic text-blue-600 animate-pulse text-3xl">
                            <span className="text-5xl animate-spin">✨</span> INFUSING TALE...
                        </div>
                    ) : (
                        <>
                            <div className="relative group">
                                <svg className="absolute -inset-4 w-24 h-24 -rotate-90 pointer-events-none opacity-80">
                                    <circle cx="48" cy="48" r="42" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                                    <circle 
                                        cx="48" cy="48" r="42" fill="transparent" stroke="#2563eb" strokeWidth="8" 
                                        strokeDasharray="263.8" 
                                        strokeDashoffset={263.8 - (263.8 * progressPercent) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-300"
                                    />
                                </svg>
                                <button 
                                    onClick={onTogglePlayback}
                                    className="relative text-7xl hover:scale-110 transition-transform active:scale-90 z-10"
                                    aria-label={narrationManager.state.isPlaying ? "Pause storytelling" : "Start storytelling"}
                                >
                                    {narrationManager.state.isPlaying ? '⏸️' : '▶️'}
                                </button>
                            </div>

                            <button 
                                onClick={onStopNarration}
                                className="text-6xl opacity-30 hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                                title="Reset Narrator"
                            >
                                ⏹️
                            </button>
                            
                            <div className="h-16 w-1 bg-black/10 rounded-full" aria-hidden="true"></div>
                            
                            <div className="flex flex-col select-none">
                                <span className="font-comic text-3xl text-blue-900 leading-none tracking-tight">STORYTELLER</span>
                                <span className="font-sans text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mt-2">Kore v2.5 Synthesis</span>
                            </div>
                        </>
                    )}
                </motion.nav>
            </div>
        </motion.main>
    );
};
