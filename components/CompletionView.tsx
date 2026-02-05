
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';
import { StoryFull } from '../types';

interface CompletionViewProps {
    story: StoryFull;
    onReset: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({ story, onReset }) => {
    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white border-[6px] border-black p-8 rounded-sm shadow-[12px_12px_0px_black] text-center"
            >
                <div className="text-6xl mb-4">{story.rewardBadge.emoji}</div>
                <h2 className="font-comic text-4xl text-blue-600 mb-2 uppercase">{story.rewardBadge.title}</h2>
                <p className="font-serif text-lg text-slate-600 mb-6">{story.rewardBadge.description}</p>
                
                <div className="bg-yellow-50 border-2 border-black border-dashed p-4 mb-8 text-left">
                    <p className="font-comic text-sm uppercase text-orange-600 mb-1">New Word Learned:</p>
                    <p className="font-bold text-xl">{story.vocabWord.word}</p>
                    <p className="text-sm italic">{story.vocabWord.definition}</p>
                </div>

                <button 
                    onClick={onReset}
                    className="comic-btn w-full bg-red-600 text-white py-4 text-2xl"
                >
                    BACK TO BASE
                </button>
            </motion.div>
        </div>
    );
};
