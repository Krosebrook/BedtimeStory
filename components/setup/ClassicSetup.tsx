
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { StoryState } from '../../types';
import { GeminiWizardStep, HeroAvatarDisplay, LengthSlider } from './SetupShared';
import { soundManager } from '../../SoundManager';

interface ClassicSetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    isAvatarLoading: boolean;
    onGenerateAvatar: () => void;
}

export const ClassicSetup: React.FC<ClassicSetupProps> = ({ input, onChange, isAvatarLoading, onGenerateAvatar }) => {
    const [wizardStep, setWizardStep] = useState(0);

    return (
        <div className="h-full flex items-center justify-center">
            {wizardStep === 0 && (
                <GeminiWizardStep prompt="Who is our hero today?" onNext={() => setWizardStep(1)} onBack={() => {}} isFirst={true} isLast={false}>
                    <input 
                        autoFocus 
                        value={input.heroName} 
                        onChange={e => onChange('heroName', e.target.value)} 
                        placeholder="Hero's name..." 
                        className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-blue-500 focus:outline-none bg-transparent" 
                        aria-label="Hero Name" 
                    />
                </GeminiWizardStep>
            )}
            
            {wizardStep === 1 && (
                <GeminiWizardStep prompt="Where does the adventure begin?" onNext={() => setWizardStep(2)} onBack={() => setWizardStep(0)} isFirst={false} isLast={false}>
                    <input 
                        autoFocus 
                        value={input.setting} 
                        onChange={e => onChange('setting', e.target.value)} 
                        placeholder="Place name..." 
                        className="w-full text-center text-3xl md:text-5xl font-comic border-b-4 border-purple-500 focus:outline-none bg-transparent" 
                        aria-label="Story Setting" 
                    />
                </GeminiWizardStep>
            )}
            
            {wizardStep === 2 && (
                <div className="space-y-6 w-full text-center">
                    <h3 className="font-comic text-2xl md:text-3xl uppercase mb-4 text-blue-600">Mission Parameters</h3>
                    
                    <HeroAvatarDisplay 
                        url={input.heroAvatarUrl} 
                        isLoading={isAvatarLoading} 
                        onGenerate={onGenerateAvatar} 
                        mode={input.mode}
                    />

                    <div className="p-4 md:p-6 bg-slate-50 border-4 border-dashed border-slate-300 rounded-2xl">
                        <p className="font-comic text-xl md:text-2xl mb-2">The Hero: <span className="text-blue-600 underline decoration-blue-200">{input.heroName}</span></p>
                        <p className="font-comic text-xl md:text-2xl">The World: <span className="text-purple-600 underline decoration-purple-200">{input.setting}</span></p>
                    </div>
                    
                    <div className="mt-8">
                        <label className="font-comic text-xs uppercase text-slate-400 block mb-4 tracking-widest">Adventure Depth</label>
                        <LengthSlider value={input.storyLength} onChange={(v) => onChange('storyLength', v)} />
                    </div>

                    <button 
                        onClick={() => { setWizardStep(0); soundManager.playChoice(); }} 
                        className="mt-6 text-sm md:text-base text-slate-400 hover:text-blue-500 underline decoration-dotted transition-colors"
                    >
                        Adjust Origin Story
                    </button>
                </div>
            )}
        </div>
    );
};
