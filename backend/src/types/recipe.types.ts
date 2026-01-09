export interface Recipe {
    recipe_id: number;
    title: string;
    description?: string;
    user_id: string;
    instruction?: string;
    created_at?: Date;
    image?: string;
    is_vegetarian?: boolean;
    cuisine_type?: string;
    dietary_type?: string;
    meal_types?: string[];
    difficulty?: string;
    total_time?: string;
    servings?: string;
    average_rating?: number;
    author?: string;
}

export interface Ingredient {
    ingredient_id?: number;
    recipe_id: number;
    item: string;
    quantity: string;
}

export interface CreateRecipeDTO {
    title: string;
    description?: string;
    user_id: string;
    image?: string;
    instructions: string;
    totalTime?: string;
    servings?: string;
    cuisine_type?: string;
    dietary_type?: string;
    meal_types?: string[];
    difficulty?: string;
    ingredients: Array<{
        item: string;
        quantity: string;
    }>;
}

export interface UpdateRecipeDTO {
    title: string;
    description?: string;
    instruction: string;
    image?: string;
    totalTime?: string;
    servings?: string;
    cuisine_type?: string;
    dietary_type?: string;
    meal_types?: string[];
    difficulty?: string;
    ingredients: Array<{
        item: string;
        quantity: string;
    }>;
}

export interface RecipeListResponse {
    recipes: Recipe[];
    currentPage: number;
    totalPages: number;
    totalRecipes: number;
    limit: number;
}
