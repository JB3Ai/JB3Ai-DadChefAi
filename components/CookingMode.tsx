
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar for navigation */}
      <div className="w-full md:w-1/3 bg-emerald-50 p-8 flex flex-col h-full border-r border-emerald-100">
        <button 
          onClick={onClose}
          className="mb-8 flex items-center text-emerald-700 font-semibold hover:text-emerald-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Exit Cooking Mode
        </button>

        <h2 className="text-3xl font-bold text-emerald-900 mb-2">{recipe.title}</h2>
        <div className="flex gap-4 text-emerald-600 text-sm mb-8">
          <span>{recipe.prepTime}</span>
          <span>•</span>
          <span>{recipe.calories} kcal</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {recipe.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                idx === currentStep 
                ? 'bg-white shadow-lg border-2 border-emerald-500 transform scale-[1.02]' 
                : idx < currentStep 
                  ? 'bg-emerald-100/50 text-emerald-400' 
                  : 'bg-transparent text-emerald-700/60 hover:bg-emerald-100/30'
              }`}
            >
              <div className="flex items-start">
                <span className="font-black text-xl mr-3 opacity-30">{idx + 1}</span>
                <p className="text-sm font-medium line-clamp-2">{step}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main step content */}
      <div className="flex-1 p-8 md:p-20 flex flex-col items-center justify-center bg-white">
        <div className="max-w-2xl w-full">
          <div className="flex items-center justify-between mb-12">
            <span className="text-emerald-500 font-black tracking-widest uppercase text-sm">
              Step {currentStep + 1} of {recipe.steps.length}
            </span>
            <div className="h-1 flex-1 mx-8 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-12">
            {recipe.steps[currentStep]}
          </h1>

          <div className="flex flex-wrap gap-6 items-center">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className={`flex items-center px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg ${
                isSpeaking 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
              }`}
            >
              <svg className={`w-6 h-6 mr-3 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              {isSpeaking ? 'Reading aloud...' : 'Read Aloud'}
            </button>

            <div className="flex gap-3">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="p-4 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                disabled={currentStep === recipe.steps.length - 1}
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="p-4 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
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
