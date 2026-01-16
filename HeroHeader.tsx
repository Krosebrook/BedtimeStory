
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const HeroHeader: React.FC = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 150]);
    const y2 = useTransform(scrollY, [0, 500], [0, -100]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className="relative h-64 flex flex-col items-center justify-center overflow-hidden mb-8">
            <motion.div 
                style={{ y: y1, opacity }}
                className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
            >
                <span className="text-[20rem]">📖</span>
            </motion.div>
            
            <motion.div 
                style={{ y: y2 }}
                className="relative z-10 text-center"
            >
                <h1 className="font-comic text-6xl md:text-8xl text-blue-500 leading-none drop-shadow-[4px_4px_0px_black]">
                    INFINITY
                </h1>
                <h1 className="font-comic text-6xl md:text-8xl text-yellow-400 leading-none drop-shadow-[4px_4px_0px_black] -mt-2">
                    HEROES
                </h1>
                <p className="font-sans font-black uppercase tracking-[0.2em] text-slate-400 mt-4 text-xs">
                    Bedtime Chronicles Production
                </p>
            </motion.div>
        </div>
    );
};
