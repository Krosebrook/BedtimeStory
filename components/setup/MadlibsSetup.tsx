/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { StoryState, MadLibState } from '../../types';
import { HeroAvatarDisplay, MadLibField } from './SetupShared';

interface MadlibsSetupProps {
    input: StoryState;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
    onChange: (field: keyof StoryState, value: any) => void;
    isAvatarLoading: boolean;
    onGenerateAvatar: () => void;
}

export const MadlibsSetup: React.FC<MadlibsSetupProps> = ({ input, handleMadLibChange, onChange, isAvatarLoading, onGenerateAvatar }) => {
    // Calculate progress for feedback
    const totalFields = 5;
    const filledFields = Object.values(input.madlibs).filter(v => v.trim().length > 0).length;
    const isComplete = filledFields === totalFields;

    return (
        <div className="font-serif text-lg md:text-2xl leading-relaxed text-center py-4 md:py-6 max-w-2xl mx-auto animate-in zoom-in duration-500 flex flex-col items-center">
            
            <HeroAvatarDisplay 
                url={input.heroAvatarUrl} 
                isLoading={isAvatarLoading} 
                onGenerate={onGenerateAvatar} 
                mode={input.mode}
            />

            {/* Validation Feedback Badge */}
            <div className={`mb-8 px-6 py-2 rounded-full border-2 transition-all duration-300 flex items-center gap-2 shadow-sm
                ${isComplete 
                    ? 'bg-green-100 border-green-400 text-green-700 scale-105' 
                    : 'bg-yellow-50 border-yellow-300 text-yellow-700'}`}
            >
                <span className="text-xl">{isComplete ? '🎉' : '✍️'}</span>
                <span className="font-comic font-bold uppercase tracking-widest text-sm md:text-base">
                    {isComplete ? 'Chaos Loaded!' : `${totalFields - filledFields} Blanks Left`}
                </span>
            </div>

            <div className="bg-white/40 p-6 md:p-8 rounded-3xl border-4 border-dashed border-black/10 shadow-sm w-full relative group hover:bg-white/60 transition-colors">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-blue-500/10 rounded-[1.7rem] blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <p className="relative z-10 mb-6">
                    Once, a <MadLibField label="Adjective" value={input.madlibs.adjective} onChange={v => handleMadLibChange('adjective', v)} suggestions={["Sparkly", "Grumpy", "Invisible", "Gigantic", "Slimy", "Ancient", "Neon", "Wobbly"]} /> explorer found a 
                    <MadLibField label="Place" value={input.madlibs.place} onChange={v => handleMadLibChange('place', v)} suggestions={["Mars Base", "Cloud City", "Volcano", "Candy Lab", "Treehouse", "Video Game", "Sock Drawer"]} />.
                </p>
                
                <p className="relative z-10 mb-6">
                    They carried a <MadLibField label="Food" value={input.madlibs.food} onChange={v => handleMadLibChange('food', v)} suggestions={["Spaghetti", "Broccoli", "Ice Cream", "Sushi", "Hot Sauce", "Moon Cheese", "Pickles"]} /> when a 
                    <MadLibField label="Animal" value={input.madlibs.animal} onChange={v => handleMadLibChange('animal', v)} suggestions={["Octopus", "T-Rex", "Kitten", "Sloth", "Unicorn", "Rubber Duck", "Blobfish"]} /> yelled...
                </p>
                
                <p className="relative z-10">
                    "<MadLibField label="Silly Word" value={input.madlibs.sillyWord} onChange={v => handleMadLibChange('sillyWord', v)} suggestions={["Bamboozle!", "Flibberflabber!", "Yeet!", "Kerplunk!", "Chimichanga!", "Glitterbomb!", "Zonkers!"]} />!"
                </p>
            </div>
            
        </div>
    );
};