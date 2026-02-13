/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, SleepConfig, SleepSubMode, AmbientTheme } from '../../types';
import { HeroAvatarDisplay, SensoryInputCard } from './SetupShared';
import { soundManager } from '../../SoundManager';

interface SleepSetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    handleSleepConfigChange: (field: keyof SleepConfig, value: string) => void;
    isAvatarLoading: boolean;
    onGenerateAvatar: () => void;
}

const sleepThemes = [
    { id: 'Cloud Kingdom', label: 'Cloud Kingdom', icon: '☁️', color: 'from-blue-600/40 to-blue-900/60', activeColor: 'border-blue-400 shadow-blue-500/50', desc: 'Floating among soft, marshmallow clouds.' },
    { id: 'Starry Space', label: 'Starry Space', icon: '🚀', color: 'from-indigo-600/40 to-indigo-900/60', activeColor: 'border-indigo-400 shadow-indigo-500/50', desc: 'Drifting past friendly, glowing stars.' },
    { id: 'Magic Forest', label: 'Magic Forest', icon: '🍄', color: 'from-green-600/40 to-green-900/60', activeColor: 'border-green-400 shadow-green-500/50', desc: 'Whispering trees and glowing flowers.' },
    { id: 'Deep Ocean', label: 'Deep Ocean', icon: '🐙', color: 'from-cyan-600/40 to-cyan-900/60', activeColor: 'border-cyan-400 shadow-cyan-500/50', desc: 'Gentle waves and glowing sea friends.' },
    { id: 'Moonlight Meadow', label: 'Moonlight Meadow', icon: '🌙', color: 'from-purple-600/40 to-purple-900/60', activeColor: 'border-purple-400 shadow-purple-500/50', desc: 'Soft grass and a sleepy silver moon.' }
];

const ambientThemes: { id: AmbientTheme, label: string, icon: string }[] = [
    { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
    { id: 'forest', label: 'Forest Night', icon: '🌲' },
    { id: 'ocean', label: 'Midnight Ocean', icon: '🌊' },
    { id: 'crickets', label: 'Night Crickets', icon: '🦗' },
    { id: 'space', label: 'Cosmic Hum', icon: '🛰️' },
    { id: 'magic', label: 'Ethereal Spark', icon: '✨' }
];

const SENSORY_SUGGESTIONS = {
    texture: ["Soft velvet cloud", "Warm toasted bread", "Giant marshmallow", "Fresh fallen snow"],
    sound: ["Whispering leaves", "Distant ocean hum", "A tiny silver bell", "Soft crackling fire"],
    scent: ["Warm apple pie", "Fresh lavender", "Rain on warm stones", "Sweet honey flowers"]
};

export const SleepSetup: React.FC<SleepSetupProps> = ({ input, onChange, handleSleepConfigChange, isAvatarLoading, onGenerateAvatar }) => {
    
    useEffect(() => {
        if (input.sleepConfig.ambientTheme !== 'auto' && input.mode === 'sleep') {
            soundManager.playAmbient(input.sleepConfig.ambientTheme);
        } else {
            soundManager.stopAmbient();
        }
        return () => soundManager.stopAmbient();
    }, [input.sleepConfig.ambientTheme, input.mode]);

    const activeTheme = sleepThemes.find(t => t.id === input.sleepConfig.theme);

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center relative">
                
                <HeroAvatarDisplay 
                    url={input.heroAvatarUrl} 
                    isLoading={isAvatarLoading} 
                    onGenerate={onGenerateAvatar} 
                    mode={input.mode}
                />

                <div className="absolute -top-10 inset-x-0 flex justify-center opacity-40 pointer-events-none">
                    <motion.span 
                        animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="text-5xl"
                    >✨</motion.span>
                </div>
                
                <div className="max-w-md mx-auto relative group">
                    <label className="font-serif italic text-indigo-300 text-sm md:text-base block mb-3 uppercase tracking-[0.2em] opacity-80">
                        The Sleepy Hero
                    </label>
                    <input 
                        value={input.heroName} 
                        onChange={e => onChange('heroName', e.target.value)} 
                        placeholder="Hero's name..." 
                        className="w-full border-b-2 border-indigo-500/20 p-2 md:p-4 text-center text-4xl md:text-6xl font-serif text-white focus:border-indigo-400 outline-none bg-transparent placeholder-indigo-900 transition-all focus:placeholder-indigo-800" 
                    />
                    <div className="absolute -bottom-0.5 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700"></div>
                </div>
            </div>

            {/* Sub-mode Toggle */}
            <div className="flex justify-center">
                <div className="bg-indigo-950/80 p-1.5 rounded-full border border-indigo-400/20 flex gap-1 shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {(['child-friendly', 'parent-madlib'] as SleepSubMode[]).map(s => (
                        <button 
                            key={s}
                            onClick={() => { handleSleepConfigChange('subMode', s); soundManager.playChoice(); }}
                            className={`relative px-8 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 z-10 
                                ${input.sleepConfig.subMode === s 
                                    ? 'bg-indigo-50 text-indigo-950 shadow-[0_10px_20px_rgba(0,0,0,0.3)]' 
                                    : 'text-indigo-400 hover:text-indigo-100'}`}
                        >
                            {s === 'child-friendly' ? '🌟 Dream Pick' : "✍️ Parent's Path"}
                            {input.sleepConfig.subMode === s && (
                                <motion.div layoutId="submode-pill" className="absolute inset-0 rounded-full bg-indigo-50 -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                <div className="flex flex-col gap-6">
                    {input.sleepConfig.subMode === 'parent-madlib' ? (
                        <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-500">
                            <h4 className="font-comic text-[10px] md:text-xs uppercase text-indigo-400 tracking-[0.3em] border-l-4 border-indigo-600 pl-3 mb-2">Sensory Weaving</h4>
                            <SensoryInputCard 
                                icon="☁️" 
                                label="World Texture" 
                                description="How does the air or ground feel?" 
                                placeholder="Soft and pillowy..." 
                                value={input.sleepConfig.texture} 
                                onChange={v => handleSleepConfigChange('texture', v)} 
                                suggestions={SENSORY_SUGGESTIONS.texture}
                            />
                            <SensoryInputCard 
                                icon="🐚" 
                                label="Gentle Echoes" 
                                description="What soft sounds drift by?" 
                                placeholder="A distant hum..." 
                                value={input.sleepConfig.sound} 
                                onChange={v => handleSleepConfigChange('sound', v)} 
                                suggestions={SENSORY_SUGGESTIONS.sound}
                            />
                            <SensoryInputCard 
                                icon="🍪" 
                                label="Dream Aromas" 
                                description="What sweet scent fills the nose?" 
                                placeholder="Warm honey..." 
                                value={input.sleepConfig.scent} 
                                onChange={v => handleSleepConfigChange('scent', v)} 
                                suggestions={SENSORY_SUGGESTIONS.scent}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 bg-indigo-900/30 rounded-[4rem] border-2 border-indigo-400/20 h-full relative overflow-hidden group shadow-inner animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-2000"></div>
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                            
                            <motion.div 
                                key={activeTheme?.id || 'default'}
                                animate={{ 
                                    rotate: [0, 5, -5, 0], 
                                    scale: [1, 1.05, 1],
                                    y: [0, -10, 0]
                                }} 
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="text-8xl md:text-9xl mb-8 relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                            >
                                {activeTheme ? activeTheme.icon : '🧸'}
                            </motion.div>
                            <h4 className="font-comic text-2xl md:text-3xl text-white mb-3 relative z-10 uppercase tracking-widest">
                                {activeTheme ? activeTheme.label : 'Adventure Pick'}
                            </h4>
                            <p className="text-center text-sm md:text-base text-indigo-200/50 leading-relaxed italic px-8 relative z-10 font-serif">
                                {activeTheme ? activeTheme.desc : 'Simply choose a magical theme on the right to start your journey.'}
                            </p>
                            
                            {/* Visual connector for larger screens */}
                            <div className="hidden md:block absolute right-[-20px] top-1/2 -translate-y-1/2 text-4xl text-indigo-500/30 animate-pulse">→</div>
                        </div>
                    )}
                </div>

                <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <h4 className="font-comic text-[10px] md:text-xs uppercase text-indigo-400 tracking-[0.3em] border-l-4 border-indigo-600 pl-3 mb-2">Dreamscape Selection</h4>
                    
                    {/* ENHANCED THEME GRID */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {sleepThemes.map(t => {
                            const isSelected = input.sleepConfig.theme === t.id;
                            return (
                                <motion.button 
                                    key={t.id} 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { handleSleepConfigChange('theme', t.id); soundManager.playChoice(); }}
                                    className={`relative group flex flex-col items-center justify-center p-4 h-32 md:h-40 rounded-3xl border-[3px] transition-all duration-300 overflow-hidden outline-none focus:ring-4 focus:ring-indigo-500/50
                                        ${isSelected 
                                            ? 'border-indigo-300 bg-indigo-900/50 shadow-[0_0_25px_rgba(99,102,241,0.4)]' 
                                            : 'border-indigo-500/10 bg-indigo-950/30 hover:border-indigo-400/30 hover:bg-indigo-900/30'
                                        }
                                    `}
                                    aria-label={`Select ${t.label} theme`}
                                    aria-pressed={isSelected}
                                >
                                    {/* Selection Glow / Gradient */}
                                    {isSelected && (
                                        <motion.div 
                                            layoutId="selection-glow"
                                            className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-20`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.2 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}

                                    {/* Large Icon */}
                                    <span className={`text-5xl md:text-6xl mb-3 transition-all duration-500 transform
                                        ${isSelected 
                                            ? 'scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]' 
                                            : 'scale-100 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110'
                                        }`}
                                    >
                                        {t.icon}
                                    </span>

                                    {/* Label */}
                                    <span className={`font-comic text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-center z-10 transition-colors
                                        ${isSelected ? 'text-indigo-100' : 'text-indigo-400 group-hover:text-indigo-200'}`}>
                                        {t.label}
                                    </span>
                                    
                                    {/* Active Checkmark */}
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute top-3 right-3 text-indigo-300"
                                        >
                                            <svg className="w-5 h-5 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                    
                    {/* Active Description Display */}
                    <div className="min-h-[4rem] bg-indigo-950/80 rounded-[2rem] p-5 border border-indigo-400/20 flex items-center justify-center text-center shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/20 group-hover:w-full transition-all duration-1000"></div>
                        <AnimatePresence mode="wait">
                            {activeTheme ? (
                                <motion.p 
                                    key={activeTheme.id}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                                    className="text-xs md:text-sm text-indigo-100/80 italic leading-relaxed font-serif relative z-10 px-4"
                                >
                                    "{activeTheme.desc}"
                                </motion.p>
                            ) : (
                                <span className="text-[10px] text-indigo-500/40 tracking-[0.3em] uppercase relative z-10">Select Your World</span>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-10 border-t border-indigo-500/10">
                <label className="font-comic text-[10px] uppercase text-indigo-400/60 block mb-8 tracking-[0.4em] text-center">Gentle Ambient Sounds</label>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    <button 
                        onClick={() => { handleSleepConfigChange('ambientTheme', 'auto'); soundManager.playChoice(); }}
                        className={`px-8 py-4 rounded-2xl border-2 font-comic transition-all uppercase text-[10px] tracking-[0.2em] shadow-lg
                            ${input.sleepConfig.ambientTheme === 'auto' 
                                ? 'bg-indigo-50 text-indigo-950 border-white scale-105' 
                                : 'bg-indigo-950/40 border-indigo-400/10 text-indigo-400 hover:border-indigo-400/30'}`}
                    >
                        🔇 Silence
                    </button>
                    {ambientThemes.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => { handleSleepConfigChange('ambientTheme', t.id); soundManager.playChoice(); }}
                            className={`px-6 py-4 rounded-2xl border-2 font-comic transition-all flex items-center gap-4 uppercase text-[10px] tracking-[0.2em] shadow-lg
                                ${input.sleepConfig.ambientTheme === t.id 
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_10px_30px_rgba(99,102,241,0.4)] scale-105' 
                                    : 'bg-indigo-950/40 border-indigo-400/10 text-indigo-400 hover:border-indigo-400/30'}`}
                        >
                            <span className={`text-2xl transition-transform duration-500 ${input.sleepConfig.ambientTheme === t.id ? 'scale-125 rotate-6' : ''}`}>
                                {t.icon}
                            </span> 
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};