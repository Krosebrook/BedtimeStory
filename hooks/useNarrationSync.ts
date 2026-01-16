
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';
import { narrationManager } from '../NarrationManager';

export const useNarrationSync = (isNarrating: boolean) => {
    const [narrationTime, setNarrationTime] = useState(0);
    const [narrationDuration, setNarrationDuration] = useState(0);

    useEffect(() => {
        let rafId: number;
        
        const updateTime = () => {
            if (isNarrating) {
                // Poll the singleton manager for current state
                setNarrationTime(narrationManager.getCurrentTime());
                setNarrationDuration(narrationManager.getDuration());
                rafId = requestAnimationFrame(updateTime);
            }
        };

        if (isNarrating) {
            rafId = requestAnimationFrame(updateTime);
        } else {
            // Reset when narration stops
            setNarrationTime(0);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isNarrating]);

    return { narrationTime, narrationDuration };
};
