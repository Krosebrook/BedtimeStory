
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPreferences, DEFAULT_PREFERENCES } from '../types';
import { VOICES } from './setup/VoiceSelector';
import { soundManager } from '../SoundManager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrefs: UserPreferences;
    onSave: (prefs: UserPreferences) => void;
    onReset: () => void;
}

const CATEGORIES = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'voice', label: 'Voice & Audio', icon: '🗣️' },
    { id: 'accessibility', label: 'Accessibility', icon: '👁️' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentPrefs, onSave, onReset }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [prefs, setPrefs] = useState<UserPreferences>(currentPrefs);
    const [showSuccess, setShowSuccess] = useState(false);

    // Sync state when opening
    useEffect(() => {
        if (isOpen) setPrefs(currentPrefs);
    }, [isOpen, currentPrefs]);

    const handleSave = () => {
        onSave(prefs);
        soundManager.playSparkle();
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 1200);
    };

    const handleReset = () => {
        setPrefs(DEFAULT_PREFERENCES);
        soundManager.playDelete(); // reusing delete sound for reset
    };

    const handleChange = (key: keyof UserPreferences, value: any) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
        soundManager.playChoice();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl bg-white rounded-3xl border-[6px] border-black shadow-[16px_16px_0px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <header className="bg-slate-100 border-b-4 border-black p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl border-4 border-black shadow-[2px_2px_0px_black] text-white">
                            🔧
                        </div>
                        <h2 className="font-comic text-2xl md:text-3xl uppercase tracking-wide">Mission Control</h2>
                    </div>
                    <button onClick={onClose} className="text-4xl hover:scale-110 transition-transform leading-none">&times;</button>
                </header>

                <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    {/* Sidebar Tabs */}
                    <aside className="bg-slate-50 md:w-48 border-b-4 md:border-b-0 md:border-r-4 border-black p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveTab(cat.id); soundManager.playChoice(); }}
                                className={`flex items-center gap-3 p-3 rounded-xl font-bold uppercase text-xs md:text-sm tracking-wide transition-all whitespace-nowrap
                                    ${activeTab === cat.id ? 'bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]' : 'hover:bg-slate-200 text-slate-500'}`}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <section>
                                    <h3 className="font-comic text-xl mb-4 border-b-2 border-slate-200 pb-2">Default Mission Length</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['short', 'medium', 'long', 'eternal'].map((len) => (
                                            <button
                                                key={len}
                                                onClick={() => handleChange('storyLength', len)}
                                                className={`p-4 rounded-xl border-4 font-comic uppercase text-sm tracking-widest transition-all
                                                    ${prefs.storyLength === len 
                                                        ? 'bg-yellow-400 border-black shadow-[4px_4px_0px_black]' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                            >
                                                {len}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="font-comic text-xl mb-4 border-b-2 border-slate-200 pb-2">Preferred Dreamscape</h3>
                                    <select 
                                        value={prefs.sleepTheme}
                                        onChange={(e) => handleChange('sleepTheme', e.target.value)}
                                        className="w-full p-4 rounded-xl border-4 border-black bg-white font-serif text-lg focus:outline-none focus:ring-4 ring-blue-200"
                                    >
                                        <option value="Cloud Kingdom">☁️ Cloud Kingdom</option>
                                        <option value="Starry Space">🚀 Starry Space</option>
                                        <option value="Magic Forest">🍄 Magic Forest</option>
                                        <option value="Deep Ocean">🐙 Deep Ocean</option>
                                        <option value="Moonlight Meadow">🌙 Moonlight Meadow</option>
                                    </select>
                                </section>
                            </div>
                        )}

                        {activeTab === 'voice' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <section>
                                    <div className="flex items-center justify-between mb-4 border-b-2 border-slate-200 pb-2">
                                        <h3 className="font-comic text-xl">System Sound</h3>
                                        <button 
                                            onClick={() => handleChange('isMuted', !prefs.isMuted)}
                                            className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 
                                                ${prefs.isMuted ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'}`}
                                        >
                                            {prefs.isMuted ? 'MUTED' : 'ACTIVE'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6">Master switch for music and sound effects.</p>
                                </section>

                                <section>
                                    <h3 className="font-comic text-xl mb-4 border-b-2 border-slate-200 pb-2">Default Narrator</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {VOICES.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => handleChange('narratorVoice', v.id)}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                                    ${prefs.narratorVoice === v.id 
                                                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md scale-105' 
                                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                <span className="text-2xl">{v.icon}</span>
                                                <span className="text-[10px] font-bold uppercase">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'accessibility' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <section>
                                    <h3 className="font-comic text-xl mb-4 border-b-2 border-slate-200 pb-2">Reading Size</h3>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => handleChange('fontSize', 'normal')}
                                            className={`flex-1 p-6 rounded-xl border-4 flex flex-col items-center gap-2 transition-all
                                                ${prefs.fontSize === 'normal' ? 'bg-white border-black shadow-[4px_4px_0px_black]' : 'bg-slate-100 border-slate-300 opacity-50'}`}
                                        >
                                            <span className="text-2xl font-serif">Aa</span>
                                            <span className="text-xs font-bold uppercase">Normal</span>
                                        </button>
                                        <button 
                                            onClick={() => handleChange('fontSize', 'large')}
                                            className={`flex-1 p-6 rounded-xl border-4 flex flex-col items-center gap-2 transition-all
                                                ${prefs.fontSize === 'large' ? 'bg-white border-black shadow-[4px_4px_0px_black]' : 'bg-slate-100 border-slate-300 opacity-50'}`}
                                        >
                                            <span className="text-4xl font-serif">Aa</span>
                                            <span className="text-xs font-bold uppercase">Large</span>
                                        </button>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between p-4 bg-white border-4 border-slate-200 rounded-xl">
                                        <div>
                                            <h4 className="font-bold mb-1">Reduced Motion</h4>
                                            <p className="text-xs text-slate-500">Minimizes intense animations.</p>
                                        </div>
                                        <button 
                                            onClick={() => handleChange('reducedMotion', !prefs.reducedMotion)}
                                            className={`w-14 h-8 rounded-full p-1 transition-colors ${prefs.reducedMotion ? 'bg-blue-500' : 'bg-slate-300'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${prefs.reducedMotion ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </main>
                </div>

                {/* Footer */}
                <footer className="bg-slate-100 border-t-4 border-black p-4 flex justify-between items-center gap-4 relative overflow-hidden">
                    <button 
                        onClick={handleReset}
                        className="text-slate-400 text-xs uppercase font-bold tracking-widest hover:text-red-500 transition-colors"
                    >
                        Reset Defaults
                    </button>
                    
                    <button 
                        onClick={handleSave}
                        className="comic-btn bg-green-500 text-white px-8 py-3 text-lg hover:bg-green-400 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]"
                    >
                        {showSuccess ? 'Saved! ✅' : 'Save As Default'}
                    </button>

                    {/* Success Overlay */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div 
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                className="absolute inset-0 bg-green-500 flex items-center justify-center gap-3 text-white font-comic text-2xl uppercase tracking-widest z-10"
                            >
                                <span>💾</span> Preferences Saved
                            </motion.div>
                        )}
                    </AnimatePresence>
                </footer>
            </motion.div>
        </div>
    );
};
