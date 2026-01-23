/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
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

// -- Mad Lib Helper Component --
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
        <div className="relative inline-block mx-2">
            <input 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={label} 
                className="w-40 border-b-4 border-orange-400 bg-transparent text-center focus:outline-none italic text-blue-600 font-bold placeholder-orange-300" 
            />
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border-[3px] border-black shadow-[4px_4px_0px_black] z-50 p-2 rounded-xl"
                    >
                        <div className="font-comic text-xs uppercase text-center mb-2 bg-orange-100 p-1 rounded">Pick one or type!</div>
                        <div className="flex flex-col gap-1">
                            {suggestions.map(s => (
                                <button 
                                    key={s}
                                    onClick={() => { onChange(s); setIsOpen(false); }}
                                    className="p-1 hover:bg-orange-200 text-sm font-comic rounded text-left px-3"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// -- Classic Wizard Step Component --
interface WizardStepProps { 
    title: string; 
    subtitle: string; 
    children: React.ReactNode; 
    onNext: () => void; 
    onBack: () => void; 
    isFirst: boolean; 
    isLast: boolean; 
}

const WizardStep: React.FC<WizardStepProps> = ({ 
    title, 
    subtitle, 
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
            className="flex flex-col h-full justify-between"
        >
            <div className="text-center mb-8">
                <h3 className="font-comic text-3xl md:text-4xl text-blue-900 mb-2">{title}</h3>
                <p className="font-serif italic text-slate-500 text-lg">{subtitle}</p>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center gap-6">
                {children}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t-2 border-slate-100">
                {!isFirst ? (
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600 font-comic uppercase tracking-widest flex items-center gap-2">
                        <span>⬅</span> Back
                    </button>
                ) : <div></div>}
                
                <button 
                    onClick={onNext} 
                    className={`comic-btn px-8 py-3 text-xl ${isLast ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
                >
                    {isLast ? 'Review Mission' : 'Next Step ➡'}
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

    const ambientOptions: { id: AmbientTheme; label: string; icon: string }[] = [
        { id: 'auto', label: 'Auto-Detect', icon: '🪄' },
        { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
        { id: 'forest', label: 'Forest Life', icon: '🌲' },
        { id: 'space', label: 'Cosmic Hum', icon: '🌌' },
        { id: 'magic', label: 'Ethereal', icon: '✨' },
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
                    onClick={() => { onChange('mode', 'classic'); setWizardStep(0); }}
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
                    className="lg:col-span-2 bg-white border-[6px] border-black shadow-[16px_16px_0px_rgba(30,58,138,0.5)] p-8 md:p-12 relative z-20 overflow-hidden"
                >
                    {/* engaging loading state overlay */}
                    <AnimatePresence>
                        {isLoading && <LoadingFX embedded={true} />}
                    </AnimatePresence>
                    
                    {/* Sequel Mode Banner */}
                    <AnimatePresence>
                        {input.sequelContext && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-gradient-to-r from-yellow-300 to-amber-400 border-4 border-black p-4 mb-8 flex items-center justify-between"
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

                    {/* Avatar Section - Shown unless in Wizard Steps 1-4 */}
                    {!(input.mode === 'classic' && wizardStep > 0 && wizardStep < 5) && (
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
                                {!isOnline ? 'Offline' : (isAvatarLoading ? 'Generating...' : (input.heroAvatarUrl ? '✨ Regenerate Avatar' : '✨ Spark Avatar'))}
                            </button>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {input.mode === 'madlibs' && (
                            <motion.div key="madlibs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-orange-50/50 p-6 border-4 border-dashed border-orange-200 rounded-xl relative">
                                <h3 className="font-comic text-2xl text-orange-800 mb-6 text-center uppercase tracking-widest">The Secret Prophecy</h3>
                                
                                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black font-bold border-2 border-black p-2 rounded shadow-lg rotate-12 z-10 text-xs">
                                    Tip: Click blanks for ideas!
                                </div>

                                <div className="font-serif text-xl leading-relaxed text-slate-800 space-y-4">
                                    <p>
                                        Once upon a time, a 
                                        <MadLibField 
                                            label="Adjective" 
                                            value={input.madlibs.adjective} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, adjective: v })} 
                                            suggestions={["brave", "glowing", "tiny", "clumsy", "invisible"]} 
                                        /> 
                                        explorer discovered a hidden 
                                        <MadLibField 
                                            label="Place" 
                                            value={input.madlibs.place} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, place: v })} 
                                            suggestions={["Cave", "Cloud City", "Candy Lab", "Treehouse"]} 
                                        />.
                                    </p>
                                    <p>
                                        They were carrying a giant 
                                        <MadLibField 
                                            label="Food" 
                                            value={input.madlibs.food} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, food: v })} 
                                            suggestions={["Pizza", "Marshmallow", "Taco", "Broccoli"]} 
                                        /> 
                                        when suddenly, a 
                                        <MadLibField 
                                            label="Animal" 
                                            value={input.madlibs.animal} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, animal: v })} 
                                            suggestions={["Hamster", "Dragon", "Penguin", "Octopus"]} 
                                        /> 
                                        shouted: 
                                        <MadLibField 
                                            label="Silly Word" 
                                            value={input.madlibs.sillyWord} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, sillyWord: v })} 
                                            suggestions={["Bazinga!", "Sploot!", "Zoinks!", "Banana!"]} 
                                        />!
                                    </p>
                                    <p>
                                        It made everyone feel very 
                                        <MadLibField 
                                            label="Feeling" 
                                            value={input.madlibs.feeling} 
                                            onChange={v => onChange('madlibs', { ...input.madlibs, feeling: v })} 
                                            suggestions={["excited", "wiggly", "bouncy", "sleepy"]} 
                                        /> 
                                        and the magic began...
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        
                        {input.mode === 'classic' && (
                            <div key="classic">
                                {wizardStep === 0 && (
                                    <WizardStep 
                                        title="Welcome, Hero!" 
                                        subtitle="Every great story needs a hero. What is your name?" 
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
                                            className="w-full max-w-md border-b-4 border-blue-500 p-4 text-4xl text-center font-comic focus:outline-none focus:border-blue-700 bg-transparent placeholder-blue-200" 
                                        />
                                    </WizardStep>
                                )}
                                {wizardStep === 1 && (
                                    <WizardStep 
                                        title="Secret Power" 
                                        subtitle={`Amazing to meet you, ${input.heroName || 'Hero'}! What is your special ability?`} 
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
                                            className="w-full max-w-md border-b-4 border-red-500 p-4 text-4xl text-center font-comic focus:outline-none focus:border-red-700 bg-transparent placeholder-red-200" 
                                        />
                                    </WizardStep>
                                )}
                                {wizardStep === 2 && (
                                    <WizardStep 
                                        title="The World" 
                                        subtitle="Where does our adventure begin today?" 
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
                                            className="w-full max-w-md border-b-4 border-purple-500 p-4 text-4xl text-center font-comic focus:outline-none focus:border-purple-700 bg-transparent placeholder-purple-200" 
                                        />
                                    </WizardStep>
                                )}
                                {wizardStep === 3 && (
                                    <WizardStep 
                                        title="Companions" 
                                        subtitle="It's dangerous to go alone! Who is with you?" 
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
                                            className="w-full max-w-md border-b-4 border-green-500 p-4 text-4xl text-center font-comic focus:outline-none focus:border-green-700 bg-transparent placeholder-green-200" 
                                        />
                                    </WizardStep>
                                )}
                                {wizardStep === 4 && (
                                    <WizardStep 
                                        title="The Mission" 
                                        subtitle="Uh oh! What problem do we need to solve?" 
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
                                            className="w-full max-w-md border-b-4 border-orange-500 p-4 text-4xl text-center font-comic focus:outline-none focus:border-orange-700 bg-transparent placeholder-orange-200" 
                                        />
                                    </WizardStep>
                                )}
                                {wizardStep === 5 && (
                                    <div className="space-y-6">
                                        <h3 className="font-comic text-3xl text-center text-blue-900 uppercase tracking-widest">Mission File</h3>
                                        <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><span className="font-bold text-slate-400 uppercase text-xs">Hero</span><p className="text-xl font-comic">{input.heroName}</p></div>
                                            <div><span className="font-bold text-slate-400 uppercase text-xs">Power</span><p className="text-xl font-comic">{input.heroPower}</p></div>
                                            <div><span className="font-bold text-slate-400 uppercase text-xs">World</span><p className="text-xl font-comic">{input.setting}</p></div>
                                            <div><span className="font-bold text-slate-400 uppercase text-xs">Ally</span><p className="text-xl font-comic">{input.sidekick}</p></div>
                                            <div className="md:col-span-2"><span className="font-bold text-slate-400 uppercase text-xs">Mission</span><p className="text-xl font-comic text-red-500">{input.problem}</p></div>
                                        </div>
                                        <div className="flex justify-center">
                                            <button onClick={() => setWizardStep(0)} className="text-slate-400 hover:text-slate-600 underline text-sm">Edit Mission Details</button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                        <div className="space-y-6 bg-indigo-50/80 p-6 border-4 border-indigo-200 rounded-3xl shadow-inner">
                                            <h4 className="font-comic text-indigo-800 text-xl uppercase tracking-widest mb-4 text-center">Guided Sensory Elements</h4>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="relative group">
                                                    <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase text-indigo-500 border border-indigo-200 rounded-full">A Soft Texture</span>
                                                    <input value={input.sleepConfig.texture} onChange={e => handleSleepConfigChange('texture', e.target.value)} placeholder="e.g. Silk Blanket" className="w-full border-4 border-indigo-100 bg-white p-4 pt-5 rounded-2xl focus:border-indigo-500 outline-none text-lg transition-all" />
                                                </div>
                                                <div className="relative group">
                                                    <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase text-indigo-500 border border-indigo-200 rounded-full">A Gentle Sound</span>
                                                    <input value={input.sleepConfig.sound} onChange={e => handleSleepConfigChange('sound', e.target.value)} placeholder="e.g. Soft Hum" className="w-full border-4 border-indigo-100 bg-white p-4 pt-5 rounded-2xl focus:border-indigo-500 outline-none text-lg transition-all" />
                                                </div>
                                                <div className="relative group">
                                                    <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black uppercase text-indigo-500 border border-indigo-200 rounded-full">A Cozy Scent</span>
                                                    <input value={input.sleepConfig.scent} onChange={e => handleSleepConfigChange('scent', e.target.value)} placeholder="e.g. Lavender" className="w-full border-4 border-indigo-100 bg-white p-4 pt-5 rounded-2xl focus:border-indigo-500 outline-none text-lg transition-all" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-indigo-400 italic mt-2 text-center">Add things your child can experience now to ground them in the magic.</p>
                                        </div>
                                    )}

                                    {input.sleepConfig.subMode === 'child-friendly' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {sleepThemes.map(theme => (
                                                <motion.button 
                                                    key={theme.name}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleSleepConfigChange('theme', theme.name)}
                                                    className={`p-6 border-4 rounded-[2rem] flex flex-col items-center gap-3 transition-all ${input.sleepConfig.theme === theme.name ? `border-indigo-600 ${theme.color} shadow-[8px_8px_0px_rgba(49,46,129,0.3)]` : 'border-slate-50 bg-slate-50 opacity-40 hover:opacity-100'}`}
                                                >
                                                    <span className="text-6xl drop-shadow-sm">{theme.icon}</span>
                                                    <span className="font-comic text-indigo-900 text-lg uppercase tracking-tight">{theme.name}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Story Length Selection - Only show in wizard final step or other modes */}
                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <div className="mt-12 pt-8 border-t-4 border-slate-100">
                            <label className="font-comic text-gray-400 mb-6 block uppercase text-sm tracking-widest text-center">Tale Magnitude</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {lengths.map((len) => (
                                    <button
                                        key={len.id}
                                        onClick={() => onChange('storyLength', len.id)}
                                        className={`relative p-6 border-4 rounded-2xl transition-all flex flex-col items-center justify-between gap-4 h-full ${input.storyLength === len.id ? `bg-white scale-105 shadow-[8px_8px_0px_rgba(0,0,0,0.8)] border-black` : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100 hover:border-slate-300'}`}
                                    >
                                        <div className="flex flex-col items-center">
                                             <span className="text-5xl mb-2 filter drop-shadow-sm">{len.icon}</span>
                                             <span className={`font-comic uppercase text-xl tracking-wide ${len.color}`}>{len.label}</span>
                                             <span className="text-xs font-bold text-gray-400 mt-1">{len.time}</span>
                                        </div>
                                        
                                        {/* Visual Bar Indicator */}
                                        <div className="w-full flex gap-1 h-3 mt-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`flex-1 rounded-full ${i <= len.bars ? (input.storyLength === len.id ? 'bg-black' : 'bg-gray-400') : 'bg-gray-200'}`}></div>
                                            ))}
                                        </div>

                                        {input.storyLength === len.id && (
                                            <motion.div layoutId="len-active" className="absolute -top-3 -right-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-black z-10 shadow-md">
                                                ✓
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ambient Sound Selection (Sleep Mode Only) */}
                    {input.mode === 'sleep' && (
                        <div className="mt-12 pt-8 border-t-4 border-slate-100">
                            <label className="font-comic text-indigo-400 mb-6 block uppercase text-sm tracking-widest text-center">Dreamscape Audio</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {ambientOptions.map(ambient => (
                                    <button
                                        key={ambient.id}
                                        onClick={() => handleSleepConfigChange('ambientTheme', ambient.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${input.sleepConfig.ambientTheme === ambient.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-400'}`}
                                    >
                                        <span className="text-2xl">{ambient.icon}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{ambient.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voice Selection */}
                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <div className="mt-12 pt-8 border-t-4 border-slate-100">
                            <label className="font-comic text-gray-400 mb-8 block uppercase text-sm tracking-widest text-center">Narrator Spirit</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {voices.map(voice => (
                                    <button
                                        key={voice.id}
                                        onClick={() => onChange('narratorVoice', voice.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-4 transition-all ${input.narratorVoice === voice.id ? 'border-blue-500 bg-blue-50 text-blue-700 scale-110 shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-300 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-blue-200'}`}
                                    >
                                        <span className="text-5xl">{voice.icon}</span>
                                        <span className="text-[10px] font-black uppercase truncate w-full text-center tracking-tighter">{voice.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {((input.mode === 'classic' && wizardStep === 5) || input.mode !== 'classic') && (
                        <motion.button 
                            whileHover={{ scale: isReady && !isLoading && isOnline ? 1.02 : 1 }}
                            whileTap={{ scale: isReady && !isLoading && isOnline ? 0.98 : 1 }}
                            onClick={onLaunch}
                            disabled={!isReady || isLoading || !isOnline}
                            className={`comic-btn w-full mt-12 text-4xl py-10 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 disabled:shadow-none transition-all shadow-[8px_8px_0px_rgba(0,0,0,1)] ${input.mode === 'sleep' ? 'bg-indigo-700 text-yellow-100 hover:bg-indigo-800' : 'bg-red-600 text-white hover:bg-red-500'}`}
                        >
                            {!isOnline ? 'OFFLINE' : (isLoading ? 'CRAFTING TALE...' : (input.mode === 'sleep' ? 'START DREAMING' : (input.sequelContext ? 'CONTINUE ADVENTURE' : 'BEGIN MISSION')))}
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