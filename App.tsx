
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

  // Pick a random quote on each render/refresh
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
        
        // Save preview
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
      inventory: {
        ...prev.inventory,
        [location]: Array.from(new Set([...prev.inventory[location], item]))
      }
    }));
    setManualItem(prev => ({ ...prev, [location]: '' }));
  };

  const removeItem = (location: KitchenLocation, itemToRemove: string) => {
    setState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [location]: prev.inventory[location].filter(item => item !== itemToRemove)
      }
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
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[100]">
        <div className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-rose-500"></div>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome, Dad.</h1>
            <p className="text-slate-500 font-medium">Let's set up your kitchen hero profile. Who are we cooking for today?</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Add Child's Age</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 7, 10, 12, 15].map(age => (
                  <button 
                    key={age}
                    onClick={() => addAge(age)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center text-sm"
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-[100px] bg-slate-50 rounded-2xl p-4 border-2 border-dashed border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Crew:</p>
              <div className="flex flex-wrap gap-2">
                {state.kidAges.map((age, i) => (
                  <div key={i} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <span className="font-bold text-slate-700">{age} yrs</span>
                    <button onClick={() => removeAge(i)} className="text-rose-400 hover:text-rose-600">×</button>
                  </div>
                ))}
                {state.kidAges.length === 0 && (
                  <span className="text-slate-400 text-sm italic">Tap ages above to add your kids...</span>
                )}
              </div>
            </div>
            <button 
              disabled={state.kidAges.length === 0}
              onClick={completeOnboarding}
              className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black text-xl hover:bg-orange-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-orange-100"
            >
              Start Cooking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-100 h-20 md:h-16 flex items-center px-4 lg:px-10 justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black">D</div>
          <div className="hidden sm:flex flex-col leading-none">
            <h1 className="text-xl font-black text-slate-900">DadChef<span className="text-orange-600">AI</span></h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">South African edition</span>
          </div>
        </div>

        {/* Search Bar Implementation */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search recipes or ingredients..." 
              className="w-full pl-11 pr-4 py-2 bg-slate-100 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-orange-200 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl flex-shrink-0">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Kitchen
          </button>
          <button 
            onClick={() => setActiveTab('recipes')}
            disabled={state.recipes.length === 0}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'recipes' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-30`}
          >
            Meals
          </button>
          <button 
            onClick={() => setActiveTab('lunchbox')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'lunchbox' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            🍱 Lunch
          </button>
          <button 
            onClick={() => setActiveTab('shopping')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'shopping' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            List ({state.shoppingList.length})
          </button>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="md:hidden p-4 bg-white border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search recipes..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-2xl text-xs font-bold border-none focus:ring-2 focus:ring-orange-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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

        <main className="flex-1 overflow-y-auto p-4 lg:p-10">
          {activeTab === 'inventory' && (
            <div className="max-w-6xl mx-auto">
              {/* Motivational Quote Header */}
              <div className="mb-10 p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="text-orange-500 font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Chef Dad Motivation</span>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight italic">
                      "{activeQuote}"
                    </h2>
                  </div>
                  <div className="hidden md:block h-12 w-px bg-slate-700/50"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-orange-500 text-xl shadow-inner">
                      🍳
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Keep it up, Chef!</p>
                      <p className="text-slate-400 text-xs font-medium">You're making magic.</p>
                    </div>
                  </div>
                </div>
              </div>

              <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-slate-900 mb-2">Manage Kitchen</h2>
                    <button 
                      onClick={() => setIsInfoOpen(true)}
                      className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all font-serif italic text-lg"
                      title="How to get better results"
                    >
                      i
                    </button>
                  </div>
                  <p className="text-slate-400 font-medium italic">Snap photos or manually list items for Fridge, Pantry, and Freezer.</p>
                </div>
                <button 
                  onClick={() => setIsCheatSheetOpen(true)}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  💡 Dad's Cheat Sheet
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(['fridge', 'pantry', 'freezer'] as KitchenLocation[]).map((loc) => (
                  <div key={loc} className="bg-white rounded-[40px] border-2 border-slate-50 flex flex-col shadow-sm overflow-hidden">
                    {/* Header with Background/Preview */}
                    <div className="relative h-32 bg-slate-900">
                      {state.previews[loc] ? (
                        <img src={state.previews[loc]!} className="w-full h-full object-cover opacity-60" alt={`${loc} preview`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-widest text-xs opacity-20">
                          {loc} image
                        </div>
                      )}
                      <div className="absolute inset-0 p-6 flex items-end justify-between">
                        <h3 className="text-xl font-black text-white capitalize drop-shadow-md">{loc}</h3>
                        {state.inventory[loc].length > 0 && (
                          <button onClick={() => clearInventory(loc)} className="text-[10px] font-black text-white/70 uppercase tracking-widest hover:text-white transition-colors">Reset</button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Ingredient Tags */}
                      <div className="flex-1 min-h-[140px] mb-4">
                        {state.inventory[loc].length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {state.inventory[loc].map((item, i) => (
                              <span key={i} className="group relative px-3 py-1 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-100 flex items-center gap-2">
                                {item}
                                <button onClick={() => removeItem(loc, item)} className="text-slate-300 hover:text-rose-500 transition-colors">×</button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-300 text-xs italic text-center py-10">Scan or add items manually...</p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add item..."
                            className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-orange-100"
                            value={manualItem[loc]}
                            onChange={(e) => setManualItem(prev => ({ ...prev, [loc]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && addManualItem(loc)}
                          />
                          <button 
                            onClick={() => addManualItem(loc)}
                            className="px-4 bg-slate-100 rounded-xl text-slate-400 font-bold text-lg hover:bg-slate-200 transition-colors"
                          >+</button>
                        </div>

                        <label className={`w-full py-4 rounded-2xl flex items-center justify-center font-black text-sm cursor-pointer transition-all shadow-md ${state.analyzingLocation === loc ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {state.analyzingLocation === loc ? 'Analyzing...' : `Scan ${loc}`}
                          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(loc, e)} className="hidden" disabled={state.isAnalyzing} />
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
                  className="px-10 py-5 bg-orange-600 text-white rounded-[32px] font-black text-xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-100 disabled:grayscale disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  Create Master Plan
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <button 
                  onClick={runLunchboxMode}
                  disabled={state.inventory.fridge.length === 0 && state.inventory.pantry.length === 0 && state.inventory.freezer.length === 0}
                  className="px-10 py-5 bg-slate-900 text-white rounded-[32px] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:grayscale disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  🍱 Lunchbox Ideas
                </button>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-black text-slate-900 mb-10">Standard Missions</h2>
              {filterRecipes(state.recipes).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filterRecipes(state.recipes).map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onSelect={(r) => setState(prev => ({ ...prev, activeRecipe: r }))} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 italic font-medium">No meals found matching your search.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lunchbox' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 mb-2">🍱 Lunchbox Mode</h2>
                  <p className="text-slate-400 font-medium italic">"Nut-free, packable, and picky-eater approved."</p>
                </div>
                {state.lunchboxIdeas.length === 0 && !state.isAnalyzing && (
                  <button 
                    onClick={runLunchboxMode}
                    className="px-8 py-4 bg-orange-600 text-white rounded-3xl font-black transition-all hover:bg-orange-700 shadow-xl"
                  >
                    Generate Lunch Ideas
                  </button>
                )}
              </div>

              {state.isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">Packing the box...</h3>
                </div>
              )}

              {state.lunchboxIdeas.length > 0 && !state.isAnalyzing && (
                <>
                  {filterRecipes(state.lunchboxIdeas).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                      {filterRecipes(state.lunchboxIdeas).map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onSelect={(r) => setState(prev => ({ ...prev, activeRecipe: r }))} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 italic font-medium">No lunch ideas found matching your search.</p>
                    </div>
                  )}
                </>
              )}

              {state.lunchboxIdeas.length === 0 && !state.isAnalyzing && (
                <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 text-3xl">🍱</div>
                   <h3 className="text-xl font-bold text-slate-800">No Lunch Ideas Yet</h3>
                   <p className="text-slate-400 max-w-sm mx-auto mt-2">Scan your kitchen first, then hit 'Lunchbox Ideas' to generate safe-for-school meals.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shopping' && (
            <div className="max-w-2xl mx-auto py-10">
              <h2 className="text-3xl font-black text-slate-900 mb-8">Next Grocery Run</h2>
              {state.shoppingList.length > 0 ? (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  {state.shoppingList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                      <span className="text-lg font-bold text-slate-700">{item}</span>
                      <button 
                        onClick={() => setState(p => ({...p, shoppingList: p.shoppingList.filter(s => s !== item)}))}
                        className="text-rose-400 font-black"
                      >Remove</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 italic">No missing items! You're prepared, Dad.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Cheat Sheet Modal */}
      {isCheatSheetOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white pb-4 z-10">
              <h3 className="text-2xl font-black text-slate-900">Dad's Cheat Sheet</h3>
              <button onClick={() => setIsCheatSheetOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-6 rounded-3xl">
                <h4 className="text-orange-800 font-black uppercase text-xs mb-3 tracking-widest">Global Lunchboxes</h4>
                <ul className="text-sm text-orange-900/70 space-y-2 font-medium">
                  <li>• Indian Veggie Parathas</li>
                  <li>• Australian Pizza Scrolls</li>
                  <li>• South African Droëwors Boxes</li>
                  <li>• UK Apple "Doughnuts"</li>
                  <li>• USA Bento Snack Packs</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl">
                <h4 className="text-slate-800 font-black uppercase text-xs mb-3 tracking-widest">Budget Wins (SA Style)</h4>
                <ul className="text-sm text-slate-700 space-y-2 font-medium">
                  <li>• Frikkadels (Beef Meatballs)</li>
                  <li>• Savoury Potato Waffles</li>
                  <li>• Cape Malay Chicken Curry</li>
                  <li>• Hidden-Veggie Nuggets</li>
                  <li>• Hummus & Veggie Wraps</li>
                </ul>
              </div>

              <div className="bg-rose-50 p-6 rounded-3xl md:col-span-2">
                <h4 className="text-rose-800 font-black uppercase text-xs mb-3 tracking-widest">Pro Dad-Hacks</h4>
                <p className="text-sm text-rose-900/70 leading-relaxed font-medium">
                  "Always double the batch of frikkadels or parathas. They freeze perfectly and work for lunchboxes the next day. Also, use frozen veggies for 'hidden-veggie' sauces—it's cheaper and already chopped!"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">How to Win</h3>
              <button onClick={() => setIsInfoOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-black text-slate-800 mb-1 uppercase tracking-widest text-xs">Better Accuracy</h4>
                  <p className="text-sm text-slate-500">Scan results are more accurate if the lighting is bright and labels are visible.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-black text-slate-800 mb-1 uppercase tracking-widest text-xs">Manual Edits</h4>
                  <p className="text-sm text-slate-500">Add or remove items manually if the scan misses anything. Accuracy is key to a great plan!</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 font-bold">3</div>
                <div>
                  <h4 className="font-black text-slate-800 mb-1 uppercase tracking-widest text-xs">🍱 Lunchbox Mode</h4>
                  <p className="text-sm text-slate-500">Use this mode to get ideas for school lunchboxes. It prioritizes cold-safe and nut-free combos.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black transition-all hover:bg-slate-800"
            >
              Got it, Coach!
            </button>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {state.activeRecipe && !state.activeRecipe.steps.includes('active') && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 md:p-12 overflow-y-auto">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">{state.activeRecipe.difficulty}</span>
                    <h2 className="text-3xl font-black text-slate-900 mt-2">{state.activeRecipe.title}</h2>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, activeRecipe: null }))} className="text-slate-300 hover:text-slate-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl mb-8">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">You'll Need</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.activeRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-sm font-bold text-slate-600">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${ing.isAvailable ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                          {ing.amount} {ing.name}
                        </div>
                        {!ing.isAvailable && (
                          <button 
                            onClick={() => setState(p => ({...p, shoppingList: Array.from(new Set([...p.shoppingList, ing.name]))}))}
                            className="text-[10px] text-orange-600 hover:underline"
                          >+ Add to list</button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               <button 
                onClick={() => setState(prev => ({ ...prev, activeRecipe: { ...prev.activeRecipe!, steps: [...prev.activeRecipe!.steps, 'active'] } }))}
                className="w-full py-5 bg-orange-600 rounded-[24px] text-white font-black text-xl hover:bg-orange-700 shadow-xl shadow-orange-100 transition-all"
              >
                Start Cooking Now
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
