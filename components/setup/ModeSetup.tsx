
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { StoryState, MadLibState, SleepConfig } from '../../types';
import { ClassicSetup } from './ClassicSetup';
import { MadlibsSetup } from './MadlibsSetup';
import { SleepSetup } from './SleepSetup';

interface ModeSetupProps {
    input: StoryState;
    onChange: (field: keyof StoryState, value: any) => void;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
    handleSleepConfigChange: (field: keyof SleepConfig, value: string) => void;
    isAvatarLoading: boolean;
    onGenerateAvatar: () => void;
}

export const ModeSetup: React.FC<ModeSetupProps> = ({ 
    input, 
    onChange, 
    handleMadLibChange, 
    handleSleepConfigChange, 
    isAvatarLoading, 
    onGenerateAvatar 
}) => {
    switch (input.mode) {
        case 'classic':
            return (
                <ClassicSetup 
                    input={input} 
                    onChange={onChange} 
                    isAvatarLoading={isAvatarLoading} 
                    onGenerateAvatar={onGenerateAvatar} 
                />
            );
        case 'sleep':
            return (
                <SleepSetup 
                    input={input} 
                    onChange={onChange} 
                    handleSleepConfigChange={handleSleepConfigChange} 
                    isAvatarLoading={isAvatarLoading} 
                    onGenerateAvatar={onGenerateAvatar} 
                />
            );
        case 'madlibs':
            return (
                <MadlibsSetup 
                    input={input} 
                    handleMadLibChange={handleMadLibChange} 
                    onChange={onChange} 
                    isAvatarLoading={isAvatarLoading} 
                    onGenerateAvatar={onGenerateAvatar} 
                />
            );
        default:
            return null;
    }
};
