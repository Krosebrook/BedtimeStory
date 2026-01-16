
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, MadLibState } from './types';
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
}

export const Setup: React.FC<SetupProps> = ({ 
    input, onChange, onLaunch, onGenerateAvatar, isLoading, isAvatarLoading, isOnline, history, onLoadHistory 
}) => {
    const isMadLibReady = (Object.values(input.madlibs) as string[]).every(v => v.trim().length > 0);
    const isClassicReady = [input.heroName, input.heroPower, input.setting, input.sidekick, input.problem].every(v => (v as string).trim().length > 0);
    const isReady = input.mode === 'classic' ? isClassicReady : isMadLibReady;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start py-20 px-4 overflow-y-auto custom-scrollbar"
        >
            <HeroHeader />

            {/* Mode Toggle */}
            <div className="flex bg-slate-900 p-1 border-2 border-black mb-8 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-30">
                <button 
                    onClick={() => onChange('mode', 'classic')}
                    className={`px-6 py-2 rounded-lg font-comic transition-all ${input.mode === 'classic' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Classic Adventure
                </button>
                <button 
                    onClick={() => onChange('mode', 'madlibs')}
                    className={`px-6 py-2 rounded-lg font-comic transition-all ${input.mode === 'madlibs' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Mad Libs Magic
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
                        {input.mode === 'classic' ? (
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
                        ) : (
                            <motion.div key="madlibs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-orange-50/50 p-6 border-4 border-dashed border-orange-200 rounded-xl">
                                <h3 className="font-comic text-2xl text-orange-800 mb-6 text-center uppercase tracking-widest">The Secret Prophecy</h3>
                                <div className="font-serif text-xl leading-relaxed text-slate-800 space-y-4">
                                    <p>Once upon a time, a <input value={input.madlibs.adjective} onChange={e => onChange('madlibs', { ...input.madlibs, adjective: e.target.value })} placeholder="Adjective" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> explorer discovered a hidden <input value={input.madlibs.place} onChange={e => onChange('madlibs', { ...input.madlibs, place: e.target.value })} placeholder="Mystical Place" className="mx-2 w-40 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" />.</p>
                                    <p>They were carrying a giant <input value={input.madlibs.food} onChange={e => onChange('madlibs', { ...input.madlibs, food: e.target.value })} placeholder="Favorite Food" className="mx-2 w-36 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> when suddenly, a <input value={input.madlibs.animal} onChange={e => onChange('madlibs', { ...input.madlibs, animal: e.target.value })} placeholder="Silly Animal" className="mx-2 w-36 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> shouted: <input value={input.madlibs.sillyWord} onChange={e => onChange('madlibs', { ...input.madlibs, sillyWord: e.target.value })} placeholder="Silly Word" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" />!</p>
                                    <p>It made everyone feel very <input value={input.madlibs.feeling} onChange={e => onChange('madlibs', { ...input.madlibs, feeling: e.target.value })} placeholder="A Feeling" className="mx-2 w-32 border-b-2 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600" /> and the magic began...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button 
                        whileHover={{ scale: isReady && !isLoading && isOnline ? 1.02 : 1 }}
                        whileTap={{ scale: isReady && !isLoading && isOnline ? 0.98 : 1 }}
                        onClick={onLaunch}
                        disabled={!isReady || isLoading || !isOnline}
                        className="comic-btn w-full mt-12 bg-red-600 text-white text-3xl py-6 hover:bg-red-500 disabled:bg-gray-400 shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                    >
                        {!isOnline ? 'Reconnect to Create' : (isLoading ? 'Brewing Magic...' : 'Begin Adventure')}
                    </motion.button>
                </motion.div>

                {/* History Side Panel (Memory Jar) */}
                <aside className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-blue-900 border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[400px]">
                        <h3 className="font-comic text-2xl text-white mb-6 flex items-center gap-3">
                            <span className="text-4xl">🏺</span> Memory Jar
                        </h3>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-blue-300 italic opacity-50 border-2 border-dashed border-blue-700 rounded-lg">
                                    No memories saved yet...
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.button
                                        key={item.id}
                                        whileHover={{ x: 4, scale: 1.02 }}
                                        onClick={() => onLoadHistory(item)}
                                        className="w-full bg-blue-800/50 hover:bg-blue-700/80 p-4 border-2 border-black flex items-center gap-4 text-left transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-blue-950 flex-shrink-0">
                                            {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl">📖</span>}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-comic text-white truncate text-lg leading-tight uppercase">{item.story.title}</p>
                                            <p className="text-[10px] text-blue-300 font-mono uppercase opacity-70">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                        
                        <p className="mt-4 text-[10px] text-blue-400 text-center font-sans font-bold uppercase tracking-widest opacity-50">
                            Stored in Multiverse Sync v1.0
                        </p>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};
