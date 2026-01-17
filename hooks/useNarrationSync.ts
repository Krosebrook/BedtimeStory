
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useCallback } from 'react';
import { narrationManager } from '../NarrationManager';

/**
 * Custom hook to synchronize the imperative AudioContext state from NarrationManager
 * with React's declarative state.
 * 
 * Uses requestAnimationFrame loop to poll audio time for smooth progress UI updates.
 * 
 * @param isNarrating - Boolean flag to start/stop the polling loop.
 * @returns Object containing current time, duration, and playback rate controls.
 */
export const useNarrationSync = (isNarrating: boolean) => {
    const [narrationTime, setNarrationTime] = useState(0);
    const [narrationDuration, setNarrationDuration] = useState(0);
    const [playbackRate, setPlaybackRateState] = useState(narrationManager.getRate());

    /**
     * Updates both the local React state and the singleton NarrationManager.
     */
    const setPlaybackRate = useCallback((rate: number) => {
        narrationManager.setRate(rate);
        setPlaybackRateState(rate);
    }, []);

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
            // Reset to 0 when narration stops to ensure UI reflects "stopped" state
            setNarrationTime(0);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isNarrating]);

    return { narrationTime, narrationDuration, playbackRate, setPlaybackRate };
};
