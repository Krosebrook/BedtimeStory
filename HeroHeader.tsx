
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode } from './types';
import { soundManager } from './SoundManager';

interface HeroHeaderProps {
    activeMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const MODES: { id: AppMode; label: string; icon: string; color: string; desc: string }[] = [
    { id: 'classic', label: 'Classic', icon: '⚔️', color: 'from-blue-400 to-blue-600', desc: 'Adventure' },
    { id: 'madlibs', label: 'Mad Libs', icon: '🤪', color: 'from-orange-400 to-red-500', desc: 'Chaos' },
    { id: 'sleep', label: 'Sleepy', icon: '🌙', color: 'from-indigo-400 to-purple-600', desc: 'Dreams' }
];

export const HeroHeader: React.FC<HeroHeaderProps> = ({ activeMode, onModeChange }) => {
    
    // Dynamic background styles based on mode
    const getBgClass = () => {
        switch(activeMode) {
            case 'madlibs': return "bg-gradient-to-br from-purple-900 via-rose-900 to-black";
            case 'sleep': return "bg-gradient-to-b from-slate-900 via-indigo-950 to-black";
            default: return "bg-gradient-to-br from-blue-900 via-slate-900 to-black";
        }
    };

    return (
        <div className={`relative w-full mb-8 rounded-b-[2.5rem] md:rounded-b-[4rem] border-b-4 md:border-b-8 border-black shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden isolate transition-all duration-700 ${getBgClass()}`}>
            
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-screen">
                {activeMode === 'classic' && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 to-transparent animate-pulse"></div>
                )}
                {activeMode === 'madlibs' && (
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-pink-500/20 to-transparent animate-[spin_10s_linear_infinite]"></div>
                )}
                {activeMode === 'sleep' && (
                    <div className="absolute inset-0">
                         {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="absolute bg-white rounded-full animate-pulse" 
                                 style={{
                                     top: `${Math.random() * 100}%`,
                                     left: `${Math.random() * 100}%`,
                                     width: `${Math.random() * 3}px`,
                                     height: `${Math.random() * 3}px`,
                                     animationDelay: `${Math.random() * 3}s`
                                 }} 
                            />
                         ))}
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-12 pb-16 md:pt-20 md:pb-24 px-4 text-center">
                
                {/* Glowing Aura behind Logo */}
                <motion.div 
                    layoutId="aura"
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[600px] md:h-[400px] bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-[60px] md:blur-[100px]"
                />

                {/* Main Logo Composition */}
                <div className="relative group perspective-1000">
                    <motion.div
                        animate={{ rotateX: [0, 5, 0], rotateY: [0, 5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                    >
                        <h1 className="font-comic text-7xl md:text-[9rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-blue-500 to-blue-700 drop-shadow-[4px_4px_0px_black] filter"
                            style={{ WebkitTextStroke: '3px black' }}>
                            INFINITY
                        </h1>
                        <h1 className="font-comic text-7xl md:text-[9rem] leading-none text-yellow-400 drop-shadow-[4px_4px_0px_black] -mt-2 md:-mt-6 relative"
                            style={{ WebkitTextStroke: '3px black', textShadow: '6px 6px 0px #000' }}>
                            HEROES
                        </h1>
                    </motion.div>
                    
                    {/* Background Icon (Book) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10 md:opacity-20 scale-150 md:scale-[2]">
                        <span className="text-[10rem] md:text-[15rem] filter blur-sm">📖</span>
                    </div>
                </div>

                <p className="font-sans font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white/40 mt-6 md:mt-8 text-[10px] md:text-sm animate-pulse border-y border-white/10 py-2 w-full max-w-md">
                    Bedtime Chronicles Production
                </p>

                {/* Interactive Mode Selector (CTA) */}
                <div className="mt-10 md:mt-16 bg-slate-950/80 backdrop-blur-xl p-2 rounded-[2rem] border-2 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-wrap justify-center gap-2 md:gap-3 relative z-30 ring-4 ring-black/50">
                    {MODES.map((mode) => {
                        const isActive = activeMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => { onModeChange(mode.id); soundManager.playChoice(); }}
                                className={`relative group px-5 md:px-8 py-3 md:py-4 rounded-[1.5rem] transition-all duration-300 flex items-center gap-3 overflow-hidden outline-none ${isActive ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105 ring-2 ring-white z-10' : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className={`text-2xl md:text-3xl transition-transform duration-300 ${isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110'}`}>
                                    {mode.icon}
                                </span>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-comic uppercase text-sm md:text-xl leading-none tracking-wide">
                                        {mode.label}
                                    </span>
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.span 
                                                initial={{ opacity: 0, height: 0, y: 5 }} 
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1"
                                            >
                                                {mode.desc}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-highlight"
                                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${mode.color}`}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
