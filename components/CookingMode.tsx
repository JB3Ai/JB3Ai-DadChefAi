
import React, { useState } from 'react';
import { Recipe } from '../types';
import { speakStep } from '../geminiService';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    setIsSpeaking(true);
    await speakStep(recipe.steps[currentStep]);
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0C10] flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/3 bg-[#121212] p-8 flex flex-col h-full border-r border-[#22324A]">
        <button 
          onClick={onClose}
          className="mb-8 flex items-center text-[#66FF66] font-black uppercase tracking-widest text-xs hover:brightness-110"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Abort Operation
        </button>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{recipe.title}</h2>
        <div className="flex gap-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
          <span>{recipe.prepTime}</span>
          <span className="text-[#66FF66]">||</span>
          <span>{recipe.calories} KCAL</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {recipe.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border border-[#22324A] ${
                idx === currentStep 
                ? 'bg-[#22324A] border-[#66FF66] shadow-[0_0_15px_rgba(102,255,102,0.1)]' 
                : idx < currentStep 
                  ? 'bg-[#121212] opacity-30 text-gray-500' 
                  : 'bg-transparent text-gray-400 hover:bg-[#22324A]/20'
              }`}
            >
              <div className="flex items-start">
                <span className={`font-black text-lg mr-3 ${idx === currentStep ? 'text-[#66FF66]' : 'text-gray-700'}`}>0{idx + 1}</span>
                <p className="text-sm font-bold leading-tight line-clamp-2">{step}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 md:p-20 flex flex-col items-center justify-center bg-[#0A0C10] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#22324A]">
          <div 
            className="h-full bg-[#66FF66] transition-all duration-500 glow-green"
            style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
          />
        </div>

        <div className="max-w-2xl w-full">
          <div className="flex items-center justify-between mb-12">
            <span className="text-[#66FF66] font-black tracking-[0.4em] uppercase text-[10px] bg-[#22324A] px-4 py-2 rounded-full border border-[#66FF66]/20">
              Tactical Step {currentStep + 1} / {recipe.steps.length}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-12 tracking-tight">
            {recipe.steps[currentStep]}
          </h1>

          <div className="flex flex-wrap gap-6 items-center">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className={`flex items-center px-8 py-5 rounded-[24px] text-lg font-black transition-all shadow-xl uppercase tracking-widest ${
                isSpeaking 
                ? 'bg-[#22324A] text-gray-600' 
                : 'bg-[#66FF66] text-[#0A0C10] hover:brightness-110 glow-green active:scale-95'
              }`}
            >
              <svg className={`w-6 h-6 mr-3 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              {isSpeaking ? 'Processing...' : 'Audio Assist'}
            </button>

            <div className="flex gap-3">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="p-5 rounded-3xl bg-[#121212] border border-[#22324A] text-gray-400 hover:text-[#66FF66] transition-colors disabled:opacity-20"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                disabled={currentStep === recipe.steps.length - 1}
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="p-5 rounded-3xl bg-[#121212] border border-[#22324A] text-gray-400 hover:text-[#66FF66] transition-colors disabled:opacity-20"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
