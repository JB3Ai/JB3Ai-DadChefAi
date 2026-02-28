
import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
  const missingCount = recipe.ingredients.filter(i => !i.isAvailable).length;

  return (
    <div 
      className="group bg-[#E6E6E6] rounded-3xl overflow-hidden shadow-2xl hover:translate-y-[-4px] transition-all duration-300 border border-white/20 cursor-pointer flex flex-col"
      onClick={() => onSelect(recipe)}
    >
      <div className="relative h-44 overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-95"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-lg bg-[#0A0C10] text-[#66FF66] text-[9px] font-black uppercase tracking-widest border border-[#66FF66]/30">
            {recipe.difficulty}
          </span>
          <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur text-[9px] font-black text-[#0A0C10] tracking-widest uppercase">
            {recipe.prepTime}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-[#0A0C10] leading-tight mb-2 tracking-tight group-hover:text-black">
          {recipe.title}
        </h3>
        
        <div className="bg-white/60 p-3 rounded-xl mb-4 border border-[#0A0C10]/5">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-1">Approved For:</p>
          <p className="text-[11px] text-[#0A0C10] font-bold italic leading-tight">"{recipe.kidFriendlyReason}"</p>
        </div>

        <div className="mt-auto flex justify-between items-center">
          <div className="flex gap-1">
            {recipe.dietaryTags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[8px] font-black text-gray-500 bg-white/40 px-2 py-1 rounded border border-[#0A0C10]/10 uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
          {missingCount > 0 ? (
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200 uppercase tracking-widest">
              +{missingCount} Items
            </span>
          ) : (
            <span className="text-[9px] font-black text-[#66FF66] bg-[#0A0C10] px-2 py-1 rounded uppercase tracking-widest">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
