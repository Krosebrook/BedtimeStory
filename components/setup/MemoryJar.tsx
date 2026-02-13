/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CachedStory } from '../../lib/StorageManager';
import { soundManager } from '../../SoundManager';

interface MemoryJarProps {
    isOpen: boolean;
    onClose: () => void;
    history: CachedStory[];
    onLoadHistory: (cached: CachedStory) => void;
    onDeleteHistory: (id: string) => void;
}

export const MemoryJar: React.FC<MemoryJarProps> = ({ isOpen, onClose, history, onLoadHistory, onDeleteHistory }) => {
    
    const handleDownload = (e: React.MouseEvent, story: CachedStory) => {
        e.stopPropagation();
        soundManager.playChoice();
        try {
            const blob = new Blob([JSON.stringify(story.story, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${story.story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleShare = async (e: React.MouseEvent, story: CachedStory) => {
        e.stopPropagation();
        soundManager.playChoice();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: story.story.title,
                    text: `I just created a story called "${story.story.title}" with Infinity Heroes!`,
                });
            } catch (err) {
                console.log("Share cancelled or failed", err);
            }
        } else {
            // Fallback: Copy title to clipboard
            navigator.clipboard.writeText(`I just created a story called "${story.story.title}" with Infinity Heroes!`)
                .then(() => alert("Story title copied to clipboard!"))
                .catch(() => {});
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 z-[200]"
                        aria-hidden="true"
                    />
                    
                    {/* Drawer */}
                    <motion.aside 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-slate-900 border-l-[6px] border-black shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-[210] flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Memory Jar - Saved Stories"
                    >
                        {/* Header */}
                        <div className="p-6 border-b-4 border-black bg-slate-800 flex items-center justify-between">
                            <h2 className="font-comic text-2xl text-white flex items-center gap-3">
                                <span className="text-3xl">🏺</span>
                                Memory Jar
                            </h2>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors"
                                aria-label="Close Memory Jar"
                            >
                                ✕
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4 text-white">
                                    <span className="text-6xl">🌫️</span>
                                    <p className="text-center italic text-lg">Your jar is currently empty...</p>
                                </div>
                            ) : (
                                history.map(h => (
                                    <article key={h.id} className="group relative flex flex-col bg-slate-800 rounded-2xl border-4 border-slate-700 hover:border-blue-500 transition-all focus-within:ring-4 focus-within:ring-blue-500/50 overflow-hidden shrink-0">
                                        <button 
                                            onClick={() => { onLoadHistory(h); onClose(); soundManager.playPageTurn(); }} 
                                            className="flex items-center gap-4 text-left outline-none w-full p-3 hover:bg-slate-700/50 transition-colors"
                                            aria-label={`Open story ${h.story.title}`}
                                        >
                                            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-black flex-shrink-0 shadow-lg group-hover:rotate-3 transition-transform">
                                                {h.avatar ? <img src={h.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl">📘</span>}
                                            </div>
                                            <div className="flex flex-col overflow-hidden flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="font-comic text-base leading-tight uppercase tracking-tight text-blue-300 group-hover:text-blue-200 transition-colors line-clamp-2 text-left">
                                                        {h.story.title}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-slate-500 font-mono uppercase">{new Date(h.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-600">•</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{h.story.parts.length} Parts</span>
                                                    
                                                    {/* Offline Indicator */}
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20" title="Saved to device">
                                                        <span className="text-[8px] leading-none">📶🚫</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-wider text-green-500/80">Offline Ready</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {/* Action Bar */}
                                        <div className="flex border-t border-slate-700 bg-slate-900/50">
                                            <button 
                                                onClick={(e) => handleDownload(e, h)}
                                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border-r border-slate-700 focus:outline-none focus:bg-white/10"
                                                title="Download JSON"
                                                aria-label="Download"
                                            >
                                                <span>💾</span> Save
                                            </button>
                                            <button 
                                                onClick={(e) => handleShare(e, h)}
                                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border-r border-slate-700 focus:outline-none focus:bg-white/10"
                                                title="Share"
                                                aria-label="Share"
                                            >
                                                <span>🔗</span> Share
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteHistory(h.id); soundManager.playDelete(); }} 
                                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-red-900/50 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:bg-red-900/20" 
                                                aria-label={`Delete ${h.story.title}`}
                                            >
                                                <span>🗑️</span>
                                            </button>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                        
                        {/* Footer Hint */}
                        <div className="p-4 text-center text-[10px] text-slate-500 uppercase tracking-widest border-t border-slate-800">
                            Drift into dreams...
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};