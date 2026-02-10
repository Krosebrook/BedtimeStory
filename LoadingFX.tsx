
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode } from './types';

const PARTICLES_WORDS = ["ZAP!", "POW!", "KABOOM!", "GLOW!", "SHINE!", "SPARK!", "WONDER!", "WHAM!"];
const LOADING_STEPS = [
    "Initializing Imagination Engines...",
    "Querying the Multiverse Archives...",
    "Drafting the Heroic Plotlines...",
    "Rendering Scenic Wonderlands...",
    "Polishing the Dialogue Synthesizer...",
    "Finalizing Destiny Parameters..."
];

interface LoadingFXProps {
    embedded?: boolean;
    mode?: AppMode;
}

export const LoadingFX: React.FC<LoadingFXProps> = ({ embedded = false, mode = 'classic' }) => {
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string}[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        const particleInterval = setInterval(() => {
            const id = Date.now();
            const text = PARTICLES_WORDS[Math.floor(Math.random() * PARTICLES_WORDS.length)];
            const x = `${10 + Math.random() * 80}%`;
            const y = `${10 + Math.random() * 80}%`;
            const rot = Math.random() * 60 - 30;
            const colors = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-purple-400', 'text-white'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            setParticles(prev => [...prev, { id, text, x, y, rot, color }].slice(-6));
        }, 400);

        const stepInterval = setInterval(() => {
            setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
        }, 2500);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return prev;
                // Slower near the end to simulate 'hard work'
                const increment = prev > 80 ? Math.random() * 0.5 : Math.random() * 2;
                return prev + increment;
            });
        }, 150);

        return () => {
            clearInterval(particleInterval);
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, []);

    let title = "INITIATING CORTEX...";
    let icon = "⚡";

    if (mode === 'sleep') {
        title = "WEAVING DREAMS...";
        icon = "🌙";
    } else if (mode === 'madlibs') {
        title = "GENERATING CHAOS...";
        icon = "🤪";
    }

    return (
        <motion.div 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${embedded ? 'absolute' : 'fixed'} inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center overflow-hidden origin-top`}
        >
            {/* Twinkling Star Background */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
                        className="absolute bg-white rounded-full" 
                        style={{ 
                            left: `${Math.random() * 100}%`, 
                            top: `${Math.random() * 100}%`, 
                            width: `${Math.random() * 3 + 1}px`, 
                            height: `${Math.random() * 3 + 1}px`,
                        }} 
                    />
                ))}
            </div>

            {/* Comic Action Particles */}
            <AnimatePresence>
                {particles.map(p => (
                    <motion.div 
                        key={p.id} 
                        initial={{ scale: 0, opacity: 0, rotate: p.rot }}
                        animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0.8], rotate: p.rot }}
                        exit={{ scale: 2, opacity: 0 }}
                        className={`absolute font-comic text-4xl md:text-6xl font-black ${p.color} select-none whitespace-nowrap z-20 pointer-events-none`}
                        style={{ 
                            left: p.x, 
                            top: p.y, 
                            textShadow: '4px 4px 0px black, -2px -2px 0px black' 
                        }}
                    >
                        {p.text}
                    </motion.div>
                ))}
            </AnimatePresence>

            <div className="relative z-10 text-center flex flex-col items-center p-4">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-32 h-32 md:w-48 md:h-48 mb-8 relative flex items-center justify-center"
                >
                    {/* Glowing Aura */}
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-[40px] opacity-20 animate-pulse"></div>
                    <div className="absolute inset-4 border-4 border-dashed border-blue-400 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <span className="text-7xl md:text-9xl relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                        {icon}
                    </span>
                </motion.div>
                
                <h2 className="font-comic text-4xl md:text-6xl text-white mb-4 uppercase tracking-[0.1em]" style={{ textShadow: '4px 4px 0px #2563eb' }}>
                    {title}
                </h2>
                
                <div className="h-10 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p 
                            key={stepIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="font-serif text-lg md:text-2xl text-blue-300 italic font-medium tracking-wide"
                        >
                            {LOADING_STEPS[stepIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>

            {/* AI Cortex Progress Bar */}
            <div className="mt-16 flex flex-col items-center gap-4 w-full max-w-sm px-8">
                <div className="w-full h-5 bg-slate-900 rounded-sm border-4 border-black overflow-hidden relative shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
                    {/* Background Grid for Tech Feel */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_9%,rgba(255,255,255,0.1)_10%)] bg-[length:20px_100%]"></div>
                    
                    <motion.div 
                        className="h-full bg-gradient-to-r from-blue-700 via-blue-400 to-blue-200 relative" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 20 }}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.4),transparent)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]"></div>
                    </motion.div>

                    {/* Scanning Line */}
                    <motion.div 
                        animate={{ left: ['-10%', '110%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-0 bottom-0 w-2 bg-white blur-sm opacity-50 z-20"
                    />
                </div>
                <div className="flex justify-between w-full font-mono text-[10px] md:text-xs text-blue-500 uppercase font-black tracking-widest">
                    <span>Transmitting...</span>
                    <span>{Math.floor(progress)}% COMPLETE</span>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </motion.div>
    );
};
