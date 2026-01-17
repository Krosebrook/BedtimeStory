
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, MadLibState, SleepConfig, StoryLength } from './types';
import { HeroHeader } from './HeroHeader';
import { CachedStory } from './lib/StorageManager';

interface SetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    onLaunch: () => void;
    onGenerateAvatar: () => void;
    isLoading: boolean;
    isAvatarLoading: boolean;
    isOnline: boolean;
    history: CachedStory[];
    onLoadHistory: (cached: CachedStory) => void;
    handleSleepConfigChange: (field: keyof SleepConfig, value: string) => void;
    onDeleteHistory: (id: string) => void;
}

export const Setup: React.FC<SetupProps> = ({ 
    input, onChange, onLaunch, onGenerateAvatar, isLoading, isAvatarLoading, isOnline, history, onLoadHistory, handleSleepConfigChange, onDeleteHistory 
}) => {
    const isMadLibReady = (Object.values(input.madlibs) as string[]).every(v => v.trim().length > 0);
    const isClassicReady = [input.heroName, input.setting].every(v => (v as string).trim().length > 0); 
    
    // Sleep Readiness
    let isSleepReady = !!input.heroName;
    if (input.sleepConfig.subMode === 'parent-madlib') {
        isSleepReady = isSleepReady && !!input.sleepConfig.texture && !!input.sleepConfig.sound && !!input.sleepConfig.scent;
    }

    const isReady = input.mode === 'madlibs' ? isMadLibReady : (input.mode === 'sleep' ? isSleepReady : isClassicReady);

    const sleepThemes = [
        { name: 'Cloud Kingdom', icon: '☁️', color: 'bg-blue-100' },
        { name: 'Starry Space', icon: '✨', color: 'bg-indigo-200' },
        { name: 'Deep Ocean', icon: '🌊', color: 'bg-cyan-100' },
        { name: 'Magic Forest', icon: '🌲', color: 'bg-emerald-100' }
    ];

    const voices = [
        { id: 'Kore', label: 'Soothing (Kore)', icon: '🌸' },
        { id: 'Puck', label: 'Playful (Puck)', icon: '🦊' },
        { id: 'Charon', label: 'Deep (Charon)', icon: '🐻' },
        { id: 'Fenrir', label: 'Wild (Fenrir)', icon: '🐺' },
        { id: 'Aoede', label: 'Bright (Aoede)', icon: '🐦' },
    ];

    const lengthLabels: Record<StoryLength, string> = {
        short: 'Short (~3 min)',
        medium: 'Medium (~5 min)',
        long: 'Epic (~10 min)'
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start py-20 px-4 overflow-y-auto custom-scrollbar"
        >
            <HeroHeader />

            {/* Mode Toggle */}
            <div className="flex flex-wrap justify-center gap-2 bg-slate-900 p-2 border-2 border-black mb-8 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-30">
                <button 
                    onClick={() => onChange('mode', 'classic')}
                    className={`px-4 py-2 rounded-lg font-comic transition-all ${input.mode === 'classic' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Classic Adventure
                </button>
                <button 
                    onClick={() => onChange('mode', 'madlibs')}
                    className={`px-4 py-2 rounded-lg font-comic transition-all ${input.mode === 'madlibs' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Mad Libs Magic
                </button>
                <button 
                    onClick={() => onChange('mode', 'sleep')}
                    className={`px-4 py-2 rounded-lg font-comic transition-all flex items-center gap-2 ${input.mode === 'sleep' ? 'bg-indigo-900 text-yellow-200 shadow-lg border border-yellow-500' : 'text-slate-400 hover:text-white'}`}
                >
                    <span>🌙</span> Sleepy Time
                </button>
            </div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Main Form */}
                <motion.div 
                    layout
                    className="lg:col-span-2 bg-white border-[6px] border-black shadow-[16px_16px_0px_rgba(30,58,138,0.5)] p-8 md:p-12 relative z-20"
                >
                    <div className="flex flex-col items-center mb-12">
                        <div className="relative group">
                            <motion.div className="w-36 h-36 bg-yellow-100 border-[6px] border-black rounded-full flex items-center justify-center overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                                {input.heroAvatarUrl ? (
                                    <img src={input.heroAvatarUrl} alt="Hero" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl">{isAvatarLoading ? '✨' : '👤'}</span>
                                )}
                            </motion.div>
                            {isAvatarLoading && (
                                <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={onGenerateAvatar}
                            disabled={isAvatarLoading || isLoading || !isOnline}
                            className="comic-btn bg-purple-600 text-white px-6 py-2 mt-6 text-sm disabled:bg-gray-400"
                        >
                            {!isOnline ? 'Offline' : (isAvatarLoading ? 'Generating...' : '✨ Spark Avatar')}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {input.mode === 'madlibs' && (
                            <motion.div key="madlibs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-orange-50/50 p-6 border-4 border-dashed border-orange-200 rounded-xl">
                                <h3 className="font-comic text-2xl text-orange-800 mb-6 text-center uppercase tracking-widest">The Secret Prophecy</h3>
                                <div className="font-serif text-xl leading-relaxed text-slate-800 space-y-4">
                                    <p>Once upon a time, a <input value={input.madlibs.adjective} onChange={e => onChange('madlibs', { ...input.madlibs, adjective: e.target.value })} placeholder="Adjective" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> explorer discovered a hidden <input value={input.madlibs.place} onChange={e => onChange('madlibs', { ...input.madlibs, place: e.target.value })} placeholder="Mystical Place" className="mx-2 w-40 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" />.</p>
                                    <p>They were carrying a giant <input value={input.madlibs.food} onChange={e => onChange('madlibs', { ...input.madlibs, food: e.target.value })} placeholder="Favorite Food" className="mx-2 w-36 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> when suddenly, a <input value={input.madlibs.animal} onChange={e => onChange('madlibs', { ...input.madlibs, animal: e.target.value })} placeholder="Silly Animal" className="mx-2 w-36 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> shouted: <input value={input.madlibs.sillyWord} onChange={e => onChange('madlibs', { ...input.madlibs, sillyWord: e.target.value })} placeholder="Silly Word" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" />!</p>
                                    <p>It made everyone feel very <input value={input.madlibs.feeling} onChange={e => onChange('madlibs', { ...input.madlibs, feeling: e.target.value })} placeholder="A Feeling" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> and the magic began...</p>
                                </div>
                            </motion.div>
                        )}
                        
                        {input.mode === 'classic' && (
                            <motion.div key="classic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="font-comic text-blue-700">Hero Name</label>
                                        <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="e.g. Captain Cosmic" className="w-full border-4 border-black p-3" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-comic text-red-600">Super Power</label>
                                        <input value={input.heroPower} onChange={e => onChange('heroPower', e.target.value)} placeholder="e.g. Flight" className="w-full border-4 border-black p-3" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="font-comic text-purple-700">Setting</label>
                                    <input value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="e.g. Floating Island" className="w-full border-4 border-black p-3" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="font-comic text-green-700">Sidekick</label>
                                        <input value={input.sidekick} onChange={e => onChange('sidekick', e.target.value)} placeholder="e.g. Robotic Owl" className="w-full border-4 border-black p-3" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-comic text-orange-600">Trouble</label>
                                        <input value={input.problem} onChange={e => onChange('problem', e.target.value)} placeholder="e.g. Stolen Sun" className="w-full border-4 border-black p-3" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {input.mode === 'sleep' && (
                            <motion.div key="sleep" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                <div className="flex flex-wrap gap-3 justify-center">
                                    {[
                                        { id: 'automatic', label: 'Auto Journey', icon: '🤖' },
                                        { id: 'parent-madlib', label: "Parent's Touch", icon: '👩‍🏫' },
                                        { id: 'child-friendly', label: 'Quick Themes', icon: '🎈' }
                                    ].map(sub => (
                                        <button 
                                            key={sub.id}
                                            onClick={() => handleSleepConfigChange('subMode', sub.id)}
                                            className={`px-4 py-2 rounded-xl font-comic border-4 transition-all flex items-center gap-2 ${input.sleepConfig.subMode === sub.id ? 'bg-indigo-600 text-white border-black shadow-[4px_4px_0px_black]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                                        >
                                            <span>{sub.icon}</span> {sub.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                     <div className="space-y-1">
                                        <label className="font-comic text-indigo-700 text-xl">Sleepy Hero</label>
                                        <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="Who is going to sleep?" className="w-full border-4 border-indigo-200 p-4 focus:border-indigo-500 outline-none text-xl" />
                                    </div>
                                
                                    {input.sleepConfig.subMode === 'automatic' && (
                                        <div className="bg-indigo-50/50 p-6 border-4 border-dashed border-indigo-100 rounded-2xl">
                                            <label className="font-comic text-indigo-700">Setting (Optional)</label>
                                            <input value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="e.g. A Fluffy Cloud" className="w-full border-2 border-indigo-200 p-3 mt-2 focus:border-indigo-400 outline-none" />
                                            <p className="text-sm text-indigo-400 mt-4 italic">The Multiverse will weave a completely original, whisper-soft environment for you.</p>
                                        </div>
                                    )}

                                    {input.sleepConfig.subMode === 'parent-madlib' && (
                                        <div className="space-y-4 bg-indigo-50/80 p-6 border-4 border-indigo-200 rounded-2xl">
                                            <h4 className="font-comic text-indigo-800 text-lg uppercase tracking-wider mb-2">Grounding Elements</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-xs font-bold uppercase text-indigo-400">Texture</span>
                                                    <input value={input.sleepConfig.texture} onChange={e => handleSleepConfigChange('texture', e.target.value)} placeholder="e.g. Silk" className="w-full border-b-2 border-indigo-300 bg-transparent p-2 focus:outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs font-bold uppercase text-indigo-400">Sound</span>
                                                    <input value={input.sleepConfig.sound} onChange={e => handleSleepConfigChange('sound', e.target.value)} placeholder="e.g. Gentle Rain" className="w-full border-b-2 border-indigo-300 bg-transparent p-2 focus:outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs font-bold uppercase text-indigo-400">Scent</span>
                                                    <input value={input.sleepConfig.scent} onChange={e => handleSleepConfigChange('scent', e.target.value)} placeholder="e.g. Lavender" className="w-full border-b-2 border-indigo-300 bg-transparent p-2 focus:outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {input.sleepConfig.subMode === 'child-friendly' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {sleepThemes.map(theme => (
                                                <button 
                                                    key={theme.name}
                                                    onClick={() => handleSleepConfigChange('theme', theme.name)}
                                                    className={`p-6 border-4 rounded-3xl flex flex-col items-center gap-3 transition-all ${input.sleepConfig.theme === theme.name ? `border-indigo-600 ${theme.color} scale-105 shadow-xl` : 'border-slate-100 bg-slate-50 opacity-40 hover:opacity-100 hover:scale-102'}`}
                                                >
                                                    <span className="text-5xl drop-shadow-sm">{theme.icon}</span>
                                                    <span className="font-comic text-indigo-900">{theme.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Story Length Slider */}
                    <div className="mt-12 pt-8 border-t-4 border-slate-100">
                        <label className="font-comic text-gray-400 mb-4 block uppercase text-sm tracking-widest text-center">Narrative Scope</label>
                        <div className="relative pt-6 pb-2 px-8">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4 absolute -top-1 left-8 right-8">
                                <span>Short</span>
                                <span>Medium</span>
                                <span>Epic</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="1"
                                value={input.storyLength === 'short' ? 0 : input.storyLength === 'medium' ? 1 : 2}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const len = val === 0 ? 'short' : val === 1 ? 'medium' : 'long';
                                    onChange('storyLength', len);
                                }}
                                className="w-full h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 border-2 border-slate-200"
                            />
                            <div className="text-center font-comic text-2xl text-blue-600 mt-4 animate-pulse">
                                {lengthLabels[input.storyLength]}
                            </div>
                        </div>
                    </div>

                    {/* Voice Selection */}
                    <div className="mt-12 pt-8 border-t-4 border-slate-100">
                        <label className="font-comic text-gray-400 mb-6 block uppercase text-sm tracking-widest text-center">Voice Synthesis</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {voices.map(voice => (
                                <button
                                    key={voice.id}
                                    onClick={() => onChange('narratorVoice', voice.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-4 transition-all ${input.narratorVoice === voice.id ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105 shadow-md' : 'border-slate-100 text-slate-300 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-blue-200'}`}
                                >
                                    <span className="text-3xl">{voice.icon}</span>
                                    <span className="text-[10px] font-black uppercase truncate w-full text-center">{voice.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <motion.button 
                        whileHover={{ scale: isReady && !isLoading && isOnline ? 1.02 : 1 }}
                        whileTap={{ scale: isReady && !isLoading && isOnline ? 0.98 : 1 }}
                        onClick={onLaunch}
                        disabled={!isReady || isLoading || !isOnline}
                        className={`comic-btn w-full mt-12 text-3xl py-8 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:shadow-none transition-all shadow-[8px_8px_0px_rgba(0,0,0,1)] ${input.mode === 'sleep' ? 'bg-indigo-700 text-yellow-100 hover:bg-indigo-800' : 'bg-red-600 text-white hover:bg-red-500'}`}
                    >
                        {!isOnline ? 'OFFLINE' : (isLoading ? 'CRAFTING TALE...' : (input.mode === 'sleep' ? 'START DREAMING' : 'BEGIN MISSION'))}
                    </motion.button>
                </motion.div>

                {/* History Side Panel (Memory Jar) */}
                <aside className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-slate-900 border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[500px]">
                        <h3 className="font-comic text-2xl text-white mb-8 flex items-center justify-between">
                            <span className="flex items-center gap-3"><span className="text-4xl">🏺</span> Memory Jar</span>
                            <span className="text-[10px] bg-blue-600 px-2 py-1 rounded font-sans uppercase">Offline</span>
                        </h3>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-16 text-slate-500 italic opacity-50 border-4 border-dashed border-slate-800 rounded-3xl">
                                    No memories captured...
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ x: 6 }}
                                        className="w-full bg-slate-800 border-4 border-black flex items-center p-0 group relative rounded-xl overflow-hidden shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] transition-all"
                                    >
                                        <button 
                                            onClick={() => onLoadHistory(item)}
                                            className="flex-1 flex items-center gap-4 p-4 text-left"
                                        >
                                            <div className="w-14 h-14 rounded-full border-4 border-black overflow-hidden bg-slate-700 flex-shrink-0 shadow-inner">
                                                {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-3xl">📘</span>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-comic text-white truncate text-xl leading-none mb-1 uppercase tracking-tight">{item.story.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] text-blue-400 font-black uppercase opacity-60">
                                                        {new Date(item.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                    <span className="text-[8px] text-green-400 font-black uppercase">Stored</span>
                                                </div>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                                            className="h-full bg-red-600 hover:bg-red-500 text-white w-12 flex items-center justify-center border-l-4 border-black opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 bottom-0"
                                            title="Forget Memory"
                                        >
                                            🗑️
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};
