
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { AppMode } from './types';
import { soundManager } from './SoundManager';

interface HeroHeaderProps {
    activeMode: AppMode;
    onModeChange: (mode: AppMode) => void;
}

const MODES: { id: AppMode; label: string; icon: string; color: string; tagline: string }[] = [
    { id: 'classic', label: 'Classic', icon: '⚔️', color: 'from-blue-400 to-blue-600', tagline: 'Choose Your Destiny' },
    { id: 'madlibs', label: 'Mad Libs', icon: '🤪', color: 'from-orange-400 to-red-500', tagline: 'Unleash The Chaos' },
    { id: 'sleep', label: 'Sleepy', icon: '🌙', color: 'from-indigo-400 to-purple-600', tagline: 'Drift Into Dreams' }
];

export const HeroHeader: React.FC<HeroHeaderProps> = ({ activeMode, onModeChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    
    // --- Performance: Cache Layout Metrics ---
    // We cache the bounding rect to avoid reflows during mouse movement
    useEffect(() => {
        const updateRect = () => {
            if (containerRef.current) {
                setRect(containerRef.current.getBoundingClientRect());
            }
        };
        
        // Initial measure
        updateRect();
        
        // Update on resize (throttled by browser usually, but safe enough here)
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, []);

    // --- Scroll Parallax & Scaling ---
    const { scrollY } = useScroll();
    
    // Scale logo down as user scrolls to make room for inputs
    const logoScale = useTransform(scrollY, [0, 300], [1, 0.7]);
    const logoOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);
    const logoY = useTransform(scrollY, [0, 300], [0, 50]);
    
    // Blur background as we scroll away
    const bgBlur = useTransform(scrollY, [0, 300], ["blur(0px)", "blur(12px)"]);

    // --- Mouse Parallax (3D Tilt) ---
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the mouse movement using springs for a "heavy" feel
    const springConfig = { damping: 20, stiffness: 100 }; // Adjusted for smoother tilt
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    // Map mouse position to rotation degrees
    const rotateX = useTransform(springY, [-0.5, 0.5], ["10deg", "-10deg"]); // Reduced range for subtlety
    const rotateY = useTransform(springX, [-0.5, 0.5], ["-10deg", "10deg"]);

    // Dynamic sheen effect based on mouse
    const sheenGradient = useMotionTemplate`linear-gradient(${rotateY}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)`;

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!rect) return;
        
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = e.clientX - rect.left;
        const mouseYPos = e.clientY - rect.top;
        
        // Calculate normalized position (-0.5 to 0.5)
        mouseX.set((mouseXPos / width) - 0.5);
        mouseY.set((mouseYPos / height) - 0.5);
    }, [rect, mouseX, mouseY]);

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    // --- Visual Assets ---
    const getBgClass = () => {
        switch(activeMode) {
            case 'madlibs': return "bg-gradient-to-br from-purple-950 via-rose-950 to-black";
            case 'sleep': return "bg-gradient-to-b from-slate-950 via-indigo-950 to-black";
            default: return "bg-gradient-to-br from-blue-950 via-slate-950 to-black";
        }
    };

    const activeConfig = MODES.find(m => m.id === activeMode) || MODES[0];

    return (
        <header 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full mb-8 rounded-b-[3rem] border-b-4 border-black/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden isolate transition-colors duration-1000 ${getBgClass()}`}
            style={{ perspective: "1000px" }}
            role="banner"
            aria-label="Application Header and Mode Selection"
        >
            {/* --- Dynamic Background Layers --- */}
            <motion.div style={{ filter: bgBlur }} className="absolute inset-0 z-0">
                {/* Noise Texture for Studio Feel */}
                <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
                
                {/* Mode Specific Ambient Effects */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-1000">
                    {activeMode === 'classic' && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.3),transparent_60%)] animate-pulse"></div>
                    )}
                    {activeMode === 'madlibs' && (
                        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(234,88,12,0.1),rgba(236,72,153,0.1),rgba(234,88,12,0.1))] animate-[spin_20s_linear_infinite]"></div>
                    )}
                    {activeMode === 'sleep' && (
                        <div className="absolute inset-0">
                             {Array.from({ length: 15 }).map((_, i) => (
                                <motion.div key={i} 
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
                                    transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
                                    className="absolute bg-indigo-200 rounded-full blur-[1px]"
                                    style={{ left: `${Math.random()*100}%`, top: `${Math.random()*60}%`, width: Math.random()*3, height: Math.random()*3 }}
                                />
                             ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* --- 3D Logo Container --- */}
            <motion.div 
                className="relative z-10 flex flex-col items-center justify-center pt-20 pb-24 px-4"
                style={{ 
                    scale: logoScale, 
                    opacity: logoOpacity,
                    y: logoY,
                    rotateX: rotateX,
                    rotateY: rotateY,
                }}
            >
                {/* Atmospheric Glow */}
                <motion.div 
                    layoutId="glow"
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] -z-10 transition-colors duration-1000
                        ${activeMode === 'sleep' ? 'bg-indigo-500/20' : (activeMode === 'madlibs' ? 'bg-orange-500/20' : 'bg-blue-500/20')}`}
                />

                {/* Main Typography */}
                <div className="relative text-center select-none group">
                    <motion.h1 
                        className="font-comic text-6xl md:text-9xl leading-[0.85] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/70 drop-shadow-[0_4px_0_rgba(0,0,0,1)] filter"
                        style={{ WebkitTextStroke: '2px rgba(0,0,0,0.5)' }}
                    >
                        INFINITY
                    </motion.h1>
                    <motion.h1 
                        className={`font-comic text-6xl md:text-9xl leading-[0.85] tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,1)] relative z-10 transition-colors duration-500
                            ${activeMode === 'sleep' ? 'text-indigo-300' : (activeMode === 'madlibs' ? 'text-yellow-400' : 'text-yellow-400')}`}
                        style={{ WebkitTextStroke: '2px rgba(0,0,0,0.5)' }}
                    >
                        HEROES
                    </motion.h1>
                    
                    {/* Dynamic Sheen Overlay */}
                    <motion.div 
                        className="absolute inset-0 pointer-events-none mix-blend-overlay"
                        style={{ background: sheenGradient }}
                    />
                </div>

                {/* Mode Tagline (Changeable Splash Element) */}
                <div className="mt-8 h-8 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-3"
                        >
                            <div className="h-[1px] w-8 md:w-16 bg-white/50"></div>
                            <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/90 shadow-black drop-shadow-md text-center min-w-[150px]">
                                {activeConfig.tagline}
                            </p>
                            <div className="h-[1px] w-8 md:w-16 bg-white/50"></div>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </motion.div>

            {/* --- Interactive Mode Console (Splash CTA) --- */}
            <div className="absolute bottom-0 inset-x-0 transform translate-y-1/2 z-30 flex justify-center px-4">
                <div 
                    className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex gap-2 md:gap-4 overflow-hidden relative group/console"
                    role="radiogroup"
                    aria-label="Select Story Mode"
                >
                    {/* Console Scanline Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,239,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20"></div>

                    {MODES.map((mode) => {
                        const isActive = activeMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => { onModeChange(mode.id); soundManager.playChoice(); }}
                                className={`relative px-4 py-3 md:px-8 md:py-4 rounded-[1.5rem] transition-all duration-300 outline-none group/btn focus:ring-2 ring-white/50
                                    ${isActive ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                                aria-checked={isActive}
                                role="radio"
                                aria-label={`${mode.label} Mode`}
                            >
                                {/* Active Background Pill */}
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-mode-pill"
                                        className={`absolute inset-0 rounded-[1.5rem] bg-gradient-to-r ${mode.color} shadow-lg`}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <span className={`text-2xl md:text-3xl transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1 drop-shadow-md' : 'group-hover/btn:scale-110 grayscale'}`}>
                                        {mode.icon}
                                    </span>
                                    <span className="font-comic text-xs md:text-sm uppercase tracking-wide leading-none">
                                        {mode.label}
                                    </span>
                                </div>

                                {/* Spotlight Hover Effect (Desktop only) */}
                                <div className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover/btn:opacity-100 bg-white/5 transition-opacity duration-300 pointer-events-none"></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
};
