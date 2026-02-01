
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
  isLunchbox?: boolean;
}

export type DietaryRestriction = 'Vegetarian' | 'Vegan' | 'Nut-Free' | 'Dairy-Free' | 'Low-Sugar';

export type KitchenLocation = 'fridge' | 'pantry' | 'freezer';

export interface AppState {
  inventory: {
    fridge: string[];
    pantry: string[];
    freezer: string[];
  };
  previews: {
    fridge: string | null;
    pantry: string | null;
    freezer: string | null;
  };
  recipes: Recipe[];
  lunchboxIdeas: Recipe[];
  shoppingList: string[];
  activeRecipe: Recipe | null;
  selectedRestrictions: DietaryRestriction[];
  isAnalyzing: boolean;
  analyzingLocation: KitchenLocation | null;
  onboarded: boolean;
  kidAges: number[];
}
