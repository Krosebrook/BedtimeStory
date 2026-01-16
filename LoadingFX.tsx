
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

const BEDTIME_WORDS = ["DREAM!", "WISH!", "MAGIC!", "GLOW!", "SHINE!", "SOFT!", "SLEEP!", "STORY!"];

export const LoadingFX: React.FC = () => {
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string}[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const text = BEDTIME_WORDS[Math.floor(Math.random() * BEDTIME_WORDS.length)];
            const x = `${15 + Math.random() * 70}%`;
            const y = `${15 + Math.random() * 70}%`;
            const rot = Math.random() * 40 - 20;
            const colors = ['text-yellow-200', 'text-blue-200', 'text-purple-200', 'text-indigo-200', 'text-white'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            setParticles(prev => [...prev, { id, text, x, y, rot, color }].slice(-5));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
              @keyframes magic-sparkle {
                  0% { transform: translate(-50%, -50%) scale(0.5) rotate(var(--rot)); opacity: 0; filter: blur(5px); }
                  20% { transform: translate(-50%, -50%) scale(1.2) rotate(var(--rot)); opacity: 1; filter: blur(0px); }
                  80% { opacity: 0.8; }
                  100% { transform: translate(-50%, -50%) scale(1.5) rotate(var(--rot)); opacity: 0; filter: blur(10px); }
              }
              .star {
                position: absolute;
                background: white;
                border-radius: 50%;
                opacity: 0.3;
                animation: twinkle var(--duration) infinite ease-in-out;
              }
              @keyframes twinkle {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.2); }
              }
            `}</style>
            
            {/* Twinkling Stars Background */}
            {Array.from({ length: 40 }).map((_, i) => (
                <div 
                    key={i} 
                    className="star" 
                    style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 100}%`, 
                        width: `${Math.random() * 3 + 1}px`, 
                        height: `${Math.random() * 3 + 1}px`,
                        '--duration': `${2 + Math.random() * 4}s`
                    } as React.CSSProperties} 
                />
            ))}

            <div className="relative z-10 text-center flex flex-col items-center">
                <div className="w-32 h-32 mb-8 relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <span className="text-8xl animate-bounce inline-block">📖</span>
                </div>
                
                <h2 className="font-comic text-5xl text-blue-300 mb-4 tracking-widest animate-pulse" style={{textShadow: '0 0 20px rgba(147,197,253,0.5)'}}>
                    Gathering Stardust...
                </h2>
                <p className="font-serif text-xl text-slate-400 italic">
                    Imagining a world of wonders just for you.
                </p>
            </div>

            {particles.map(p => (
                <div key={p.id} 
                     className={`absolute font-comic text-4xl md:text-6xl font-bold ${p.color} select-none whitespace-nowrap z-20 pointer-events-none`}
                     style={{ left: p.x, top: p.y, '--rot': `${p.rot}deg`, animation: 'magic-sparkle 2s forwards ease-out', textShadow: '0 0 15px currentColor' } as React.CSSProperties}>
                    {p.text}
                </div>
            ))}

            <div className="absolute bottom-12 w-64 h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-1/2 animate-[progress_3s_infinite_ease-in-out]"></div>
            </div>
            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
};
