
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryState } from './types';
import { HeroHeader } from './HeroHeader';

interface SetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: string) => void;
    onLaunch: () => void;
    onGenerateAvatar: () => void;
    isLoading: boolean;
    isAvatarLoading: boolean;
}

export const Setup: React.FC<SetupProps> = ({ input, onChange, onLaunch, onGenerateAvatar, isLoading, isAvatarLoading }) => {
    const isReady = Object.values(input).every(v => typeof v === 'string' && (v as string).trim().length > 0);
    const canGenerateAvatar = input.heroName.trim().length > 0 && input.heroPower.trim().length > 0;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-start py-20 px-4 overflow-x-hidden custom-scrollbar"
        >
            <HeroHeader />

            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl w-full bg-white border-[6px] border-black shadow-[16px_16px_0px_rgba(30,58,138,0.5)] p-8 md:p-12 relative z-20"
            >
                {/* Avatar Preview Section */}
                <div className="flex flex-col items-center mb-12">
                    <div className="relative group">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-36 h-36 bg-yellow-100 border-[6px] border-black rounded-full flex items-center justify-center overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-50 to-orange-100"
                        >
                            <AnimatePresence mode="wait">
                                {input.heroAvatarUrl ? (
                                    <motion.img 
                                        key="avatar"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        src={input.heroAvatarUrl} 
                                        alt="Hero Avatar" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <motion.span 
                                        key="placeholder"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-6xl"
                                    >
                                        {isAvatarLoading ? '✨' : '👤'}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                        {isAvatarLoading && (
                             <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                                 <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                             </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={onGenerateAvatar}
                        disabled={!canGenerateAvatar || isAvatarLoading || isLoading}
                        className="comic-btn bg-purple-600 text-white px-6 py-2 mt-6 text-sm disabled:bg-gray-400 transform transition-transform active:scale-95"
                    >
                        {isAvatarLoading ? 'CHARTING MULTIVERSE...' : '✨ SPARK AVATAR'}
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="font-comic text-blue-700 text-lg">Hero Name</label>
                            <input value={input.heroName} onChange={e => onChange('heroName', e.target.value)} placeholder="e.g. Captain Cosmic" className="w-full border-4 border-black p-3 text-lg focus:bg-blue-50 focus:ring-4 focus:ring-blue-100 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="font-comic text-red-600 text-lg">Super Power</label>
                            <input value={input.heroPower} onChange={e => onChange('heroPower', e.target.value)} placeholder="e.g. Growing Giant" className="w-full border-4 border-black p-3 text-lg focus:bg-red-50 focus:ring-4 focus:ring-red-100 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="font-comic text-purple-700 text-lg">The Setting</label>
                        <input value={input.setting} onChange={e => onChange('setting', e.target.value)} placeholder="e.g. A library where books talk" className="w-full border-4 border-black p-3 text-lg focus:bg-purple-50 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="font-comic text-green-700 text-lg">Sidekick</label>
                            <input value={input.sidekick} onChange={e => onChange('sidekick', e.target.value)} placeholder="e.g. Pixel the Pet" className="w-full border-4 border-black p-3 text-lg focus:bg-green-50 focus:ring-4 focus:ring-green-100 outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="font-comic text-orange-600 text-lg">The Trouble</label>
                            <input value={input.problem} onChange={e => onChange('problem', e.target.value)} placeholder="e.g. The moon is ticklish" className="w-full border-4 border-black p-3 text-lg focus:bg-orange-50 focus:ring-4 focus:ring-orange-100 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLaunch}
                    disabled={!isReady || isLoading}
                    className="comic-btn w-full mt-12 bg-red-600 text-white text-3xl py-6 hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-widest shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                >
                    {isLoading ? 'OPENING CHRONICLES...' : 'Begin Adventure'}
                </motion.button>
                
                <p className="text-center text-xs text-slate-400 mt-6 font-mono uppercase tracking-widest">Aistudio.Inference.v1</p>
            </motion.div>
        </motion.div>
    );
};
