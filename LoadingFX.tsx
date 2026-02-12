
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode } from './types';

const PARTICLES_WORDS = ["ZAP!", "POW!", "KABOOM!", "GLOW!", "SHINE!", "SPARK!", "WONDER!", "WHAM!", "BOOM!", "CRASH!"];

const LOADING_STEPS_CLASSIC = [
    "Initializing Imagination Engines...",
    "Querying the Multiverse Archives...",
    "Drafting the Heroic Plotlines...",
    "Rendering Scenic Wonderlands...",
    "Polishing the Dialogue Synthesizer...",
    "Finalizing Destiny Parameters..."
];

const LOADING_STEPS_SLEEP = [
    "Dimming the Lights...",
    "Fluffing the Clouds...",
    "Gathering Starlight...",
    "Quieting the World...",
    "Weaving Soft Dreams...",
    "Preparing for Slumber..."
];

const LOADING_STEPS_MADLIBS = [
    "Mixing Chaos Potions...",
    "Scrambling the Dictionary...",
    "Injecting Silly Serums...",
    "Confusing the Narrator...",
    "Maximizing Wackiness...",
    "Launching Logic out the Window..."
];

interface LoadingFXProps {
    embedded?: boolean;
    mode?: AppMode;
    heroName?: string;
}

export const LoadingFX: React.FC<LoadingFXProps> = ({ embedded = false, mode = 'classic', heroName }) => {
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string}[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        // Dynamic Particle System
        const particleInterval = setInterval(() => {
            const id = Date.now();
            const text = PARTICLES_WORDS[Math.floor(Math.random() * PARTICLES_WORDS.length)];
            const x = `${10 + Math.random() * 80}%`;
            const y = `${10 + Math.random() * 80}%`;
            const rot = Math.random() * 60 - 30;
            const colors = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-purple-400', 'text-white', 'text-pink-500'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            setParticles(prev => [...prev, { id, text, x, y, rot, color }].slice(-8));
        }, 300);

        const steps = mode === 'sleep' ? LOADING_STEPS_SLEEP : (mode === 'madlibs' ? LOADING_STEPS_MADLIBS : LOADING_STEPS_CLASSIC);
        const stepInterval = setInterval(() => {
            setStepIndex(prev => (prev + 1) % steps.length);
        }, 2000);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 99) return prev;
                // Non-linear progress for realism
                const increment = prev > 85 ? Math.random() * 0.2 : Math.random() * 1.5;
                return prev + increment;
            });
        }, 100);

        return () => {
            clearInterval(particleInterval);
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [mode]);

    let title = "INITIATING CORTEX...";
    let icon = "⚡";
    let bgClass = "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black";
    let barColor = "from-blue-600 via-cyan-400 to-blue-200";

    if (mode === 'sleep') {
        title = heroName ? `DREAMING WITH ${heroName.toUpperCase()}...` : "WEAVING DREAMS...";
        icon = "🌙";
        bgClass = "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black";
        barColor = "from-indigo-600 via-purple-400 to-indigo-200";
    } else if (mode === 'madlibs') {
        title = "GENERATING CHAOS...";
        icon = "🤪";
        bgClass = "bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-800 via-red-900 to-black";
        barColor = "from-orange-500 via-yellow-400 to-red-500";
    } else {
        // Classic
        if (heroName) {
            const name = heroName.length > 12 ? heroName.substring(0, 10) + '...' : heroName;
            title = `LAUNCHING ${name.toUpperCase()}...`;
        }
    }

    const steps = mode === 'sleep' ? LOADING_STEPS_SLEEP : (mode === 'madlibs' ? LOADING_STEPS_MADLIBS : LOADING_STEPS_CLASSIC);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden origin-top ${bgClass}`}
        >
            {/* Cinematic Overlay Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse pointer-events-none"></div>

            {/* Twinkling Background */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 1, 0.1], scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                        className="absolute bg-white rounded-full blur-[1px]" 
                        style={{ 
                            left: `${Math.random() * 100}%`, 
                            top: `${Math.random() * 100}%`, 
                            width: `${Math.random() * 4 + 1}px`, 
                            height: `${Math.random() * 4 + 1}px`,
                        }} 
                    />
                ))}
            </div>

            {/* Floating Particles (Only in active modes) */}
            {mode !== 'sleep' && (
                <AnimatePresence>
                    {particles.map(p => (
                        <motion.div 
                            key={p.id} 
                            initial={{ scale: 0, opacity: 0, rotate: p.rot, y: 0 }}
                            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], y: -100 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className={`absolute font-comic text-4xl md:text-6xl font-black ${p.color} select-none whitespace-nowrap z-20 pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}
                            style={{ 
                                left: p.x, 
                                top: p.y,
                                textShadow: '3px 3px 0 #000'
                            }}
                        >
                            {p.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {/* Central Focal Point */}
            <div className="relative z-30 text-center flex flex-col items-center p-6 w-full max-w-2xl">
                <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ 
                        scale: [0.9, 1.1, 0.9],
                        rotate: mode === 'madlibs' ? [0, 10, -10, 0] : 0,
                        filter: ["brightness(100%)", "brightness(130%)", "brightness(100%)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={`${embedded ? 'w-32 h-32 md:w-48 md:h-48 mb-6' : 'w-40 h-40 md:w-64 md:h-64 mb-10'} relative flex items-center justify-center`}
                >
                    {/* Glowing Auras */}
                    <div className={`absolute inset-0 rounded-full blur-[60px] opacity-40 animate-pulse ${mode === 'sleep' ? 'bg-indigo-500' : (mode === 'madlibs' ? 'bg-orange-500' : 'bg-blue-500')}`}></div>
                    <div className="absolute inset-0 bg-white/5 rounded-full backdrop-blur-sm border border-white/10"></div>
                    
                    {/* Spinning Rings */}
                    <div className="absolute inset-2 border-4 border-dashed border-white/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                    <div className="absolute inset-6 border-2 border-dotted border-white/40 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>

                    <span className={`${embedded ? 'text-6xl md:text-8xl' : 'text-8xl md:text-[10rem]'} relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]`}>
                        {icon}
                    </span>
                </motion.div>
                
                <h2 className={`font-comic ${embedded ? 'text-3xl md:text-5xl' : 'text-5xl md:text-7xl'} text-white mb-6 uppercase tracking-[0.05em] drop-shadow-[4px_4px_0px_#000]`}>
                    {title}
                </h2>
                
                {/* Status Message Flipper */}
                <div className="h-12 flex items-center justify-center overflow-hidden w-full">
                    <AnimatePresence mode="wait">
                        <motion.p 
                            key={stepIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`font-serif ${embedded ? 'text-lg md:text-2xl' : 'text-xl md:text-3xl'} text-white/80 italic font-medium tracking-wide`}
                        >
                            {steps[stepIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* High-Tech Progress Bar */}
            <div className={`mt-8 md:mt-12 flex flex-col items-center gap-3 w-full max-w-lg px-8 relative z-30 ${embedded ? 'scale-90' : 'scale-100'}`}>
                <div className="w-full h-8 bg-black/50 rounded-full border-4 border-white/20 overflow-hidden relative shadow-[0_10px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                    {/* Striped Background */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:20px_20px]"></div>
                    
                    <motion.div 
                        className={`h-full bg-gradient-to-r ${barColor} relative`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 20, damping: 10 }}
                    >
                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[shimmer_1.5s_infinite]"></div>
                    </motion.div>
                </div>
                <div className="flex justify-between w-full font-mono text-xs md:text-sm text-white/60 uppercase font-bold tracking-[0.2em]">
                    <span className="animate-pulse">Processing...</span>
                    <span>{Math.floor(progress)}%</span>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </motion.div>
    );
};
