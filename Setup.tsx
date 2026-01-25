
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, MadLibState, SleepConfig, StoryLength, AmbientTheme } from './types';
import { HeroHeader } from './HeroHeader';
import { CachedStory } from './lib/StorageManager';
import { LoadingFX } from './LoadingFX';
import { soundManager } from './SoundManager';

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
    onPrepareSequel: (cached: CachedStory) => void;
}

const MadLibField = ({ label, value, onChange, suggestions }: { label: string, value: string, onChange: (val: string) => void, suggestions: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => { setIsOpen(true); soundManager.playChoice(); }}
                className={`inline-block mx-2 w-32 border-b-4 border-dashed border-orange-400 text-center font-bold text-xl px-2 py-1 transition-colors rounded-md focus:ring-4 focus:ring-orange-200 outline-none ${value ? 'text-blue-700 border-blue-400 bg-blue-50' : 'text-gray-400 hover:bg-orange-50'}`}
                aria-label={`Choose a ${label}. Current value: ${value || 'not set'}`}
            >
                {value || label}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} role="dialog" aria-modal="true" aria-label={`Select ${label}`}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-[6px] border-black p-6 rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <h3 className="font-comic text-2xl text-center mb-6 uppercase">Pick a {label}!</h3>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {suggestions.map(s => (
                                    <button key={s} onClick={() => { onChange(s); setIsOpen(false); soundManager.playSparkle(); }} className="p-3 bg-blue-50 hover:bg-blue-100 border-2 border-black rounded-xl font-comic text-lg transition-transform active:scale-95">
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <input autoFocus value={value} onChange={e => onChange(e.target.value)} placeholder="Or type your own..." className="w-full border-4 border-gray-200 rounded-xl p-3 text-xl focus:border-black outline-none" onKeyDown={e => e.key === 'Enter' && setIsOpen(false)} />
                            <button onClick={() => setIsOpen(false)} className="w-full mt-4 bg-green-500 text-white font-comic text-xl py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_black]">DONE</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

const GeminiWizardStep: React.FC<{ prompt: string; children: React.ReactNode; onNext: () => void; onBack: () => void; isFirst: boolean; isLast: boolean; }> = ({ prompt, children, onNext, onBack, isFirst, isLast }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-black flex-shrink-0 flex items-center justify-center text-4xl shadow-md">🤖</div>
            <div className="bg-white border-4 border-black rounded-3xl rounded-tl-none p-4 md:p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] flex-1">
                <p className="font-comic text-xl md:text-2xl text-blue-900 leading-snug">{prompt}</p>
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full max-w-lg mx-auto">{children}</div>
        <div className="flex justify-between items-center mt-10">
            <button onClick={onBack} disabled={isFirst} className={`w-14 h-14 rounded-full border-4 border-black flex items-center justify-center text-2xl ${isFirst ? 'opacity-20 cursor-not-allowed bg-slate-100' : 'bg-white hover:bg-slate-50 shadow-[4px_4px_0px_black]'}`} aria-label="Go back">⬅</button>
            <button onClick={onNext} className={`h-14 px-8 rounded-full border-4 border-black text-xl font-comic uppercase shadow-[4px_4px_0px_black] hover:-translate-y-1 ${isLast ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>{isLast ? 'Finish!' : 'Next ➡'}</button>
        </div>
    </motion.div>
);

export const Setup: React.FC<SetupProps> = ({ input, onChange, onLaunch, onGenerateAvatar, isLoading, isAvatarLoading, isOnline, history, onLoadHistory, handleSleepConfigChange, onDeleteHistory, onPrepareSequel }) => {
    const [wizardStep, setWizardStep] = useState(0);
    // Fixed: Explicitly cast element of Object.values to string to resolve 'unknown' type property 'length' error
    const isReady = input.mode === 'sleep' ? !!input.heroName : (input.mode === 'madlibs' ? Object.values(input.madlibs).every(v => (v as string).length > 0) : (!!input.heroName && !!input.setting));

    const voices: {id: string, icon: string, label: string}[] = [
        { id: 'Kore', icon: '🌸', label: 'Soothing' },
        { id: 'Aoede', icon: '🐦', label: 'Melodic' },
        { id: 'Zephyr', icon: '🍃', label: 'Gentle' },
        { id: 'Lira', icon: '✨', label: 'Ethereal' },
        { id: 'Puck', icon: '🦊', label: 'Playful' },
        { id: 'Charon', icon: '🐻', label: 'Deep' }
    ];

    return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center py-10 px-4 md:px-8 overflow-y-auto">
            <HeroHeader />
            <div className="flex flex-wrap justify-center gap-2 bg-slate-900 p-2 border-2 border-black mb-8 rounded-xl shadow-xl z-30" role="radiogroup" aria-label="Choose Story Mode">
                {['classic', 'madlibs', 'sleep'].map(m => (
                    <button key={m} onClick={() => onChange('mode', m)} className={`px-4 py-2 rounded-lg font-comic transition-all uppercase text-sm md:text-base ${input.mode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`} aria-checked={input.mode === m} role="radio">
                        {m === 'sleep' ? '🌙 Sleepy' : m === 'madlibs' ? '🤪 Mad Libs' : '⚔️ Classic'}
                    </button>
                ))}
            </div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div layout className="lg:col-span-2 bg-white border-[6px] border-black shadow-[12px_12px_0px_rgba(30,58,138,0.3)] p-6 md:p-10 relative z-20 rounded-sm flex flex-col min-h-[500px]">
                    <AnimatePresence>{isLoading && <LoadingFX embedded={true} mode={input.mode} />}</AnimatePresence>
                    
                    <div className="flex-1">
                        {input.mode === 'classic' && (
                            <div className="h-full">
                                {wizardStep === 0 && <GeminiWizardStep prompt="Who is our hero today?" onNext={() => setWizardStep(1)} onBack={() => {}} isFirst={true} isLast={false}>
                                    <input autoFocus value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="Enter name..." className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-blue-500 focus:outline-none" />
                                </GeminiWizardStep>}
                                {wizardStep === 1 && <GeminiWizardStep prompt="Where does the adventure begin?" onNext={() => setWizardStep(2)} onBack={() => setWizardStep(0)} isFirst={false} isLast={false}>
                                    <input autoFocus value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="e.g. Candy Planet" className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-purple-500 focus:outline-none" />
                                </GeminiWizardStep>}
                                {wizardStep === 2 && <div className="space-y-6">
                                    <h3 className="font-comic text-2xl uppercase text-center mb-4">Mission Finalized!</h3>
                                    <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                                        <p className="font-comic text-xl">Hero: <span className="text-blue-600">{input.heroName}</span></p>
                                        <p className="font-comic text-xl">World: <span className="text-purple-600">{input.setting}</span></p>
                                    </div>
                                    <button onClick={() => setWizardStep(0)} className="text-sm text-slate-400 underline w-full text-center">Edit Details</button>
                                </div>}
                            </div>
                        )}

                        {input.mode === 'sleep' && (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <label className="font-comic text-indigo-700 text-xl block mb-2">Who is going to sleep?</label>
                                    <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="Hero's name..." className="w-full border-b-4 border-indigo-200 p-4 text-center text-3xl font-serif text-indigo-900 focus:border-indigo-500 outline-none bg-transparent" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h4 className="font-comic text-sm uppercase text-indigo-400">Sensory Magic</h4>
                                        <input value={input.sleepConfig.texture} onChange={e => handleSleepConfigChange('texture', e.target.value)} placeholder="A soft texture..." className="w-full p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none" />
                                        <input value={input.sleepConfig.sound} onChange={e => handleSleepConfigChange('sound', e.target.value)} placeholder="A quiet sound..." className="w-full p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-comic text-sm uppercase text-indigo-400">Environment</h4>
                                        <select value={input.sleepConfig.theme} onChange={e => handleSleepConfigChange('theme', e.target.value)} className="w-full p-3 border-2 border-indigo-100 rounded-xl bg-white outline-none">
                                            <option>Cloud Kingdom</option>
                                            <option>Starry Space</option>
                                            <option>Magic Forest</option>
                                            <option>Deep Ocean</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-xs text-indigo-400 italic font-serif">Note: Sleep Mode narratives are now 6x longer for a deeper journey to sleep.</p>
                                </div>
                            </div>
                        )}
                        
                        {input.mode === 'madlibs' && (
                            <div className="font-serif text-xl md:text-2xl leading-relaxed text-center py-6">
                                <p>Once, a <MadLibField label="Adjective" value={input.madlibs.adjective} onChange={v => onChange('madlibs', { ...input.madlibs, adjective: v })} suggestions={["brave", "tiny", "glowing", "invisible"]} /> explorer found a 
                                <MadLibField label="Place" value={input.madlibs.place} onChange={v => onChange('madlibs', { ...input.madlibs, place: v })} suggestions={["Cave", "Cloud City", "Candy Lab"]} />.
                                They carried a <MadLibField label="Food" value={input.madlibs.food} onChange={v => onChange('madlibs', { ...input.madlibs, food: v })} suggestions={["Pizza", "Marshmallow", "Taco"]} /> when a 
                                <MadLibField label="Animal" value={input.madlibs.animal} onChange={v => onChange('madlibs', { ...input.madlibs, animal: v })} suggestions={["Hamster", "Dragon", "Penguin"]} /> yelled 
                                <MadLibField label="Silly Word" value={input.madlibs.sillyWord} onChange={v => onChange('madlibs', { ...input.madlibs, sillyWord: v })} suggestions={["Bazinga!", "Sploot!", "Zoinks!"]} />!</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <label className="font-comic text-xs uppercase text-slate-400 block mb-4 text-center tracking-widest">Select Narrator</label>
                        <div className="flex flex-wrap justify-center gap-3" role="radiogroup" aria-label="Narrator Voices">
                            {voices.map(v => (
                                <button key={v.id} onClick={() => { onChange('narratorVoice', v.id); soundManager.playChoice(); }} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all w-20 md:w-24 ${input.narratorVoice === v.id ? 'border-blue-500 bg-blue-50 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} role="radio" aria-checked={input.narratorVoice === v.id}>
                                    <span className="text-3xl mb-1">{v.icon}</span>
                                    <span className="text-[10px] font-black uppercase text-center leading-none">{v.label}</span>
                                    <span className="text-[8px] text-slate-400 mt-1 uppercase">{v.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={onLaunch} disabled={!isReady || isLoading || !isOnline} className={`comic-btn w-full mt-8 py-5 text-2xl md:text-3xl rounded-xl transition-all ${isReady && !isLoading ? 'bg-red-600 text-white shadow-[6px_6px_0px_black]' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`} aria-label="Start your story">
                        {isLoading ? 'CRAFTING TALE...' : (input.mode === 'sleep' ? 'BEGIN DREAMING' : 'START MISSION')}
                    </button>
                </motion.div>

                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 border-[6px] border-black p-6 shadow-[8px_8px_0px_black] text-white rounded-sm h-full flex flex-col">
                        <h3 className="font-comic text-2xl mb-6 flex items-center gap-2">🏺 Memory Jar</h3>
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                            {history.length === 0 ? (
                                <p className="text-center text-slate-500 italic py-10">No memories stored yet...</p>
                            ) : (
                                history.map(h => (
                                    <div key={h.id} className="group relative flex items-center bg-slate-800 p-3 rounded-xl border-2 border-transparent hover:border-blue-500 transition-all">
                                        <button onClick={() => onLoadHistory(h)} className="flex-1 flex items-center gap-3 text-left">
                                            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
                                                {h.avatar ? <img src={h.avatar} className="w-full h-full object-cover" /> : '📘'}
                                            </div>
                                            <span className="font-comic text-sm truncate uppercase">{h.story.title}</span>
                                        </button>
                                        <button onClick={() => onDeleteHistory(h.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:scale-110 transition-all" aria-label="Delete memory">🗑️</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
