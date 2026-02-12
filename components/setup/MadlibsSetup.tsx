
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { StoryState, MadLibState } from '../../types';
import { HeroAvatarDisplay, MadLibField, LengthSlider } from './SetupShared';

interface MadlibsSetupProps {
    input: StoryState;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
    onChange: (field: keyof StoryState, value: any) => void;
    isAvatarLoading: boolean;
    onGenerateAvatar: () => void;
}

export const MadlibsSetup: React.FC<MadlibsSetupProps> = ({ input, handleMadLibChange, onChange, isAvatarLoading, onGenerateAvatar }) => {
    return (
        <div className="font-serif text-lg md:text-2xl leading-relaxed text-center py-4 md:py-6 max-w-2xl mx-auto animate-in zoom-in duration-500">
            
            <HeroAvatarDisplay 
                url={input.heroAvatarUrl} 
                isLoading={isAvatarLoading} 
                onGenerate={onGenerateAvatar} 
                mode={input.mode}
            />

            <p>Once, a <MadLibField label="Adjective" value={input.madlibs.adjective} onChange={v => handleMadLibChange('adjective', v)} suggestions={["brave", "tiny", "glowing", "invisible"]} /> explorer found a 
            <MadLibField label="Place" value={input.madlibs.place} onChange={v => handleMadLibChange('place', v)} suggestions={["Cave", "Cloud City", "Candy Lab"]} />.
            They carried a <MadLibField label="Food" value={input.madlibs.food} onChange={v => handleMadLibChange('food', v)} suggestions={["Pizza", "Marshmallow", "Taco"]} /> when a 
            <MadLibField label="Animal" value={input.madlibs.animal} onChange={v => handleMadLibChange('animal', v)} suggestions={["Hamster", "Dragon", "Penguin"]} /> yelled 
            <MadLibField label="Silly Word" value={input.madlibs.sillyWord} onChange={v => handleMadLibChange('sillyWord', v)} suggestions={["Bazinga!", "Sploot!", "Zoinks!"]} />!</p>
            
            <div className="mt-12 text-black">
                <label className="font-comic text-xs uppercase text-slate-400 block mb-6 tracking-widest">Chaos Magnitude</label>
                <LengthSlider value={input.storyLength} onChange={(v) => onChange('storyLength', v)} />
            </div>
        </div>
    );
};
