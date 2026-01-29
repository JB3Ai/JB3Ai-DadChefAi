
export interface Ingredient {
  name: string;
  amount?: string;
  isAvailable: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Quick Win' | 'Staple' | 'Weekend Project';
  prepTime: string;
  calories: number;
  ingredients: Ingredient[];
  steps: string[];
  dietaryTags: string[];
  image: string;
  kidFriendlyReason: string;
  isLunchbox?: boolean; // New flag for lunchbox specific items
}

export type DietaryRestriction = 'Vegetarian' | 'Vegan' | 'Nut-Free' | 'Dairy-Free' | 'Low-Sugar';

export type KitchenLocation = 'fridge' | 'pantry' | 'freezer';

export interface AppState {
  inventory: {
    fridge: string[];
    pantry: string[];
    freezer: string[];
  };
  recipes: Recipe[];
  lunchboxIdeas: Recipe[]; // New state for lunchbox specific generation
  shoppingList: string[];
  activeRecipe: Recipe | null;
  selectedRestrictions: DietaryRestriction[];
  isAnalyzing: boolean;
  analyzingLocation: KitchenLocation | null;
  onboarded: boolean;
  kidAges: number[];
}
