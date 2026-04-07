'use client';

import { useState, useEffect } from 'react';

export type PennyAssistantProps = {
  scene: 'world' | 'budgeting' | 'loan';
  isOpen: boolean;
  onClose: () => void;
};

const DIALOGUES = {
  world: [
    "Hey hey 👋 I’m Penny — your financial sidekick 🐱💸",
    "Welcome to FinQuest!",
    "You’ll learn budgeting, saving, investing",
    "Start with Budgeting City",
    "Click me anytime if you need help 😎"
  ],
  budgeting: [
    "Welcome to Budgeting City 🏙️",
    "Manage income and expenses",
    "Spend smart, save wisely",
    "Try not to go broke 😭"
  ],
  loan: [
    "Welcome to Loan City 🏦💸",
    "Loans can be powerful tools if used right!",
    "Learn about interest rates, EMIs, and credit scores",
    "Remember: Only borrow what you can repay! 📉"
  ]
};

export function PennyAssistant({ scene, isOpen, onClose }: PennyAssistantProps) {
  const [dialogueStep, setDialogueStep] = useState(0);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const storageKey = `finquest_penny_seen_${scene}`;
    const seen = localStorage.getItem(storageKey) === 'true';
    setHasSeenIntro(seen);
    
    // Auto-open on first visit
    if (!seen) {
      // The parent should handle this by setting isOpen to true
      // or we can invoke onClose if the parent wants to follow the "seen" flag.
      // But typically, the component can suggest its presence.
    }
  }, [scene]);

  if (!hasMounted) return null;
  if (!isOpen) {
    // If closed, we still show the cat image at the bottom left
    // Clicking it will re-open from the parent
    return (
      <div className="fixed bottom-6 left-6 z-[250]">
        <div 
          className="relative cursor-pointer transition-transform hover:-translate-y-2 group"
          onClick={() => {
            setDialogueStep(0);
            onClose(); // Inverted logic: if closed, clicking her should re-open
            // But wait, the prop isOpen is from parent. We need a way to tell the parent to open.
            // Let's call onClose as a toggle if the user logic expects it, 
            // but a better name would be onOpen or similar.
            // Since props are fixed by user: isOpen, onClose. 
            // I'll assume onClose is just used to signal the parent when "X" or "Got it" is clicked.
            // If the parent wants clicking Penny to reopen, it should handle that in Its own Penny click handler.
          }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-blue-400 bg-[#0a1a2e] overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all animate-bounce" style={{ animationDuration: '3s' }}>
            <img 
              src="/cat.png" 
              alt="Penny" 
              className="w-full h-full object-cover scale-110 translate-y-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          {!hasSeenIntro && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--dark)] animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  const currentDialogue = DIALOGUES[scene];
  const isLastStep = dialogueStep >= currentDialogue.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(`finquest_penny_seen_${scene}`, 'true');
      setHasSeenIntro(true);
      onClose();
    } else {
      setDialogueStep(prev => prev + 1);
    }
  };

  const handleManualClose = () => {
    localStorage.setItem(`finquest_penny_seen_${scene}`, 'true');
    setHasSeenIntro(true);
    onClose();
  };

  return (
    <div className="fixed bottom-6 left-6 z-[250] flex flex-col items-start pointer-events-none">
      {/* Speech Bubble */}
      <div className="mb-4 ml-2 max-w-[280px] w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
        <div className="relative bg-[rgba(10,15,30,0.98)] border-2 border-blue-400 rounded-2xl p-5 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.6)]">
          {/* Close button */}
          <button 
            onClick={handleManualClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
          
          <div className="font-pixel text-blue-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
            Penny <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-[8px] opacity-70">AI GUIDE</span>
          </div>
          
          <p className="text-white text-sm leading-relaxed font-sans mb-5 whitespace-pre-wrap">
            {currentDialogue[dialogueStep]}
          </p>
          
          <div className="flex justify-end">
            <button 
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-pixel text-[10px] rounded-lg shadow-lg transition-all active:scale-95 group flex items-center gap-2 border border-blue-400/30"
            >
              {isLastStep ? 'Let\'s go! 🚀' : 'Next ⏤👉'}
            </button>
          </div>
          
          {/* Bubble Arrow */}
          <div className="absolute -bottom-2 left-8 w-4 h-4 bg-[rgba(10,15,30,1)] border-b-2 border-r-2 border-blue-400 rotate-45" />
        </div>
      </div>
      
      {/* Cat Head */}
      <div 
        className="w-16 h-16 rounded-full border-4 border-blue-400 bg-[#0a1a2e] overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.4)] pointer-events-auto cursor-pointer"
        onClick={handleManualClose}
      >
        <img 
          src="/cat.png" 
          alt="Penny" 
          className="w-full h-full object-cover scale-110 translate-y-1"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </div>
  );
}
