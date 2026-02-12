
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { CachedStory } from '../../lib/StorageManager';
import { soundManager } from '../../SoundManager';

interface MemoryJarProps {
    history: CachedStory[];
    onLoadHistory: (cached: CachedStory) => void;
    onDeleteHistory: (id: string) => void;
}

export const MemoryJar: React.FC<MemoryJarProps> = ({ history, onLoadHistory, onDeleteHistory }) => {
    
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
                        <article key={h.id} className="group relative flex flex-col bg-slate-800 rounded-2xl border-4 border-slate-700 hover:border-blue-500 transition-all focus-within:ring-4 focus-within:ring-blue-500/50 overflow-hidden">
                            <button 
                                onClick={() => { onLoadHistory(h); soundManager.playPageTurn(); }} 
                                className="flex items-center gap-4 text-left outline-none w-full p-3 md:p-4 hover:bg-slate-700/50 transition-colors"
                                aria-label={`Open story ${h.story.title}`}
                            >
                                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border-2 border-black flex-shrink-0 shadow-lg group-hover:rotate-3 transition-transform">
                                    {h.avatar ? <img src={h.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl">📘</span>}
                                </div>
                                <div className="flex flex-col overflow-hidden flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-comic text-sm md:text-base leading-tight uppercase tracking-tight text-blue-300 group-hover:text-blue-200 transition-colors line-clamp-2 text-left">
                                            {h.story.title}
                                        </span>
                                        {/* Offline Indicator */}
                                        <div className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-500/30 px-2 py-1 rounded text-[10px] font-bold text-blue-200 shrink-0" title="Saved to device">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                                            </svg>
                                            <span className="hidden sm:inline tracking-wider">OFFLINE READY</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono uppercase mt-1">{new Date(h.timestamp).toLocaleDateString()}</span>
                                </div>
                            </button>
                            
                            {/* Action Bar */}
                            <div className="flex border-t border-slate-700 bg-slate-900/50">
                                <button 
                                    onClick={(e) => handleDownload(e, h)}
                                    className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border-r border-slate-700"
                                    title="Download JSON"
                                >
                                    <span>💾</span> Save
                                </button>
                                <button 
                                    onClick={(e) => handleShare(e, h)}
                                    className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border-r border-slate-700"
                                    title="Share"
                                >
                                    <span>🔗</span> Share
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteHistory(h.id); soundManager.playDelete(); }} 
                                    className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-red-900/50 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2" 
                                    aria-label={`Delete ${h.story.title}`}
                                >
                                    <span>🗑️</span>
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
};
