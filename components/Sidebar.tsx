
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
    <aside className="hidden lg:block w-72 bg-[#121212] border-r border-[#22324A] p-8">
      <h2 className="text-[10px] font-black text-[#66FF66] uppercase tracking-[0.3em] mb-8 opacity-70">Kid Modules</h2>
      <div className="space-y-4">
        {restrictions.map((res) => (
          <label key={res} className="flex items-center group cursor-pointer">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={selected.includes(res as any)}
                onChange={() => onChange(res as any)}
                className="w-5 h-5 rounded bg-[#0A0C10] border-[#22324A] text-[#66FF66] focus:ring-[#66FF66]/30 transition-all checked:bg-[#66FF66]"
              />
            </div>
            <span className={`ml-3 text-xs font-black uppercase tracking-widest transition-colors ${selected.includes(res as any) ? 'text-[#66FF66]' : 'text-gray-500 group-hover:text-gray-300'}`}>
              {res}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-[#22324A]">
        <div className="p-4 bg-[#22324A]/30 rounded-2xl border border-[#22324A]">
          <p className="text-[9px] font-black text-[#66FF66] uppercase tracking-[0.2em] mb-2">Tactical Note</p>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            "Nut-Free" protocol recommended for school-based operations.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
