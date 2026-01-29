
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
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col"
      onClick={() => onSelect(recipe)}
    >
      <div className="relative h-44 overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
            {recipe.difficulty}
          </span>
          <span className="px-3 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] font-bold text-gray-800 shadow-sm">
            {recipe.prepTime}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-orange-600 transition-colors">
          {recipe.title}
        </h3>
        
        <div className="bg-orange-50 p-3 rounded-xl mb-4 border border-orange-100">
          <p className="text-[11px] font-bold text-orange-800 uppercase tracking-tighter mb-1">Kid-Approved Because:</p>
          <p className="text-xs text-orange-700 italic">"{recipe.kidFriendlyReason}"</p>
        </div>

        <div className="mt-auto flex justify-between items-center">
          <div className="flex gap-1">
            {recipe.dietaryTags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase">
                {tag}
              </span>
            ))}
          </div>
          {missingCount > 0 && (
            <span className="text-[10px] font-black text-rose-500">
              +{missingCount} items needed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
