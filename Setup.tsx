
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState, MadLibState, SleepConfig, StoryLength, AmbientTheme, SleepSubMode } from './types';
import { HeroHeader } from './HeroHeader';
import { CachedStory } from './lib/StorageManager';
import { LoadingFX } from './LoadingFX';
import { soundManager } from './SoundManager';

interface SetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
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
                className={`inline-block mx-2 w-full md:w-32 border-b-4 border-dashed border-orange-400 text-center font-bold text-xl px-2 py-1 transition-colors rounded-md focus:ring-4 focus:ring-orange-200 outline-none ${value ? 'text-blue-700 border-blue-400 bg-blue-50' : 'text-gray-400 hover:bg-orange-50'}`}
                aria-label={`Choose a ${label}. Current value is ${value || 'not set'}`}
                aria-haspopup="dialog"
            >
                {value || label}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} role="dialog" aria-modal="true" aria-label={`Select ${label}`}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white border-[6px] border-black p-6 rounded-3xl shadow-2xl w-full max-w-sm" 
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-comic text-2xl text-center mb-6 uppercase">Pick a {label}!</h3>
                            <div className="grid grid-cols-2 gap-3 mb-6" role="listbox">
                                {suggestions.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => { onChange(s); setIsOpen(false); soundManager.playSparkle(); }} 
                                        className="p-3 bg-blue-50 hover:bg-blue-100 border-2 border-black rounded-xl font-comic text-lg transition-transform active:scale-95"
                                        role="option"
                                        aria-selected={value === s}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-gray-500">Or type your own:</label>
                                <input 
                                    autoFocus 
                                    value={value} 
                                    onChange={e => onChange(e.target.value)} 
                                    placeholder="Type here..." 
                                    className="w-full border-4 border-gray-200 rounded-xl p-3 text-xl focus:border-black outline-none" 
                                    onKeyDown={e => e.key === 'Enter' && setIsOpen(false)} 
                                />
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-full mt-4 bg-green-500 text-white font-comic text-xl py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_black]">DONE</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

const GeminiWizardStep: React.FC<{ prompt: string; children: React.ReactNode; onNext: () => void; onBack: () => void; isFirst: boolean; isLast: boolean; }> = ({ prompt, children, onNext, onBack, isFirst, isLast }) => (
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

const LengthSlider = ({ value, onChange }: { value: StoryLength, onChange: (val: StoryLength) => void }) => {
    const steps: StoryLength[] = ['short', 'medium', 'long', 'eternal'];
    const icons = { short: '⚡', medium: '📖', long: '📜', eternal: '♾️' };
    const currentIndex = steps.indexOf(value);

    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center px-2">
                {steps.map((s, i) => (
                    <button 
                        key={s} 
                        onClick={() => { onChange(s); soundManager.playChoice(); }}
                        className={`transition-all duration-300 ${i === currentIndex ? 'scale-125 opacity-100' : 'opacity-40 hover:opacity-70'}`}
                    >
                        <span className="text-2xl md:text-3xl" title={s}>{icons[s]}</span>
                    </button>
                ))}
            </div>
            <div className="relative h-6 flex items-center">
                <div className="absolute inset-x-0 h-2 bg-slate-200 rounded-full border-2 border-slate-300"></div>
                <input 
                    type="range" 
                    min="0" max="3" step="1" 
                    value={currentIndex} 
                    onChange={(e) => onChange(steps[parseInt(e.target.value)])}
                    className="absolute inset-x-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_black]"
                />
            </div>
            <p className="text-center font-comic text-blue-600 uppercase tracking-widest text-sm md:text-lg">
                Current Scope: <span className="underline decoration-blue-200 decoration-4">{value}</span>
            </p>
        </div>
    );
};

export const Setup: React.FC<SetupProps> = ({ 
    input, 
    onChange, 
    handleMadLibChange,
    onLaunch, 
    onGenerateAvatar, 
    isLoading, 
    isAvatarLoading, 
    isOnline, 
    history, 
    onLoadHistory, 
    handleSleepConfigChange, 
    onDeleteHistory, 
    onPrepareSequel 
}) => {
    const [wizardStep, setWizardStep] = useState(0);
    const isReady = input.mode === 'sleep' ? !!input.heroName : (input.mode === 'madlibs' ? Object.values(input.madlibs).every(v => (v as string).length > 0) : (!!input.heroName && !!input.setting));

    const voices: {id: string, icon: string, label: string}[] = [
        { id: 'Kore', icon: '🌸', label: 'Soothing' },
        { id: 'Aoede', icon: '🐦', label: 'Melodic' },
        { id: 'Zephyr', icon: '🍃', label: 'Gentle (Soft)' },
        { id: 'Lira', icon: '✨', label: 'Ethereal (Soft)' },
        { id: 'Puck', icon: '🦊', label: 'Playful' },
        { id: 'Charon', icon: '🐻', label: 'Deep' },
        { id: 'Fenrir', icon: '🐺', label: 'Bold' }
    ];

    const ambientThemes: { id: AmbientTheme, label: string, icon: string }[] = [
        { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
        { id: 'forest', label: 'Forest Night', icon: '🌲' },
        { id: 'ocean', label: 'Midnight Ocean', icon: '🌊' },
        { id: 'crickets', label: 'Night Crickets', icon: '🦗' },
        { id: 'space', label: 'Cosmic Hum', icon: '🛰️' },
        { id: 'magic', label: 'Ethereal Spark', icon: '✨' }
    ];

    const sleepThemes = [
        { id: 'Cloud Kingdom', label: 'Cloud Kingdom', icon: '☁️', color: 'bg-blue-100 border-blue-300 text-blue-900' },
        { id: 'Starry Space', label: 'Starry Space', icon: '🚀', color: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
        { id: 'Magic Forest', label: 'Magic Forest', icon: '🍄', color: 'bg-green-100 border-green-300 text-green-900' },
        { id: 'Deep Ocean', label: 'Deep Ocean', icon: '🐙', color: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
        { id: 'Moonlight Meadow', label: 'Moonlight Meadow', icon: '🌙', color: 'bg-purple-100 border-purple-300 text-purple-900' }
    ];

    useEffect(() => {
        if (input.sleepConfig.ambientTheme !== 'auto' && input.mode === 'sleep') {
            soundManager.playAmbient(input.sleepConfig.ambientTheme);
        } else {
            soundManager.stopAmbient();
        }
        return () => soundManager.stopAmbient();
    }, [input.sleepConfig.ambientTheme, input.mode]);

    return (
        <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center py-6 md:py-10 px-4 md:px-8 overflow-y-auto" role="main">
            <HeroHeader />
            <nav className="flex flex-wrap justify-center gap-2 bg-slate-900 p-2 border-2 border-black mb-6 md:mb-8 rounded-xl shadow-xl z-30" role="radiogroup" aria-label="Choose Story Mode">
                {['classic', 'madlibs', 'sleep'].map(m => (
                    <button 
                        key={m} 
                        onClick={() => { onChange('mode', m); soundManager.playChoice(); }} 
                        className={`px-3 md:px-4 py-2 rounded-lg font-comic transition-all uppercase text-xs md:text-base ${input.mode === m ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} 
                        aria-checked={input.mode === m} 
                        role="radio"
                    >
                        {m === 'sleep' ? '🌙 Sleepy' : m === 'madlibs' ? '🤪 Mad Libs' : '⚔️ Classic'}
                    </button>
                ))}
            </nav>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <motion.section layout className="lg:col-span-2 bg-white border-[6px] border-black shadow-[12px_12px_0px_rgba(30,58,138,0.3)] p-4 md:p-10 relative z-20 rounded-sm flex flex-col min-h-[450px] md:min-h-[500px] overflow-hidden">
                    <AnimatePresence>
                        {isLoading && (
                            <LoadingFX embedded={true} mode={input.mode} />
                        )}
                    </AnimatePresence>
                    
                    <div className="flex-1 w-full overflow-x-hidden">
                        {input.mode === 'classic' && (
                            <div className="h-full flex items-center justify-center">
                                {wizardStep === 0 && <GeminiWizardStep prompt="Who is our hero today?" onNext={() => setWizardStep(1)} onBack={() => {}} isFirst={true} isLast={false}>
                                    <input autoFocus value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="Hero's name..." className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-blue-500 focus:outline-none bg-transparent" aria-label="Hero Name" />
                                </GeminiWizardStep>}
                                {wizardStep === 1 && <GeminiWizardStep prompt="Where does the adventure begin?" onNext={() => setWizardStep(2)} onBack={() => setWizardStep(0)} isFirst={false} isLast={false}>
                                    <input autoFocus value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="Place name..." className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-purple-500 focus:outline-none bg-transparent" aria-label="Story Setting" />
                                </GeminiWizardStep>}
                                {wizardStep === 2 && <div className="space-y-6 w-full text-center">
                                    <h3 className="font-comic text-2xl md:text-3xl uppercase mb-4 text-blue-600">Mission Parameters</h3>
                                    <div className="p-4 md:p-6 bg-slate-50 border-4 border-dashed border-slate-300 rounded-2xl">
                                        <p className="font-comic text-xl md:text-2xl mb-2">The Hero: <span className="text-blue-600 underline decoration-blue-200">{input.heroName}</span></p>
                                        <p className="font-comic text-xl md:text-2xl">The World: <span className="text-purple-600 underline decoration-purple-200">{input.setting}</span></p>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <label className="font-comic text-xs uppercase text-slate-400 block mb-4 tracking-widest">Adventure Depth</label>
                                        <LengthSlider value={input.storyLength} onChange={(v) => onChange('storyLength', v)} />
                                    </div>

                                    <button onClick={() => { setWizardStep(0); soundManager.playChoice(); }} className="mt-6 text-sm md:text-base text-slate-400 hover:text-blue-500 underline decoration-dotted transition-colors">Adjust Origin Story</button>
                                </div>}
                            </div>
                        )}

                        {input.mode === 'sleep' && (
                            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center">
                                    <label className="font-comic text-indigo-700 text-lg md:text-xl block mb-2">Who is drifting off to sleep?</label>
                                    <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="Enter name..." className="w-full border-b-4 border-indigo-200 p-2 md:p-4 text-center text-2xl md:text-4xl font-serif text-indigo-900 focus:border-indigo-500 outline-none bg-transparent placeholder-indigo-100" />
                                </div>

                                {/* Sub-mode Toggle */}
                                <div className="flex justify-center mb-4">
                                    <div className="bg-indigo-50 p-1 rounded-2xl border-2 border-indigo-100 flex gap-1">
                                        {(['child-friendly', 'parent-madlib'] as SleepSubMode[]).map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => handleSleepConfigChange('subMode', s)}
                                                className={`px-4 py-2 rounded-xl text-xs font-comic uppercase tracking-wider transition-all ${input.sleepConfig.subMode === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-400 hover:text-indigo-600'}`}
                                            >
                                                {s === 'child-friendly' ? '👶 Child Friendly' : "🧑‍🎨 Parent's Touch"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {input.sleepConfig.subMode === 'parent-madlib' ? (
                                        <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-200">
                                            <h4 className="font-comic text-xs md:text-sm uppercase text-indigo-500 tracking-widest text-center">Sensory Dream Anchors</h4>
                                            <div className="space-y-4">
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block group-focus-within:text-indigo-600 transition-colors">✨ Texture (Soft as...)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">☁️</span>
                                                        <input value={input.sleepConfig.texture} onChange={e => handleSleepConfigChange('texture', e.target.value)} placeholder="A soft cotton cloud..." className="w-full pl-12 pr-4 py-4 bg-white border-2 border-indigo-50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block group-focus-within:text-indigo-600 transition-colors">🍃 Sound (Quiet as...)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🐚</span>
                                                        <input value={input.sleepConfig.sound} onChange={e => handleSleepConfigChange('sound', e.target.value)} placeholder="Whispering leaves..." className="w-full pl-12 pr-4 py-4 bg-white border-2 border-indigo-50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 mb-1 block group-focus-within:text-indigo-600 transition-colors">🍪 Scent (Sweet as...)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🌷</span>
                                                        <input value={input.sleepConfig.scent} onChange={e => handleSleepConfigChange('scent', e.target.value)} placeholder="Warm vanilla cookies..." className="w-full pl-12 pr-4 py-4 bg-white border-2 border-indigo-50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50/50 rounded-3xl border-2 border-indigo-100 min-h-[300px]">
                                            <span className="text-6xl mb-6">🧸</span>
                                            <h4 className="font-comic text-xl text-indigo-900 mb-2">Magic Journey Awaits</h4>
                                            <p className="text-center text-sm text-indigo-700/60 leading-relaxed italic px-4">
                                                We'll use your favorite theme and soothing sounds to create a quiet, sparkling story for you to fall asleep to.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h4 className="font-comic text-xs md:text-sm uppercase text-indigo-400 tracking-widest border-l-2 border-indigo-400 pl-2">Select Dreamscape</h4>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {sleepThemes.map(t => (
                                                <button 
                                                    key={t.id} 
                                                    onClick={() => { handleSleepConfigChange('theme', t.id); soundManager.playChoice(); }}
                                                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${input.sleepConfig.theme === t.id ? 'border-black shadow-[4px_4px_0px_black] ' + t.color : 'bg-white border-slate-100 text-slate-400 grayscale opacity-60'}`}
                                                >
                                                    <span className="text-3xl">{t.icon}</span>
                                                    <span className="font-comic text-lg uppercase tracking-wider">{t.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-6 border-t border-indigo-50">
                                    <label className="font-comic text-xs uppercase text-indigo-400 block mb-4 tracking-widest text-center">Dream Soundtrack</label>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button 
                                            onClick={() => handleSleepConfigChange('ambientTheme', 'auto')}
                                            className={`px-4 py-2 rounded-xl border-2 font-comic transition-all uppercase text-xs ${input.sleepConfig.ambientTheme === 'auto' ? 'bg-slate-800 text-white border-black shadow-[4px_4px_0px_black]' : 'bg-white border-slate-100 text-slate-300'}`}
                                        >
                                            🔇 Off
                                        </button>
                                        {ambientThemes.map(t => (
                                            <button 
                                                key={t.id} 
                                                onClick={() => { handleSleepConfigChange('ambientTheme', t.id); soundManager.playChoice(); }}
                                                className={`px-4 py-2 rounded-xl border-2 font-comic transition-all flex items-center gap-2 uppercase text-xs ${input.sleepConfig.ambientTheme === t.id ? 'bg-indigo-600 text-white border-black shadow-[4px_4px_0px_black] scale-105' : 'bg-white border-slate-100 text-slate-400'}`}
                                            >
                                                <span>{t.icon}</span> {t.label.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {input.mode === 'madlibs' && (
                            <div className="font-serif text-lg md:text-2xl leading-relaxed text-center py-4 md:py-6 max-w-2xl mx-auto animate-in zoom-in duration-500">
                                <p>Once, a <MadLibField label="Adjective" value={input.madlibs.adjective} onChange={v => handleMadLibChange('adjective', v)} suggestions={["brave", "tiny", "glowing", "invisible"]} /> explorer found a 
                                <MadLibField label="Place" value={input.madlibs.place} onChange={v => handleMadLibChange('place', v)} suggestions={["Cave", "Cloud City", "Candy Lab"]} />.
                                They carried a <MadLibField label="Food" value={input.madlibs.food} onChange={v => handleMadLibChange('food', v)} suggestions={["Pizza", "Marshmallow", "Taco"]} /> when a 
                                <MadLibField label="Animal" value={input.madlibs.animal} onChange={v => handleMadLibChange('animal', v)} suggestions={["Hamster", "Dragon", "Penguin"]} /> yelled 
                                <MadLibField label="Silly Word" value={input.madlibs.sillyWord} onChange={v => handleMadLibChange('sillyWord', v)} suggestions={["Bazinga!", "Sploot!", "Zoinks!"]} />!</p>
                                
                                <div className="mt-12">
                                    <label className="font-comic text-xs uppercase text-slate-400 block mb-6 tracking-widest">Chaos Magnitude</label>
                                    <LengthSlider value={input.storyLength} onChange={(v) => onChange('storyLength', v)} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 md:mt-10 pt-8 border-t border-slate-100">
                        <label className="font-comic text-[10px] md:text-xs uppercase text-slate-400 block mb-4 text-center tracking-widest">Select Narrator Voice</label>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-4" role="radiogroup" aria-label="Narrator Voices">
                            {voices.map(v => (
                                <button 
                                    key={v.id} 
                                    onClick={() => { onChange('narratorVoice', v.id as any); soundManager.playChoice(); }} 
                                    className={`flex flex-col items-center p-3 md:p-4 rounded-3xl border-2 transition-all w-24 md:w-32 ${input.narratorVoice === v.id ? 'border-black bg-blue-50 shadow-[6px_6px_0px_black] scale-105' : 'border-transparent opacity-40 hover:opacity-100 hover:bg-slate-50'}`} 
                                    role="radio" 
                                    aria-checked={input.narratorVoice === v.id}
                                    title={v.label}
                                >
                                    <span className="text-3xl md:text-4xl mb-2">{v.icon}</span>
                                    <span className="text-[10px] md:text-xs font-black uppercase text-center leading-none tracking-tight">{v.label}</span>
                                    <span className="text-[8px] md:text-[9px] text-slate-400 mt-2 uppercase font-mono tracking-widest">{v.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={onLaunch} 
                        disabled={!isReady || isLoading || !isOnline} 
                        className={`comic-btn w-full mt-10 md:mt-12 py-5 md:py-6 text-2xl md:text-4xl rounded-2xl transition-all ${isReady && !isLoading ? 'bg-red-600 text-white shadow-[10px_10px_0px_black] active:translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`} 
                        aria-label="Start Story"
                    >
                        {isLoading ? 'INITIATING CORTEX...' : (input.mode === 'sleep' ? 'BEGIN DREAM-LOG' : 'ENGAGE MISSION')}
                    </button>
                </motion.section>

                <aside className="lg:col-span-1 space-y-4 md:space-y-6">
                    <section className="bg-slate-900 border-[6px] border-black p-4 md:p-8 shadow-[8px_8px_0px_black] text-white rounded-sm h-full flex flex-col min-h-[300px]" aria-labelledby="history-title">
                        <h3 id="history-title" className="font-comic text-xl md:text-2xl mb-6 md:mb-8 flex items-center gap-3">
                            <span className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg">🏺</span>
                            Memory Jar
                        </h3>
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[400px] md:max-h-[500px]">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-4">
                                    <span className="text-5xl">🌫️</span>
                                    <p className="text-center italic text-sm">Your jar is currently empty...</p>
                                </div>
                            ) : (
                                history.map(h => (
                                    <article key={h.id} className="group relative flex items-center bg-slate-800 p-3 md:p-4 rounded-2xl border-4 border-slate-700 hover:border-blue-500 transition-all focus-within:ring-4 focus-within:ring-blue-500/50">
                                        <button 
                                            onClick={() => { onLoadHistory(h); soundManager.playPageTurn(); }} 
                                            className="flex-1 flex items-center gap-4 text-left overflow-hidden outline-none"
                                            aria-label={`Open story ${h.story.title}`}
                                        >
                                            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-black flex-shrink-0 shadow-lg group-hover:rotate-3 transition-transform">
                                                {h.avatar ? <img src={h.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl">📘</span>}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-comic text-sm md:text-base truncate uppercase tracking-tight text-blue-300">{h.story.title}</span>
                                                <span className="text-[10px] text-slate-500 font-mono uppercase">{new Date(h.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => { onDeleteHistory(h.id); soundManager.playDelete(); }} 
                                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-red-500 hover:scale-125 transition-all outline-none" 
                                            aria-label={`Delete ${h.story.title}`}
                                        >🗑️</button>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
};
