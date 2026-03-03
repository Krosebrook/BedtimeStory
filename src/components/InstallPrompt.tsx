
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../SoundManager';

// Interface for the non-standard Chrome event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent standard mini-infobar
      e.preventDefault();
      
      // Check cooldown (7 days)
      const lastDismissed = localStorage.getItem('pwa_dismissed_ts');
      if (lastDismissed) {
        const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) setIsVisible(false);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    soundManager.playSparkle();
    deferredPrompt.prompt();
    
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    soundManager.playDelete();
    setIsVisible(false);
    // Set cooldown
    localStorage.setItem('pwa_dismissed_ts', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[900] max-w-md w-full"
        >
          <div className="bg-white border-[6px] border-black p-6 rounded-3xl shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
            
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400 rounded-bl-full -mr-10 -mt-10 z-0"></div>
            
            <div className="relative z-10 flex gap-4 items-start">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl border-4 border-black flex items-center justify-center text-3xl shadow-md shrink-0 text-white">
                🚀
              </div>
              
              <div className="flex-1">
                <h3 className="font-comic text-xl uppercase leading-none mb-2 text-black">
                  Install Infinity Heroes
                </h3>
                <p className="font-serif text-sm text-slate-600 leading-snug mb-4">
                  Keep your stories safe and read offline—perfect for bedtime travel!
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleInstall}
                    className="flex-1 comic-btn bg-blue-500 text-white py-2 text-sm font-bold uppercase tracking-wide hover:bg-blue-400"
                  >
                    Install App
                  </button>
                  <button 
                    onClick={handleDismiss}
                    className="px-4 py-2 font-comic text-xs uppercase text-slate-400 hover:text-red-500 transition-colors"
                  >
                    No Thanks
                  </button>
                </div>
              </div>

              <button 
                onClick={handleDismiss}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-black transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
