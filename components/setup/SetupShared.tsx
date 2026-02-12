
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppMode, StoryLength } from '../../types';
import { soundManager } from '../../SoundManager';

export const DefaultAvatar = ({ mode }: { mode: AppMode }) => {
    const icon = mode === 'sleep' ? '😴' : (mode === 'madlibs' ? '🤪' : '🦸');
    const bgClass = mode === 'sleep' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-slate-100 text-slate-400';
    const borderClass = mode === 'sleep' ? 'border-indigo-500/30' : 'border-slate-300';
    
    return (
        <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${bgClass}`}>
            {/* Pattern Background */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
            </div>
            
            {/* Silhouette Icon */}
            <div className={`text-5xl md:text-6xl transition-transform duration-500 ${mode === 'sleep' ? 'opacity-60 blur-[0.5px]' : 'opacity-40 grayscale'}`}>
                {icon}
            </div>

            {/* Label */}
            <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${borderClass} bg-black/5`}>
                    No Image
                </span>
            </div>
        </div>
    );
};

export const HeroAvatarDisplay = ({ url, isLoading, onGenerate, mode }: { url?: string, isLoading: boolean, onGenerate: () => void, mode: AppMode }) => (
    <div className="relative group mx-auto mb-6 w-32 h-32 md:w-40 md:h-40 shrink-0">
        <div className={`w-full h-full rounded-full border-[6px] ${mode === 'sleep' ? 'border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-black shadow-[8px_8px_0px_rgba(0,0,0,0.2)]'} overflow-hidden relative bg-white z-10 transition-transform duration-300 group-hover:scale-105`}>
            {isLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[10px] font-comic uppercase tracking-widest animate-pulse text-slate-500">Painting...</span>
                </div>
            ) : (
                url ? (
                    <img src={url} alt="Hero Avatar" className="w-full h-full object-cover" />
                ) : (
                    <DefaultAvatar mode={mode} />
                )
            )}
            
            {/* Hover Action / Empty State Action */}
            <button 
                onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]
                    ${!url && !isLoading ? 'bg-black/10 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}
                `}
                aria-label="Generate new avatar"
            >
                <span className={`comic-btn text-xs px-3 py-1 shadow-[4px_4px_0px_black] border-2 border-black transform transition-transform 
                    ${!url ? 'bg-green-500 text-white animate-pulse' : 'bg-yellow-400 text-black -rotate-3 hover:rotate-0'}
                `}>
                    {url ? 'REPAINT' : 'CREATE HERO'}
                </span>
            </button>
        </div>
        
        {/* Decorative Badge */}
        {!url && !isLoading && (
            <div className={`absolute -top-1 -right-1 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl animate-bounce border-2 border-black shadow-sm z-20 ${mode === 'sleep' ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}`}>
                {mode === 'sleep' ? '✨' : '🎨'}
            </div>
        )}
    </div>
);

export const MadLibField = ({ label, value, onChange, suggestions }: { label: string, value: string, onChange: (val: string) => void, suggestions: string[] }) => {
    const [isFocused, setIsFocused] = useState(false);
    
    // Validation visual: Red border if empty and not focused, Blue if filled/focused
    const isValid = value.trim().length > 0;
    const borderClass = isFocused 
        ? 'border-blue-500 bg-blue-50' 
        : (isValid ? 'border-blue-400 bg-blue-50/50' : 'border-red-400 bg-red-50/50 animate-pulse');

    return (
        <span className="relative inline-block mx-1 align-bottom group">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => { setIsFocused(true); soundManager.playChoice(); }}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on suggestion
                placeholder={label}
                className={`
                    w-28 md:w-36 text-center font-bold text-xl px-2 py-1 
                    border-b-4 border-dashed rounded-md outline-none transition-all duration-300
                    text-blue-900 placeholder-blue-900/40
                    ${borderClass}
                `}
                aria-label={`Enter a ${label}`}
                autoComplete="off"
            />
            
            {/* Quick Suggestions Dropdown */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white border-4 border-black shadow-lg rounded-xl z-50 overflow-hidden flex flex-col"
                    >
                        <div className="bg-yellow-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border-b-2 border-black text-center">
                            Ideas for {label}
                        </div>
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => { onChange(s); setIsFocused(false); soundManager.playSparkle(); }}
                                className="px-3 py-2 text-sm font-comic hover:bg-blue-100 text-left transition-colors border-b border-gray-100 last:border-0"
                            >
                                {s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Validation Tooltip */}
            {!isValid && !isFocused && (
                <span className="absolute -bottom-5 left-0 right-0 text-[8px] uppercase font-bold text-red-500 text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Required
                </span>
            )}
        </span>
    );
}

export const GeminiWizardStep: React.FC<{ prompt: string; children: React.ReactNode; onNext: () => void; onBack: () => void; isFirst: boolean; isLast: boolean; }> = ({ prompt, children, onNext, onBack, isFirst, isLast }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full w-full">
        <div className="flex items-start gap-4 mb-6 md:mb-8">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-black flex-shrink-0 flex items-center justify-center text-3xl md:text-4xl shadow-md">🤖</div>
            <div className="bg-white border-4 border-black rounded-3xl rounded-tl-none p-4 md:p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] flex-1">
                <p className="font-comic text-lg md:text-2xl text-blue-900 leading-snug">{prompt}</p>
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4 md:gap-6 w-full max-w-lg mx-auto">{children}</div>
        <div className="flex justify-between items-center mt-8 md:mt-10">
            <button 
                onClick={onBack} 
                disabled={isFirst} 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-black flex items-center justify-center text-xl md:text-2xl ${isFirst ? 'opacity-20 cursor-not-allowed bg-slate-100' : 'bg-white hover:bg-slate-50 shadow-[4px_4px_0px_black]'}`}
                aria-label="Go back"
            >⬅</button>
            <button 
                onClick={onNext} 
                className={`h-12 md:h-14 px-6 md:px-8 rounded-full border-4 border-black text-lg md:text-xl font-comic uppercase shadow-[4px_4px_0px_black] hover:-translate-y-1 ${isLast ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
            >
                {isLast ? 'Finish!' : 'Next ➡'}
            </button>
        </div>
    </motion.div>
);

export const LengthSlider = ({ value, onChange }: { value: StoryLength, onChange: (val: StoryLength) => void }) => {
    const steps: StoryLength[] = ['short', 'medium', 'long', 'eternal'];
    
    const config = {
        short: { icon: '⚡', label: 'Quick', color: 'bg-yellow-400', border: 'border-yellow-600', text: 'text-yellow-600', desc: '~3 min sprint' },
        medium: { icon: '📖', label: 'Story', color: 'bg-blue-400', border: 'border-blue-600', text: 'text-blue-600', desc: '~8 min read' },
        long: { icon: '📜', label: 'Saga', color: 'bg-purple-400', border: 'border-purple-600', text: 'text-purple-600', desc: '~15 min epic' },
        eternal: { icon: '♾️', label: 'Eternal', color: 'bg-red-500', border: 'border-red-700', text: 'text-red-600', desc: '~25 min journey' }
    };

    const currentIndex = steps.indexOf(value);
    const activeConfig = config[value];

    return (
        <div className="w-full max-w-xl mx-auto py-8 px-4" role="group" aria-label="Select Story Length">
            <div className="relative mb-8">
                {/* Background Track */}
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-200 rounded-full -translate-y-1/2 border-2 border-slate-300 shadow-inner z-0"></div>
                
                {/* Active Progress Track */}
                <div 
                    className={`absolute top-1/2 left-0 h-4 rounded-full -translate-y-1/2 border-2 border-transparent opacity-80 transition-all duration-500 ease-out z-0 ${activeConfig.color}`}
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {/* Steps */}
                <div className="relative z-10 flex justify-between">
                    {steps.map((s, i) => {
                        const isActive = i <= currentIndex;
                        const isSelected = i === currentIndex;
                        const c = config[s];
                        
                        return (
                            <button 
                                key={s}
                                onClick={() => { onChange(s); soundManager.playChoice(); }}
                                className={`relative group outline-none transition-all duration-300 focus:scale-110 ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'}`}
                                aria-pressed={isSelected}
                                aria-label={`${c.label} length (${c.desc})`}
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center text-3xl md:text-4xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)] transition-all duration-300 
                                    ${isActive ? `${c.color} ${c.border} text-white` : 'bg-white border-slate-300 text-slate-300 grayscale'}`}>
                                    {c.icon}
                                </div>
                                
                                {isSelected && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center"
                                    >
                                        <span className={`font-comic font-bold text-lg uppercase ${c.text} drop-shadow-sm`}>{c.label}</span>
                                    </motion.div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className={`text-center mt-6 transition-all duration-300 transform ${activeConfig.text}`}>
                <p className="font-comic text-xl uppercase tracking-widest animate-pulse">{activeConfig.desc}</p>
            </div>
        </div>
    );
};

interface SensoryInputProps {
    icon: string;
    label: string;
    description: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    suggestions?: string[];
}

export const SensoryInputCard: React.FC<SensoryInputProps> = ({ icon, label, description, placeholder, value, onChange, suggestions = [] }) => (
    <div className="group relative bg-indigo-950/30 border-2 border-indigo-400/10 hover:border-indigo-400/40 p-5 rounded-3xl transition-all duration-300 hover:shadow-[0_10px_40px_rgba(99,102,241,0.15)] flex flex-col gap-4">
        <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-indigo-400/10">
                {icon}
            </div>
            <div className="flex flex-col flex-1 pt-1">
                <label className="text-[10px] md:text-xs font-black uppercase text-indigo-200 tracking-[0.2em] leading-none mb-1.5 flex items-center gap-2">
                    {label}
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                </label>
                <span className="text-[11px] text-indigo-300/60 italic leading-tight">
                    {description}
                </span>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="relative">
                <input 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder={placeholder} 
                    className="w-full bg-indigo-900/40 border-2 border-indigo-800/60 focus:border-indigo-400/80 rounded-2xl py-3.5 px-5 text-indigo-50 text-lg outline-none transition-all placeholder-indigo-300/20 font-serif shadow-inner focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                />
                <AnimatePresence>
                    {value && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => onChange('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-800/50 flex items-center justify-center text-xs text-indigo-300 hover:bg-indigo-700 transition-colors"
                        >
                            ✕
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => { onChange(s); soundManager.playChoice(); }}
                            className={`px-3 py-1.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border transition-all duration-300
                                ${value === s 
                                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105' 
                                    : 'bg-indigo-950/40 border-indigo-700/30 text-indigo-300/50 hover:text-indigo-100 hover:border-indigo-500 hover:bg-indigo-800/30'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);
