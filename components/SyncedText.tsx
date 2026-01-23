
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface SyncedTextProps {
    text: string;
    isActive: boolean;
    currentTime: number;
    duration: number;
}

export const SyncedText = memo(({ text, isActive, currentTime, duration }: SyncedTextProps) => {
    // Basic heuristics: 
    // - Split into sentences for broader highlighting
    // - Split into words for precise highlighting
    
    // Split sentences by punctuation, keeping the delimiter
    const sentenceMatches = text.match(/[^.!?]+[.!?]+[\])'"]*|[^.!?]+$/g) || [text];
    
    const totalChars = text.length;

    if (!isActive || duration <= 0) {
        return <p className="leading-relaxed font-serif text-gray-800">{text}</p>;
    }

    let globalCharOffset = 0;

    return (
        <p className="leading-relaxed font-serif text-gray-800">
            {sentenceMatches.map((sentence, sIdx) => {
                const sentenceLength = sentence.length;
                const sentStartTime = (globalCharOffset / totalChars) * duration;
                const sentEndTime = ((globalCharOffset + sentenceLength) / totalChars) * duration;
                
                const isSentenceActive = currentTime >= sentStartTime && currentTime < sentEndTime;
                
                // Words within the sentence
                const words = sentence.split(/(\s+)/);
                let localCharOffset = 0;

                const sentenceElem = (
                    <span 
                        key={sIdx} 
                        className={`transition-colors duration-500 ${isSentenceActive ? 'bg-yellow-100/30 rounded px-1 -mx-1' : ''}`}
                    >
                        {words.map((word, wIdx) => {
                            const wordLength = word.length;
                            const absStartChar = globalCharOffset + localCharOffset;
                            const wordStartTime = (absStartChar / totalChars) * duration;
                            const wordEndTime = ((absStartChar + wordLength) / totalChars) * duration;
                            
                            localCharOffset += wordLength;
                            
                            const isWordActive = currentTime >= wordStartTime && currentTime < wordEndTime;

                            return (
                                <motion.span 
                                    key={`${sIdx}-${wIdx}-${word}`} 
                                    initial={false}
                                    animate={{ 
                                        color: isWordActive ? '#2563eb' : (isSentenceActive ? '#1e3a8a' : '#1f2937'), // Blue vs Dark Blue vs Gray
                                        scale: isWordActive ? 1.05 : 1,
                                        textShadow: isWordActive ? "0px 0px 8px rgba(37,99,235,0.2)" : "none",
                                        opacity: isSentenceActive || !isActive ? 1 : 0.7 // Dim non-active sentences slightly
                                    }}
                                    transition={{ duration: 0.1 }}
                                    className={`inline-block whitespace-pre ${isWordActive ? 'font-bold relative z-10' : ''}`}
                                >
                                    {word}
                                </motion.span>
                            );
                        })}
                    </span>
                );

                globalCharOffset += sentenceLength;
                return sentenceElem;
            })}
        </p>
    );
});
