
import React, { useState, useMemo } from 'react';
import { AppState, DietaryRestriction, Recipe, KitchenLocation } from './types';
import { analyzeKitchenImage, generateRecipes } from './geminiService';
import Sidebar from './components/Sidebar';
import RecipeCard from './components/RecipeCard';
import CookingMode from './components/CookingMode';

const DAD_QUOTES = [
  "You're the secret ingredient in your kids' lives, Dad!",
  "Hero by day, Chef by night. You've got this.",
  "The best recipes are made with a pinch of patience and a lot of heart.",
  "Picky eaters are just critics in training. Keep up the great work!",
  "A small snack for them, a giant memory for you.",
  "Fueling the next generation, one lunchbox at a time.",
  "The kitchen might be messy, but the memories are golden.",
  "You're not just making a meal; you're making their day."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    inventory: {
      fridge: [],
      pantry: [],
      freezer: [],
    },
    previews: {
      fridge: null,
      pantry: null,
      freezer: null,
    },
    recipes: [],
    lunchboxIdeas: [],
    shoppingList: [],
    activeRecipe: null,
    selectedRestrictions: [],
    isAnalyzing: false,
    analyzingLocation: null,
    onboarded: false,
    kidAges: [],
  });

  const [activeTab, setActiveTab] = useState<'inventory' | 'shopping' | 'recipes' | 'lunchbox'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [manualItem, setManualItem] = useState<{ [key in KitchenLocation]: string }>({
    fridge: '',
    pantry: '',
    freezer: '',
  });

  const activeQuote = useMemo(() => DAD_QUOTES[Math.floor(Math.random() * DAD_QUOTES.length)], []);

  const completeOnboarding = () => {
    if (state.kidAges.length > 0) {
      setState(prev => ({ ...prev, onboarded: true }));
    }
  };

  const addAge = (age: number) => {
    setState(prev => ({ ...prev, kidAges: [...prev.kidAges, age] }));
  };

  const removeAge = (idx: number) => {
    setState(prev => ({ ...prev, kidAges: prev.kidAges.filter((_, i) => i !== idx) }));
  };

  const handleImageUpload = async (location: KitchenLocation, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isAnalyzing: true, analyzingLocation: location }));
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setState(prev => ({
          ...prev,
          previews: { ...prev.previews, [location]: base64 }
        }));
        const newIngredients = await analyzeKitchenImage(base64, location);
        setState(prev => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            [location]: Array.from(new Set([...prev.inventory[location], ...newIngredients]))
          },
          isAnalyzing: false,
          analyzingLocation: null
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setState(prev => ({ ...prev, isAnalyzing: false, analyzingLocation: null }));
    }
  };

  const addManualItem = (location: KitchenLocation) => {
    const item = manualItem[location].trim();
    if (!item) return;
    setState(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [location]: Array.from(new Set([...prev.inventory[location], item])) }
    }));
    setManualItem(prev => ({ ...prev, [location]: '' }));
  };

  const removeItem = (location: KitchenLocation, itemToRemove: string) => {
    setState(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [location]: prev.inventory[location].filter(item => item !== itemToRemove) }
    }));
  };

  const clearInventory = (location: KitchenLocation) => {
    setState(prev => ({
      ...prev,
      inventory: { ...prev.inventory, [location]: [] },
      previews: { ...prev.previews, [location]: null }
    }));
  };

  const runMasterPlan = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    const recipes = await generateRecipes(state.inventory, state.selectedRestrictions, state.kidAges, 'standard');
    setState(prev => ({ ...prev, recipes, isAnalyzing: false }));
    setActiveTab('recipes');
  };

  const runLunchboxMode = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    const ideas = await generateRecipes(state.inventory, state.selectedRestrictions, state.kidAges, 'lunchbox');
    setState(prev => ({ ...prev, lunchboxIdeas: ideas, isAnalyzing: false }));
    setActiveTab('lunchbox');
  };

  const filterRecipes = (recipes: Recipe[]) => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(r => 
      r.title.toLowerCase().includes(query) || 
      r.ingredients.some(ing => ing.name.toLowerCase().includes(query))
    );
  };

  if (!state.onboarded) {
    return (
      <div className="fixed inset-0 bg-[#0A0C10] flex items-center justify-center p-6 z-[100]">
        <div className="bg-[#121212] w-full max-w-lg rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden relative tech-border">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#66FF66]"></div>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Mission Initialized.</h1>
            <p className="text-gray-400 font-medium">Dad, who are we fueling today?</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Add Crew Members (Ages)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 7, 10, 12, 15].map(age => (
                  <button 
                    key={age}
                    onClick={() => addAge(age)}
                    className="w-10 h-10 rounded-xl bg-[#22324A] text-gray-300 font-bold hover:bg-[#66FF66] hover:text-[#0A0C10] transition-all flex items-center justify-center text-sm"
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-[100px] bg-[#0A0C10] rounded-2xl p-4 border border-[#22324A]">
              <p className="text-[10px] font-black text-[#66FF66] uppercase tracking-widest mb-3">Active Unit:</p>
              <div className="flex flex-wrap gap-2">
                {state.kidAges.map((age, i) => (
                  <div key={i} className="px-4 py-2 bg-[#22324A] rounded-xl border border-[#66FF66]/30 flex items-center gap-3">
                    <span className="font-bold text-gray-200">{age} yrs</span>
                    <button onClick={() => removeAge(i)} className="text-rose-500 hover:text-rose-400 font-black">×</button>
                  </div>
                ))}
                {state.kidAges.length === 0 && (
                  <span className="text-gray-600 text-sm italic">Select ages to proceed...</span>
                )}
              </div>
            </div>
            <button 
              disabled={state.kidAges.length === 0}
              onClick={completeOnboarding}
              className="w-full py-5 bg-[#66FF66] text-[#0A0C10] rounded-[24px] font-black text-xl hover:brightness-110 disabled:opacity-30 transition-all glow-green"
            >
              Begin Deployment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-gray-200 flex flex-col">
      <nav className="sticky top-0 z-30 bg-[#121212] border-b border-[#22324A] h-20 md:h-16 flex items-center px-4 lg:px-10 justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#66FF66] rounded-lg flex items-center justify-center text-[#0A0C10] font-black shadow-lg">D</div>
          <div className="hidden sm:flex flex-col leading-none">
            <h1 className="text-xl font-black text-white tracking-tight">DadChef<span className="text-[#66FF66]">AI</span></h1>
            <span className="text-[10px] font-bold text-[#66FF66] uppercase tracking-tighter opacity-70">South African edition</span>
          </div>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Query components..." 
              className="w-full pl-11 pr-4 py-2 bg-[#22324A]/50 rounded-2xl text-xs font-bold border border-[#22324A] focus:border-[#66FF66] focus:ring-1 focus:ring-[#66FF66]/30 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex bg-[#22324A] p-1 rounded-xl flex-shrink-0 border border-[#22324A]">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#66FF66] text-[#0A0C10] shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => setActiveTab('recipes')}
            disabled={state.recipes.length === 0}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'recipes' ? 'bg-[#66FF66] text-[#0A0C10] shadow-lg' : 'text-gray-400 hover:text-white'} disabled:opacity-20`}
          >
            Tactics
          </button>
          <button 
            onClick={() => setActiveTab('lunchbox')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'lunchbox' ? 'bg-[#66FF66] text-[#0A0C10] shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Bento
          </button>
          <button 
            onClick={() => setActiveTab('shopping')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'shopping' ? 'bg-[#66FF66] text-[#0A0C10] shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Supply ({state.shoppingList.length})
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          selected={state.selectedRestrictions} 
          onChange={(r) => {
            setState(prev => ({
              ...prev,
              selectedRestrictions: prev.selectedRestrictions.includes(r as any)
                ? prev.selectedRestrictions.filter(i => i !== r)
                : [...prev.selectedRestrictions, r as any]
            }));
          }} 
          isOpen={false}
          onClose={() => {}}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-navy-gradient">
          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto">
              <div className="mb-10 p-6 md:p-8 bg-[#121212] rounded-[32px] border border-[#22324A] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#66FF66]/5 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="text-[#66FF66] font-black uppercase tracking-[0.2em] text-[10px] mb-2 block opacity-70">Dad.Cmd : Pulse</span>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                      "{activeQuote}"
                    </h2>
                  </div>
                  <div className="hidden md:block h-12 w-px bg-[#22324A]"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#22324A] flex items-center justify-center text-[#66FF66] text-xl border border-[#66FF66]/20 shadow-inner">
                      ⚡
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Status: Optimized</p>
                      <p className="text-gray-500 text-xs font-medium tracking-tight uppercase">Ready for Deployment</p>
                    </div>
                  </div>
                </div>
              </div>

              <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Base Inventory</h2>
                    <button 
                      onClick={() => setIsInfoOpen(true)}
                      className="w-8 h-8 rounded-full border border-[#22324A] flex items-center justify-center text-[#66FF66] hover:bg-[#66FF66] hover:text-[#0A0C10] transition-all font-bold text-sm"
                    >
                      ?
                    </button>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Map your available culinary assets for processing.</p>
                </div>
                <button 
                  onClick={() => setIsCheatSheetOpen(true)}
                  className="px-6 py-3 bg-[#121212] border border-[#22324A] rounded-2xl text-xs font-black uppercase tracking-widest text-[#66FF66] hover:bg-[#22324A] transition-all flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#66FF66] animate-pulse"></span>
                  Tactical Cheat Sheet
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(['fridge', 'pantry', 'freezer'] as KitchenLocation[]).map((loc) => (
                  <div key={loc} className="bg-[#121212] rounded-[40px] border border-[#22324A] flex flex-col shadow-2xl overflow-hidden group hover:border-[#66FF66]/30 transition-colors">
                    <div className="relative h-32 bg-[#0A0C10]">
                      {state.previews[loc] ? (
                        <img src={state.previews[loc]!} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt={`${loc} preview`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#66FF66] font-black uppercase tracking-[0.4em] text-[10px] opacity-10">
                          {loc} scan offline
                        </div>
                      )}
                      <div className="absolute inset-0 p-6 flex items-end justify-between">
                        <h3 className="text-xl font-black text-white capitalize tracking-tight">{loc}</h3>
                        {state.inventory[loc].length > 0 && (
                          <button onClick={() => clearInventory(loc)} className="text-[10px] font-black text-[#66FF66]/60 uppercase tracking-widest hover:text-[#66FF66] transition-colors">Wipe</button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex-1 min-h-[140px] mb-4">
                        {state.inventory[loc].length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {state.inventory[loc].map((item, i) => (
                              <span key={i} className="px-3 py-1 bg-[#22324A] rounded-lg text-[11px] font-bold text-gray-300 border border-[#22324A] flex items-center gap-2">
                                {item}
                                <button onClick={() => removeItem(loc, item)} className="text-gray-500 hover:text-[#66FF66]">×</button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-[10px] uppercase tracking-widest text-center py-10 font-bold opacity-50">Awaiting input...</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add item..."
                            className="flex-1 px-4 py-2 bg-[#0A0C10] rounded-xl text-xs font-bold border border-[#22324A] focus:border-[#66FF66] outline-none text-white"
                            value={manualItem[loc]}
                            onChange={(e) => setManualItem(prev => ({ ...prev, [loc]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addManualItem(loc)}
                          />
                          <button 
                            onClick={() => addManualItem(loc)}
                            className="px-4 bg-[#22324A] rounded-xl text-[#66FF66] font-black text-lg hover:brightness-125 transition-all"
                          >+</button>
                        </div>

                        <label className={`w-full py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer transition-all shadow-md ${state.analyzingLocation === loc ? 'bg-[#22324A] text-gray-500' : 'bg-[#66FF66] text-[#0A0C10] hover:brightness-110 glow-green'}`}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {state.analyzingLocation === loc ? 'Processing Scan...' : `Execute ${loc} Photo/Scan`}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(loc, e)} 
                            className="hidden" 
                            disabled={state.isAnalyzing} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col sm:flex-row justify-center gap-4 pb-20">
                <button 
                  onClick={runMasterPlan}
                  disabled={state.inventory.fridge.length === 0 && state.inventory.pantry.length === 0 && state.inventory.freezer.length === 0}
                  className="px-10 py-5 bg-[#66FF66] text-[#0A0C10] rounded-[32px] font-black text-xl hover:brightness-110 transition-all glow-green-strong disabled:grayscale disabled:opacity-20 flex items-center justify-center gap-4 group uppercase tracking-widest"
                >
                  Synthesize Master Plan
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <button 
                  onClick={runLunchboxMode}
                  disabled={state.inventory.fridge.length === 0 && state.inventory.pantry.length === 0 && state.inventory.freezer.length === 0}
                  className="px-10 py-5 bg-[#121212] text-[#66FF66] border border-[#66FF66]/30 rounded-[32px] font-black text-xl hover:bg-[#22324A] transition-all shadow-2xl disabled:grayscale disabled:opacity-20 flex items-center justify-center gap-4 group uppercase tracking-widest"
                >
                  Bento Protocol
                </button>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-black text-white mb-10 tracking-tight uppercase">Operational Tactics</h2>
              {filterRecipes(state.recipes).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filterRecipes(state.recipes).map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={(r) => setState(prev => ({ ...prev, activeRecipe: r }))} />
                  ))}
                </div>
              ) : (
                <div className="bg-[#121212] rounded-[40px] p-20 text-center border-2 border-dashed border-[#22324A]">
                  <p className="text-gray-500 italic font-medium">Data mismatch. No tactics identified.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lunchbox' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Bento Mode</h2>
                  <p className="text-gray-500 font-medium text-sm">Deployment optimized for external consumption. School safe.</p>
                </div>
                {state.lunchboxIdeas.length === 0 && !state.isAnalyzing && (
                  <button 
                    onClick={runLunchboxMode}
                    className="px-8 py-4 bg-[#66FF66] text-[#0A0C10] rounded-3xl font-black transition-all hover:brightness-110 shadow-xl uppercase tracking-widest glow-green"
                  >
                    Initiate Lunch Protocols
                  </button>
                )}
              </div>

              {state.isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-[#22324A] border-t-[#66FF66] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-lg font-black text-[#66FF66] uppercase tracking-[0.3em] animate-pulse">Assembling Modules...</h3>
                </div>
              )}

              {state.lunchboxIdeas.length > 0 && !state.isAnalyzing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filterRecipes(state.lunchboxIdeas).map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={(r) => setState(prev => ({ ...prev, activeRecipe: r }))} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'shopping' && (
            <div className="max-w-2xl mx-auto py-10">
              <h2 className="text-3xl font-black text-white mb-8 tracking-tight uppercase">Supply Chain Gaps</h2>
              {state.shoppingList.length > 0 ? (
                <div className="bg-[#121212] rounded-3xl p-6 border border-[#22324A]">
                  {state.shoppingList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-[#22324A] last:border-0">
                      <span className="text-lg font-bold text-gray-200">{item}</span>
                      <button 
                        onClick={() => setState(p => ({...p, shoppingList: p.shoppingList.filter(s => s !== item)}))}
                        className="text-[#66FF66] font-black uppercase text-[10px] tracking-widest hover:brightness-125"
                      >Fulfilled</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-20 bg-[#121212] rounded-[40px] border-2 border-dashed border-[#22324A]">
                  <p className="text-gray-600 font-bold uppercase tracking-widest">Supply Lines Fully Stocked.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal Overhaul */}
      {state.activeRecipe && !state.activeRecipe.steps.includes('active') && (
        <div className="fixed inset-0 z-[100] bg-[#0A0C10]/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#22324A]">
            <div className="p-8 md:p-12 overflow-y-auto">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-[#66FF66] uppercase tracking-[0.2em]">{state.activeRecipe.difficulty} Mode</span>
                    <h2 className="text-3xl font-black text-white mt-2 tracking-tight">{state.activeRecipe.title}</h2>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, activeRecipe: null }))} className="text-gray-500 hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <div className="bg-[#22324A]/40 p-6 rounded-3xl mb-8 border border-[#22324A]">
                  <h4 className="text-[10px] font-black text-[#66FF66] uppercase tracking-widest mb-4">Component Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.activeRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-sm font-bold text-gray-300">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${ing.isAvailable ? 'bg-[#66FF66]' : 'bg-gray-700'}`}></div>
                          {ing.amount} {ing.name}
                        </div>
                        {!ing.isAvailable && (
                          <button 
                            onClick={() => setState(p => ({...p, shoppingList: Array.from(new Set([...p.shoppingList, ing.name]))}))}
                            className="text-[10px] text-[#66FF66] hover:underline uppercase tracking-tighter"
                          >+ Log Missing</button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               <button 
                onClick={() => setState(prev => ({ ...prev, activeRecipe: { ...prev.activeRecipe!, steps: [...prev.activeRecipe!.steps, 'active'] } }))}
                className="w-full py-5 bg-[#66FF66] rounded-[24px] text-[#0A0C10] font-black text-xl hover:brightness-110 shadow-xl glow-green transition-all uppercase tracking-widest"
              >
                Execute Cooking Procedure
              </button>
            </div>
          </div>
        </div>
      )}

      {state.activeRecipe && state.activeRecipe.steps.includes('active') && (
        <CookingMode 
          recipe={{...state.activeRecipe, steps: state.activeRecipe.steps.filter(s => s !== 'active')}} 
          onClose={() => setState(prev => ({ ...prev, activeRecipe: null }))}
        />
      )}
    </div>
  );
};

export default App;
