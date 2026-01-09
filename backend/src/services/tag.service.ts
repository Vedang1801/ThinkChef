/**
 * Tag Detection Service
 * Automatically detects dietary type based on ingredients
 */

export class TagDetectionService {
    // Meat & Poultry keywords
    private static readonly meatKeywords = [
        'chicken', 'beef', 'pork', 'lamb', 'mutton', 'goat', 'turkey',
        'duck', 'bacon', 'sausage', 'ham', 'salami', 'pepperoni',
        'prosciutto', 'chorizo', 'meat', 'steak', 'ribs', 'mince',
        'venison', 'rabbit', 'quail'
    ];

    // Seafood keywords
    private static readonly seafoodKeywords = [
        'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'prawn',
        'lobster', 'crab', 'oyster', 'mussel', 'clam', 'squid',
        'octopus', 'anchovy', 'sardine', 'mackerel', 'seafood',
        'halibut', 'trout', 'catfish', 'scallop'
    ];

    // Egg keywords
    private static readonly eggKeywords = [
        'egg', 'eggs', 'mayo', 'mayonnaise', 'meringue'
    ];

    // Dairy keywords
    private static readonly dairyKeywords = [
        'milk', 'cheese', 'butter', 'cream', 'yogurt', 'curd',
        'paneer', 'ghee', 'whey', 'cottage cheese', 'mozzarella',
        'parmesan', 'cheddar', 'ricotta', 'feta', 'brie',
        'gouda', 'swiss cheese', 'blue cheese', 'sour cream'
    ];

    /**
     * Check if any keyword exists in the ingredients
     */
    private static containsAny(text: string, keywords: string[]): boolean {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Detect dietary type based on ingredients
     * Priority: meat > seafood > eggs > dairy > vegan
     */
    public static detectDietaryType(ingredients: Array<{ item: string; quantity: string }>): string {
        // Combine all ingredient items into one string
        const ingredientText = ingredients.map(ing => ing.item).join(' ').toLowerCase();

        // Check in priority order
        if (this.containsAny(ingredientText, this.meatKeywords)) {
            return 'non_vegetarian';
        }

        if (this.containsAny(ingredientText, this.seafoodKeywords)) {
            return 'pescatarian';
        }

        if (this.containsAny(ingredientText, this.eggKeywords)) {
            return 'eggetarian';
        }

        if (this.containsAny(ingredientText, this.dairyKeywords)) {
            return 'vegetarian';
        }

        // Default to vegan if no animal products detected
        return 'vegan';
    }

    /**
     * Validate user-selected dietary type against detected type
     * Returns warning message if mismatch detected
     */
    public static validateDietaryType(
        userSelected: string,
        ingredients: Array<{ item: string; quantity: string }>
    ): { valid: boolean; warning?: string; detected: string } {
        const detected = this.detectDietaryType(ingredients);

        // Define hierarchy: vegan < vegetarian < eggetarian < pescatarian < non_vegetarian
        const hierarchy: { [key: string]: number } = {
            'vegan': 1,
            'vegetarian': 2,
            'eggetarian': 3,
            'pescatarian': 4,
            'non_vegetarian': 5
        };

        const userLevel = hierarchy[userSelected] || 0;
        const detectedLevel = hierarchy[detected] || 0;

        // If user selected a stricter diet than detected, show warning
        if (userLevel < detectedLevel) {
            const warnings: { [key: string]: string } = {
                'vegan': 'Ingredients contain animal products (dairy, eggs, or meat)',
                'vegetarian': 'Ingredients contain eggs, fish, or meat',
                'eggetarian': 'Ingredients contain fish or meat',
                'pescatarian': 'Ingredients contain meat or poultry'
            };

            return {
                valid: false,
                warning: warnings[userSelected] || 'Dietary type may not match ingredients',
                detected
            };
        }

        return { valid: true, detected };
    }

    /**
     * Get list of valid cuisine types
     */
    public static getValidCuisines(): string[] {
        return [
            'italian', 'chinese', 'indian', 'mexican', 'japanese',
            'thai', 'french', 'mediterranean', 'american', 'korean',
            'vietnamese', 'greek', 'spanish', 'middle_eastern',
            'caribbean', 'fusion', 'other'
        ];
    }

    /**
     * Get list of valid meal types
     */
    public static getValidMealTypes(): string[] {
        return ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'];
    }

    /**
     * Get list of valid difficulty levels
     */
    public static getValidDifficulties(): string[] {
        return ['easy', 'medium', 'hard'];
    }
}
