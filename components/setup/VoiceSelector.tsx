
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppMode, StoryState } from '../../types';
import { soundManager } from '../../SoundManager';

interface VoiceSelectorProps {
    selectedVoice: StoryState['narratorVoice'];
    onVoiceChange: (voice: StoryState['narratorVoice']) => void;
    mode: AppMode;
}

export const VOICES: { id: StoryState['narratorVoice'], icon: string, label: string }[] = [
    { id: 'Kore', icon: '🌸', label: 'Soothing' },
    { id: 'Aoede', icon: '🐦', label: 'Melodic' },
    { id: 'Zephyr', icon: '🍃', label: 'Gentle (Soft)' },
    { id: 'Lira', icon: '✨', label: 'Ethereal (Soft)' },
    { id: 'Puck', icon: '🦊', label: 'Playful' },
    { id: 'Charon', icon: '🐻', label: 'Deep' },
    { id: 'Fenrir', icon: '🐺', label: 'Bold' }
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, mode }) => {
    return (
        <div className={`mt-6 md:mt-10 pt-8 border-t ${mode === 'sleep' ? 'border-white/5' : 'border-slate-100'}`}>
            <label className={`font-comic text-[10px] md:text-xs uppercase block mb-4 text-center tracking-widest ${mode === 'sleep' ? 'text-indigo-400' : 'text-slate-400'}`}>
                Select Narrator Voice
            </label>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4" role="radiogroup" aria-label="Narrator Voices">
                {VOICES.map(v => (
                    <button 
                        key={v.id} 
                        onClick={() => { onVoiceChange(v.id); soundManager.playChoice(); }} 
                        className={`flex flex-col items-center p-3 md:p-4 rounded-3xl border-2 transition-all w-24 md:w-32 
                            ${selectedVoice === v.id ? 
                                (mode === 'sleep' ? 'border-indigo-400 bg-indigo-900/40 text-white shadow-[0_0_20px_rgba(129,140,248,0.2)]' : 'border-black bg-blue-50 text-black shadow-[6px_6px_0px_black] scale-105') : 
                                'border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'}`} 
                        role="radio" 
                        aria-checked={selectedVoice === v.id}
                        title={v.label}
                    >
                        <span className="text-3xl md:text-4xl mb-2">{v.icon}</span>
                        <span className="text-[10px] md:text-xs font-black uppercase text-center leading-none tracking-tight">{v.label}</span>
                        <span className={`text-[8px] md:text-[9px] mt-2 uppercase font-mono tracking-widest ${mode === 'sleep' ? 'text-indigo-500' : 'text-slate-400'}`}>
                            {v.id}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
