
import React from 'react';
import { DietaryRestriction } from '../types';

interface SidebarProps {
  selected: DietaryRestriction[];
  onChange: (restriction: DietaryRestriction) => void;
  isOpen: boolean;
  onClose: () => void;
}

const restrictions: DietaryRestriction[] = ['Vegetarian', 'Vegan', 'Nut-Free', 'Dairy-Free', 'Low-Sugar'];

const Sidebar: React.FC<SidebarProps> = ({ selected, onChange, isOpen, onClose }) => {
  return (
    <aside className="hidden lg:block w-72 bg-white border-r border-slate-100 p-8">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Kid Filters</h2>
      <div className="space-y-4">
        {restrictions.map((res) => (
          <label key={res} className="flex items-center group cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(res as any)}
              onChange={() => onChange(res as any)}
              className="w-5 h-5 rounded-lg border-slate-200 text-orange-600 focus:ring-orange-500"
            />
            <span className={`ml-3 text-sm font-bold transition-colors ${selected.includes(res as any) ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
              {res}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-50">
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-2">Dad Tip</p>
          <p className="text-xs text-orange-700 font-medium leading-relaxed">
            "Nut-Free" is usually best if you're packing these for school lunches tomorrow.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
