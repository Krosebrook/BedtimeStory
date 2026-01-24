
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

// -- Mad Lib Helper Component (Card Overlay) --
const MadLibField = ({ 
    label, 
    value, 
    onChange, 
    suggestions 
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    suggestions: string[] 
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => { setIsOpen(true); soundManager.playChoice(); }}
                className={`inline-block mx-2 w-32 border-b-4 border-dashed border-orange-400 text-center font-bold text-xl px-2 py-1 transition-colors ${value ? 'text-blue-700 border-blue-400 bg-blue-50' : 'text-gray-400 hover:bg-orange-50'}`}
                aria-label={`Select ${label}. Current value: ${value || 'empty'}`}
            >
                {value || label}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="bg-white border-[6px] border-black p-6 rounded-3xl shadow-[12px_12px_0px_black] w-full max-w-sm relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 rounded-full border-2 border-black font-bold"
                            >X</button>

                            <h3 className="font-comic text-2xl text-center mb-6 uppercase tracking-widest bg-yellow-300 -mx-6 -mt-6 rounded-t-xl py-4 border-b-4 border-black">
                                Choose a {label}!
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {suggestions.map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => { onChange(s); setIsOpen(false); soundManager.playSparkle(); }}
                                        className="p-4 bg-blue-50 hover:bg-blue-100 border-4 border-blue-200 hover:border-blue-400 rounded-xl font-comic text-lg transition-all active:scale-95"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-gray-400 uppercase">Or type your own</span>
                                <input 
                                    autoFocus
                                    value={value}
                                    onChange={e => onChange(e.target.value)}
                                    placeholder={`Type a ${label}...`}
                                    className="w-full border-4 border-gray-300 rounded-xl p-3 text-xl font-bold focus:border-black focus:outline-none"
                                    onKeyDown={e => { if(e.key === 'Enter') setIsOpen(false); }}
                                />
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-full mt-4 bg-green-500 text-white font-comic text-xl py-2 rounded-xl border-4 border-green-700 hover:bg-green-400">DONE</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

// -- Gemini Guide / Wizard Component --
interface WizardStepProps { 
    prompt: string;
    children: React.ReactNode; 
    onNext: () => void; 
    onBack: () => void; 
    isFirst: boolean; 
    isLast: boolean; 
}

const GeminiWizardStep: React.FC<WizardStepProps> = ({ 
    prompt,
    children, 
    onNext, 
    onBack, 
    isFirst, 
    isLast 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full"
        >
            {/* Gemini Guide Bubble */}
            <div className="flex items-start gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-black shadow-md flex-shrink-0 flex items-center justify-center animate-float">
                    <span className="text-4xl">🤖</span>
                </div>
                <div className="bg-white border-4 border-black rounded-3xl rounded-tl-none p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.2)] flex-1 relative">
                    <p className="font-comic text-xl md:text-2xl text-blue-900 leading-snug">
                        {prompt}
                    </p>
                    <div className="absolute -left-3 top-6 w-0 h-0 border-t-[15px] border-t-transparent border-r-[15px] border-r-black border-b-[15px] border-b-transparent"></div>
                    <div className="absolute -left-[8px] top-6 w-0 h-0 border-t-[15px] border-t-transparent border-r-[15px] border-r-white border-b-[15px] border-b-transparent"></div>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center gap-6 w-full max-w-lg mx-auto bg-slate-50/50 p-8 rounded-3xl border-2 border-dashed border-slate-300">
                {children}
            </div>

            <div className="flex justify-between items-center mt-10">
                <button 
                    onClick={onBack} 
                    disabled={isFirst}
                    className={`w-16 h-16 rounded-full border-4 border-black flex items-center justify-center text-3xl transition-all ${isFirst ? 'opacity-20 cursor-not-allowed bg-slate-200' : 'bg-white hover:bg-slate-100 hover:-translate-x-1 shadow-[4px_4px_0px_black]'}`}
                >
                    ⬅
                </button>
                
                <div className="flex gap-2">
                    {[0,1,2,3,4,5].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${isLast ? (i===5 ? 'bg-green-500 scale-125' : 'bg-green-200') : 'bg-slate-300'}`} />
                    ))}
                </div>

                <button 
                    onClick={onNext} 
                    className={`h-16 px-8 rounded-full border-4 border-black flex items-center justify-center text-2xl font-comic uppercase tracking-widest transition-all shadow-[4px_4px_0px_black] hover:-translate-y-1 ${isLast ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
                >
                    {isLast ? 'Finish!' : 'Next ➡'}
                </button>
            </div>
        </motion.div>
    );
};

export const Setup: React.FC<SetupProps> = ({ 
    input, onChange, onLaunch, onGenerateAvatar, isLoading, isAvatarLoading, isOnline, history, onLoadHistory, handleSleepConfigChange, onDeleteHistory, onPrepareSequel
}) => {
    const [wizardStep, setWizardStep] = useState(0);

    const isMadLibReady = (Object.values(input.madlibs) as string[]).every(v => v.trim().length > 0);
    const isClassicReady = [input.heroName, input.setting].every(v => (v as string).trim().length > 0); 
    
    // Sleep Readiness
    let isSleepReady = !!input.heroName;
    if (input.sleepConfig.subMode === 'parent-madlib') {
        isSleepReady = isSleepReady && !!input.sleepConfig.texture && !!input.sleepConfig.sound && !!input.sleepConfig.scent;
    }

    const isReady = input.mode === 'madlibs' ? isMadLibReady : (input.mode === 'sleep' ? isSleepReady : isClassicReady);

    const sleepThemes = [
        { name: 'Cloud Kingdom', icon: '☁️', color: 'bg-blue-100', accent: 'border-blue-400' },
        { name: 'Starry Space', icon: '✨', color: 'bg-indigo-100', accent: 'border-indigo-400' },
        { name: 'Deep Ocean', icon: '🌊', color: 'bg-cyan-100', accent: 'border-cyan-400' },
        { name: 'Magic Forest', icon: '🌲', color: 'bg-emerald-100', accent: 'border-emerald-400' }
    ];

    const ambientOptions: { id: AmbientTheme; label: string; icon: string; color: string }[] = [
        { id: 'auto', label: 'Auto-Detect', icon: '🪄', color: 'bg-slate-100' },
        { id: 'rain', label: 'Gentle Rain', icon: '🌧️', color: 'bg-blue-100' },
        { id: 'forest', label: 'Forest Life', icon: '🌲', color: 'bg-green-100' },
        { id: 'space', label: 'Cosmic Hum', icon: '🌌', color: 'bg-purple-100' },
        { id: 'magic', label: 'Ethereal', icon: '✨', color: 'bg-yellow-100' },
    ];

    const voices = [
        { id: 'Kore', label: 'Soothing (Kore)', icon: '🌸' },
        { id: 'Puck', label: 'Playful (Puck)', icon: '🦊' },
        { id: 'Charon', label: 'Deep (Charon)', icon: '🐻' },
        { id: 'Fenrir', label: 'Wild (Fenrir)', icon: '🐺' },
        { id: 'Aoede', label: 'Bright (Aoede)', icon: '🐦' },
    ];

    const lengths: { id: StoryLength, label: string, time: string, icon: string, color: string, bars: number }[] = [
        { id: 'short', label: 'Quick Tale', time: '~3 min', icon: '⚡', color: 'text-green-600', bars: 1 },
        { id: 'medium', label: 'Full Story', time: '~7 min', icon: '📖', color: 'text-blue-600', bars: 2 },
        { id: 'long', label: 'Epic Saga', time: '~15 min', icon: '🏰', color: 'text-purple-600', bars: 3 }
    ];

    // Reset wizard step when mode changes
    useEffect(() => {
        setWizardStep(0);
    }, [input.mode]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start py-20 px-4 overflow-y-auto custom-scrollbar"
        >
            <HeroHeader />

            {/* Mode Toggle */}
            <div className="flex flex-wrap justify-center gap-2 bg-slate-900 p-2 border-2 border-black mb-8 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-30" role="radiogroup" aria-label="Story Mode">
                <button 
                    role="radio"
                    aria-checked={input.mode === 'classic'}
                    onClick={() => onChange('mode', 'classic')}
                    className={`px-4 py-2 rounded-lg font-comic transition-all ${input.mode === 'classic' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Classic Adventure
                </button>
                <button 
                    role="radio"
                    aria-checked={input.mode === 'madlibs'}
                    onClick={() => onChange('mode', 'madlibs')}
                    className={`px-4 py-2 rounded-lg font-comic transition-all ${input.mode === 'madlibs' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Mad Libs Magic
                </button>
                <button 
                    role="radio"
                    aria-checked={input.mode === 'sleep'}
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
                    className="lg:col-span-2 bg-white border-[6px] border-black shadow-[16px_16px_0px_rgba(30,58,138,0.5)] p-8 md:p-12 relative z-20 overflow-hidden min-h-[600px] flex flex-col"
                >
                    {/* engaging loading state overlay */}
                    <AnimatePresence>
                        {isLoading && <LoadingFX embedded={true} mode={input.mode} />}
                    </AnimatePresence>
                    
                    {/* Sequel Mode Banner */}
                    <AnimatePresence>
                        {input.sequelContext && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-gradient-to-r from-yellow-300 to-amber-400 border-4 border-black p-4 mb-8 flex items-center justify-between rounded-xl shadow-sm"
                            >
                                <div className="flex flex-col">
                                    <span className="font-comic text-xl uppercase tracking-widest text-black">🎬 Sequel Mode Active</span>
                                    <span className="font-serif text-sm italic text-black/80">Continuing from: "{input.sequelContext.lastTitle}"</span>
                                </div>
                                <button 
                                    onClick={() => onChange('sequelContext', undefined)}
                                    className="bg-black/10 hover:bg-black/20 p-2 rounded-full text-black font-bold"
                                    title="Cancel Sequel Mode"
                                >
                                    ✕
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Show Avatar ONLY if NOT in classic wizard steps 0-4 */}
                    <AnimatePresence>
                        {!(input.mode === 'classic' && wizardStep < 5) && (
                            <motion.div initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} className="flex flex-col items-center mb-12">
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
                                    {!isOnline ? 'Offline' : (isAvatarLoading ? 'Generating...' : (input.heroAvatarUrl ? '✨ Regenerate Avatar' : '✨ Spark Avatar'))}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {input.mode === 'madlibs' && (
                            <motion.div key="madlibs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-orange-50/50 p-6 md:p-10 border-4 border-dashed border-orange-200 rounded-3xl relative">
                                <h3 className="font-comic text-2xl text-orange-800 mb-6 text-center uppercase tracking-widest bg-white/50 p-2 rounded-lg inline-block w-full">✨ The Secret Prophecy ✨</h3>
                                
                                <div className="font-serif text-2xl leading-[2.5] text-slate-800 text-center">
                                    <p>
                                        Once upon a time, a 
                                        <MadLibField 
                                            label="Adjective" 
                                            value={input.madlibs.adjective} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, adjective: v })} 
                                            suggestions={["brave 🦁", "glowing ✨", "tiny 🐜", "clumsy 😵", "invisible 👻"]} 
                                        /> 
                                        explorer discovered a hidden 
                                        <MadLibField 
                                            label="Place" 
                                            value={input.madlibs.place} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, place: v })} 
                                            suggestions={["Cave 🗻", "Cloud City ☁️", "Candy Lab 🍭", "Treehouse 🌳"]} 
                                        />.
                                    </p>
                                    <p>
                                        They were carrying a giant 
                                        <MadLibField 
                                            label="Food" 
                                            value={input.madlibs.food} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, food: v })} 
                                            suggestions={["Pizza 🍕", "Marshmallow 🍡", "Taco 🌮", "Broccoli 🥦"]} 
                                        /> 
                                        when suddenly, a 
                                        <MadLibField 
                                            label="Animal" 
                                            value={input.madlibs.animal} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, animal: v })} 
                                            suggestions={["Hamster 🐹", "Dragon 🐉", "Penguin 🐧", "Octopus 🐙"]} 
                                        /> 
                                        shouted: 
                                        <MadLibField 
                                            label="Silly Word" 
                                            value={input.madlibs.sillyWord} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, sillyWord: v })} 
                                            suggestions={["Bazinga! ⚡", "Sploot! 💦", "Zoinks! 😱", "Banana! 🍌"]} 
                                        />!
                                    </p>
                                    <p>
                                        It made everyone feel very 
                                        <MadLibField 
                                            label="Feeling" 
                                            value={input.madlibs.feeling} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, feeling: v })} 
                                            suggestions={["excited 🤩", "wiggly 〰️", "bouncy 🦘", "sleepy 😴"]} 
                                        /> 
                                        and the magic began...
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        
                        {input.mode === 'classic' && (
                            <div key="classic" className="h-full flex flex-col">
                                {wizardStep === 0 && (
                                    <GeminiWizardStep 
                                        prompt="Greetings! Every great story needs a hero. What is your name?" 
                                        onNext={() => { soundManager.playChoice(); setWizardStep(1); }} 
                                        onBack={() => {}} 
                                        isFirst={true} 
                                        isLast={false}
                                    >
                                        <input 
                                            autoFocus
                                            value={input.heroName} 
                                            onChange={e => onChange('heroName', e.target.value)} 
                                            placeholder="e.g. Captain Cosmic" 
                                            className="w-full bg-white border-b-4 border-blue-500 p-6 text-4xl text-center font-comic focus:outline-none focus:border-blue-700 placeholder-blue-200 rounded-t-xl" 
                                        />
                                    </GeminiWizardStep>
                                )}
                                {wizardStep === 1 && (
                                    <GeminiWizardStep 
                                        prompt={`Amazing to meet you, ${input.heroName || 'Hero'}! What is your special ability?`} 
                                        onNext={() => { soundManager.playChoice(); setWizardStep(2); }} 
                                        onBack={() => setWizardStep(0)} 
                                        isFirst={false} 
                                        isLast={false}
                                    >
                                        <input 
                                            autoFocus
                                            value={input.heroPower} 
                                            onChange={e => onChange('heroPower', e.target.value)} 
                                            placeholder="e.g. Talking to Cats" 
                                            className="w-full bg-white border-b-4 border-red-500 p-6 text-4xl text-center font-comic focus:outline-none focus:border-red-700 placeholder-red-200 rounded-t-xl" 
                                        />
                                    </GeminiWizardStep>
                                )}
                                {wizardStep === 2 && (
                                    <GeminiWizardStep 
                                        prompt="Where does our adventure begin today?" 
                                        onNext={() => { soundManager.playChoice(); setWizardStep(3); }} 
                                        onBack={() => setWizardStep(1)} 
                                        isFirst={false} 
                                        isLast={false}
                                    >
                                        <input 
                                            autoFocus
                                            value={input.setting} 
                                            onChange={e => onChange('setting', e.target.value)} 
                                            placeholder="e.g. The Floating Islands" 
                                            className="w-full bg-white border-b-4 border-purple-500 p-6 text-4xl text-center font-comic focus:outline-none focus:border-purple-700 placeholder-purple-200 rounded-t-xl" 
                                        />
                                    </GeminiWizardStep>
                                )}
                                {wizardStep === 3 && (
                                    <GeminiWizardStep 
                                        prompt="It's dangerous to go alone! Who is with you?" 
                                        onNext={() => { soundManager.playChoice(); setWizardStep(4); }} 
                                        onBack={() => setWizardStep(2)} 
                                        isFirst={false} 
                                        isLast={false}
                                    >
                                        <input 
                                            autoFocus
                                            value={input.sidekick} 
                                            onChange={e => onChange('sidekick', e.target.value)} 
                                            placeholder="e.g. Zoom the Robot Dog" 
                                            className="w-full bg-white border-b-4 border-green-500 p-6 text-4xl text-center font-comic focus:outline-none focus:border-green-700 placeholder-green-200 rounded-t-xl" 
                                        />
                                    </GeminiWizardStep>
                                )}
                                {wizardStep === 4 && (
                                    <GeminiWizardStep 
                                        prompt="Uh oh! What problem do we need to solve?" 
                                        onNext={() => { soundManager.playChoice(); setWizardStep(5); }} 
                                        onBack={() => setWizardStep(3)} 
                                        isFirst={false} 
                                        isLast={false}
                                    >
                                        <input 
                                            autoFocus
                                            value={input.problem} 
                                            onChange={e => onChange('problem', e.target.value)} 
                                            placeholder="e.g. The sun has been stolen!" 
                                            className="w-full bg-white border-b-4 border-orange-500 p-6 text-4xl text-center font-comic focus:outline-none focus:border-orange-700 placeholder-orange-200 rounded-t-xl" 
                                        />
                                    </GeminiWizardStep>
                                )}
                                {wizardStep === 5 && (
                                    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                        <h3 className="font-comic text-3xl text-center text-blue-900 uppercase tracking-widest bg-blue-100 p-2 rounded-lg border-2 border-blue-200">✨ Mission File ✨</h3>
                                        <div className="bg-white border-4 border-dashed border-slate-300 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
                                            <div className="p-2 border-b"><span className="font-bold text-slate-400 uppercase text-xs block mb-1">Hero</span><p className="text-xl font-comic">{input.heroName}</p></div>
                                            <div className="p-2 border-b"><span className="font-bold text-slate-400 uppercase text-xs block mb-1">Power</span><p className="text-xl font-comic">{input.heroPower}</p></div>
                                            <div className="p-2 border-b"><span className="font-bold text-slate-400 uppercase text-xs block mb-1">World</span><p className="text-xl font-comic">{input.setting}</p></div>
                                            <div className="p-2 border-b"><span className="font-bold text-slate-400 uppercase text-xs block mb-1">Ally</span><p className="text-xl font-comic">{input.sidekick}</p></div>
                                            <div className="md:col-span-2 p-2 bg-red-50 rounded"><span className="font-bold text-red-400 uppercase text-xs block mb-1">Mission</span><p className="text-xl font-comic text-red-600">{input.problem}</p></div>
                                        </div>
                                        <div className="flex justify-center">
                                            <button onClick={() => setWizardStep(0)} className="text-slate-400 hover:text-slate-600 underline text-sm hover:scale-105 transition-transform">Edit Mission Details</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {input.mode === 'sleep' && (
                            <motion.div key="sleep" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                
                                <div className="space-y-2">
                                    <label className="font-comic text-indigo-700 text-xl block text-center">Who is going to sleep?</label>
                                    <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="e.g. Leo the Lion" className="w-full border-b-4 border-indigo-200 p-4 text-center text-3xl font-serif text-indigo-900 focus:border-indigo-500 outline-none placeholder-indigo-200 bg-transparent" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'automatic', label: 'Auto Dream', icon: '🤖', desc: 'Let Gemini weave a surprise.' },
                                        { id: 'parent-madlib', label: "Parent's Touch", icon: '👩‍🏫', desc: 'Add familiar comforts.' },
                                        { id: 'child-friendly', label: 'Quick Themes', icon: '🎈', desc: 'Pick a favorite topic.' }
                                    ].map(sub => (
                                        <button 
                                            key={sub.id}
                                            onClick={() => handleSleepConfigChange('subMode', sub.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${input.sleepConfig.subMode === sub.id ? 'bg-indigo-600 text-white border-black shadow-[4px_4px_0px_black] scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            <span className="text-3xl">{sub.icon}</span>
                                            <span className="font-comic text-lg leading-none">{sub.label}</span>
                                            <span className="text-xs opacity-70 font-sans">{sub.desc}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                    {input.sleepConfig.subMode === 'automatic' && (
                                        <div className="text-center">
                                            <p className="text-indigo-400 italic mb-4">Gemini will create a completely original, soothing environment.</p>
                                            <input value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="Optional: Suggest a setting (e.g. Moon Base)" className="w-full border-2 border-indigo-200 p-3 rounded-xl focus:border-indigo-400 outline-none text-center" />
                                        </div>
                                    )}

                                    {input.sleepConfig.subMode === 'parent-madlib' && (
                                        <div className="space-y-4">
                                            <h4 className="font-comic text-indigo-800 text-center uppercase tracking-widest text-sm">Sensory Anchors</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                                    <span className="text-2xl">🧸</span>
                                                    <input value={input.sleepConfig.texture} onChange={e => handleSleepConfigChange('texture', e.target.value)} placeholder="A soft texture (e.g. Fuzzy Blanket)" className="flex-1 outline-none text-indigo-900 placeholder-indigo-300 bg-transparent" />
                                                </div>
                                                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                                    <span className="text-2xl">🎵</span>
                                                    <input value={input.sleepConfig.sound} onChange={e => handleSleepConfigChange('sound', e.target.value)} placeholder="A gentle sound (e.g. Rain on roof)" className="flex-1 outline-none text-indigo-900 placeholder-indigo-300 bg-transparent" />
                                                </div>
                                                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                                    <span className="text-2xl">🍪</span>
                                                    <input value={input.sleepConfig.scent} onChange={e => handleSleepConfigChange('scent', e.target.value)} placeholder="A cozy scent (e.g. Warm Cookies)" className="flex-1 outline-none text-indigo-900 placeholder-indigo-300 bg-transparent" />
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
                                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all group ${input.sleepConfig.theme === theme.name ? `bg-white border-2 border-indigo-500 shadow-md` : 'bg-white/50 border border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                                >
                                                    <span className="text-4xl group-hover:scale-110 transition-transform">{theme.icon}</span>
                                                    <span className="font-comic text-sm text-indigo-900">{theme.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Story Length Selection - Only show in wizard final step or other modes */}
                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <div className="mt-8 pt-8 border-t-2 border-slate-100">
                            <label className="font-comic text-gray-400 mb-4 block uppercase text-xs tracking-widest text-center">Tale Magnitude</label>
                            <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Story Length">
                                {lengths.map((len) => (
                                    <button
                                        key={len.id}
                                        role="radio"
                                        aria-checked={input.storyLength === len.id}
                                        onClick={() => onChange('storyLength', len.id)}
                                        className={`relative p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${input.storyLength === len.id ? `bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)]` : 'border border-transparent hover:bg-slate-50 opacity-60 hover:opacity-100'}`}
                                    >
                                        <span className="text-2xl">{len.icon}</span>
                                        <span className={`font-comic uppercase text-xs ${len.color}`}>{len.label}</span>
                                        <div className="flex gap-0.5 mt-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`w-3 h-1 rounded-full ${i <= len.bars ? (input.storyLength === len.id ? 'bg-black' : 'bg-gray-300') : 'bg-gray-100'}`}></div>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ambient Sound Selection (Sleep Mode Only) */}
                    {input.mode === 'sleep' && (
                        <div className="mt-8 pt-8 border-t-2 border-slate-100">
                            <label className="font-comic text-indigo-400 mb-4 block uppercase text-xs tracking-widest text-center">Dreamscape Audio</label>
                            <div className="flex flex-wrap justify-center gap-3">
                                {ambientOptions.map(ambient => (
                                    <button
                                        key={ambient.id}
                                        onClick={() => { handleSleepConfigChange('ambientTheme', ambient.id); if(ambient.id !== 'auto') soundManager.playAmbient(ambient.id as any); }}
                                        onMouseEnter={() => { if(ambient.id !== 'auto') soundManager.playAmbient(ambient.id as any); }}
                                        onMouseLeave={() => soundManager.stopAmbient()}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${input.sleepConfig.ambientTheme === ambient.id ? `border-indigo-500 bg-indigo-50 text-indigo-700 font-bold shadow-sm` : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span>{ambient.icon}</span>
                                        <span className="text-xs uppercase tracking-tight">{ambient.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voice Selection - Compact */}
                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <div className="mt-8 pt-8 border-t-2 border-slate-100">
                            <label className="font-comic text-gray-400 mb-4 block uppercase text-xs tracking-widest text-center">Narrator Spirit</label>
                            <div className="flex justify-center gap-2 overflow-x-auto pb-2" role="radiogroup" aria-label="Narrator Voice">
                                {voices.map(voice => (
                                    <button
                                        key={voice.id}
                                        role="radio"
                                        aria-checked={input.narratorVoice === voice.id}
                                        onClick={() => onChange('narratorVoice', voice.id)}
                                        className={`flex flex-col items-center flex-shrink-0 w-16 p-2 rounded-xl border-2 transition-all ${input.narratorVoice === voice.id ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105 shadow-sm' : 'border-transparent opacity-50 hover:opacity-100 hover:bg-slate-50'}`}
                                    >
                                        <span className="text-2xl mb-1">{voice.icon}</span>
                                        <span className="text-[9px] font-black uppercase truncate w-full text-center">{voice.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Launch Button */}
                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <motion.button 
                            whileHover={{ scale: isReady && !isLoading && isOnline ? 1.02 : 1 }}
                            whileTap={{ scale: isReady && !isLoading && isOnline ? 0.98 : 1 }}
                            onClick={onLaunch}
                            disabled={!isReady || isLoading || !isOnline}
                            className={`comic-btn w-full mt-auto text-3xl py-6 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:shadow-none transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] ${input.mode === 'sleep' ? 'bg-indigo-700 text-yellow-100 hover:bg-indigo-800' : 'bg-red-600 text-white hover:bg-red-500'}`}
                        >
                            {!isOnline ? 'OFFLINE (Read History)' : (isLoading ? 'CRAFTING TALE...' : (input.mode === 'sleep' ? 'START DREAMING' : (input.sequelContext ? 'CONTINUE ADVENTURE' : 'BEGIN MISSION')))}
                        </motion.button>
                    )}
                </motion.div>

                {/* History Side Panel (Memory Jar) */}
                <aside className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-slate-900 border-[6px] border-black p-6 shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[500px]">
                        <h3 className="font-comic text-2xl text-white mb-8 flex items-center justify-between">
                            <span className="flex items-center gap-3"><span className="text-4xl">🏺</span> Memory Jar</span>
                        </h3>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-16 text-slate-500 italic opacity-50 border-4 border-dashed border-slate-800 rounded-3xl">
                                    Your jar is empty... brew a story to capture a memory!
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ x: 6 }}
                                        className="w-full bg-slate-800 border-4 border-black flex items-center p-0 group relative rounded-2xl overflow-hidden shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] transition-all"
                                    >
                                        <button 
                                            onClick={() => onLoadHistory(item)}
                                            className="flex-1 flex items-center gap-4 p-4 text-left"
                                        >
                                            <div className="w-16 h-16 rounded-full border-4 border-black overflow-hidden bg-slate-700 flex-shrink-0 shadow-inner">
                                                {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-4xl">📘</span>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-comic text-white truncate text-xl leading-none mb-1 uppercase tracking-tight">{item.story.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-blue-400 font-black uppercase opacity-60">
                                                        {new Date(item.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                    {/* Visual indicator for offline availability */}
                                                    <span className="flex items-center gap-1 text-[8px] bg-green-900/40 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                                                        <span className="text-[12px]">💾</span> Local Ready
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Sequel Action */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPrepareSequel(item); }}
                                            className="h-full bg-yellow-500 hover:bg-yellow-400 text-black w-14 flex items-center justify-center border-l-4 border-black opacity-0 group-hover:opacity-100 transition-opacity absolute right-12 top-0 bottom-0 z-10"
                                            title="Create Sequel"
                                        >
                                           <span className="text-xl">⏩</span>
                                        </button>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                                            className="h-full bg-red-600 hover:bg-red-500 text-white w-12 flex items-center justify-center border-l-4 border-black opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0 bottom-0 z-10"
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
