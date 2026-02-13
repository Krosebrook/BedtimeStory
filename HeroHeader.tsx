
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { AppMode } from './types';
import { soundManager } from './SoundManager';

interface HeroHeaderProps {
    activeMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    onImageUpload?: (base64: string) => void;
}

const MODES: { id: AppMode; label: string; icon: string; color: string; tagline: string }[] = [
    { id: 'classic', label: 'Classic', icon: '⚔️', color: 'bg-blue-600', tagline: 'Choose Your Destiny' },
    { id: 'madlibs', label: 'Mad Libs', icon: '🤪', color: 'bg-red-500', tagline: 'Unleash The Chaos' },
    { id: 'sleep', label: 'Sleepy', icon: '🌙', color: 'bg-indigo-600', tagline: 'Drift Into Dreams' }
];

export const HeroHeader: React.FC<HeroHeaderProps> = ({ activeMode, onModeChange, onImageUpload }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { scrollY } = useScroll();

    // Parallax effects
    const y = useTransform(scrollY, [0, 300], [0, 100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

    const activeConfig = MODES.find(m => m.id === activeMode) || MODES[0];

    // Generate stars for sleep mode
    const stars = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 2
        }));
    }, []);

    const getBgGradient = () => {
        switch(activeMode) {
            case 'madlibs': return "from-red-900 via-orange-950 to-black";
            case 'sleep': return "from-[#020617] via-[#0f172a] to-black";
            default: return "from-blue-900 via-slate-900 to-black";
        }
    };

    const handleLogoClick = () => {
        if (onImageUpload && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onImageUpload) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    onImageUpload(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <header 
            ref={containerRef}
            className={`relative w-full mb-20 rounded-b-[2.5rem] md:rounded-b-[4rem] border-b-4 border-black/20 shadow-2xl overflow-visible isolate transition-colors duration-1000 bg-gradient-to-b ${getBgGradient()}`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />

            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay z-0"></div>
            
            {/* Star Field (Sleep Mode Only) */}
            <AnimatePresence>
                {activeMode === 'sleep' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
                    >
                        {stars.map((s) => (
                            <motion.div 
                                key={s.id}
                                className="absolute bg-white rounded-full shadow-[0_0_2px_#fff]"
                                style={{ 
                                    left: `${s.left}%`, 
                                    top: `${s.top}%`, 
                                    width: s.size, 
                                    height: s.size 
                                }}
                                animate={{ opacity: [0.1, 0.8, 0.1] }}
                                transition={{ 
                                    duration: s.duration, 
                                    repeat: Infinity, 
                                    delay: s.delay, 
                                    ease: "easeInOut" 
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Container */}
            <motion.div 
                style={{ y, opacity, scale }}
                className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-4"
            >
                {/* Logo Block */}
                <div 
                    onClick={handleLogoClick}
                    className={`text-center space-y-0 md:space-y-2 group ${onImageUpload ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default'}`}
                >
                    <h1 className="font-comic text-6xl md:text-8xl lg:text-9xl leading-none tracking-tighter text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.6)] py-2">
                        INFINITY
                    </h1>
                    <h1 className={`font-comic text-6xl md:text-8xl lg:text-9xl leading-none tracking-tighter transition-colors duration-500 drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]
                        ${activeMode === 'sleep' ? 'text-indigo-400' : (activeMode === 'madlibs' ? 'text-yellow-400' : 'text-blue-400')}`}
                    >
                        HEROES
                    </h1>
                </div>

                {/* Tagline */}
                <div className="mt-8 h-8 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeMode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-4"
                        >
                            <div className="h-px w-8 bg-white/30" />
                            <p className="font-mono text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-white/80 text-center">
                                {activeConfig.tagline}
                            </p>
                            <div className="h-px w-8 bg-white/30" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Floating Mode Dock */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full max-w-lg px-4">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-2 md:gap-4 relative ring-1 ring-white/5">
                    {MODES.map((mode) => {
                        const isActive = activeMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => { onModeChange(mode.id); soundManager.playChoice(); }}
                                className="relative flex-1 group outline-none"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 rounded-xl ${mode.color} shadow-lg`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <div className={`relative z-10 flex flex-col items-center py-3 px-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                    <span className="text-2xl md:text-3xl mb-1">{mode.icon}</span>
                                    <span className="font-bold text-[10px] uppercase tracking-wider">{mode.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
};
