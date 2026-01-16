
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
    const words = text.split(/(\s+)/);
    const totalChars = text.length;

    // Optimization: If narration isn't active for this block, render simple text to save reconciliation cost
    if (!isActive || duration <= 0) {
        return <p className="leading-relaxed font-serif text-gray-800">{text}</p>;
    }

    let charAccumulator = 0;

    return (
        <p className="leading-relaxed font-serif text-gray-800">
            {words.map((word, idx) => {
                const wordLength = word.length;
                // Calculate time window for this specific word based on character count ratio
                const wordStartTime = (charAccumulator / totalChars) * duration;
                const wordEndTime = ((charAccumulator + wordLength) / totalChars) * duration;
                
                charAccumulator += wordLength;

                const isHighlighted = currentTime >= wordStartTime && currentTime < wordEndTime;

                return (
                    <motion.span 
                        key={`${idx}-${word}`} 
                        initial={false}
                        animate={{ 
                            color: isHighlighted ? '#2563eb' : '#1f2937',
                            scale: isHighlighted ? 1.05 : 1,
                            textShadow: isHighlighted ? "0px 0px 8px rgba(37,99,235,0.2)" : "none"
                        }}
                        transition={{ duration: 0.1 }}
                        className={`inline-block whitespace-pre ${isHighlighted ? 'font-bold relative z-10' : ''}`}
                    >
                        {word}
                    </motion.span>
                );
            })}
        </p>
    );
});
