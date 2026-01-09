// Tag selection constants
export const CUISINE_OPTIONS = [
    { value: '', label: 'Select Cuisine (Optional)' },
    { value: 'italian', label: 'Italian' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'indian', label: 'Indian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'thai', label: 'Thai' },
    { value: 'french', label: 'French' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'american', label: 'American' },
    { value: 'korean', label: 'Korean' },
    { value: 'vietnamese', label: 'Vietnamese' },
    { value: 'greek', label: 'Greek' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'middle_eastern', label: 'Middle Eastern' },
    { value: 'caribbean', label: 'Caribbean' },
    { value: 'fusion', label: 'Fusion' },
    { value: 'other', label: 'Other' }
];

export const DIETARY_OPTIONS = [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'eggetarian', label: 'Eggetarian' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'non_vegetarian', label: 'Non-Vegetarian' }
];

export const MEAL_TYPE_OPTIONS = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'appetizer', label: 'Appetizer' }
];

export const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
];

// Keywords for auto-categorization and validation
export const NON_VEG_KEYWORDS = [
    'chicken', 'meat', 'beef', 'pork', 'lamb', 'fish', 'salmon',
    'tuna', 'shrimp', 'prawn', 'bacon', 'ham', 'sausage', 'steak',
    'turkey', 'duck', 'mutton', 'seafood', 'crab', 'lobster'
];

export const EGG_KEYWORDS = [
    'egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'mayo'
];

export const DAIRY_KEYWORDS = [
    'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
    'ghee', 'paneer', 'curd', 'whey', 'lactose', 'dairy',
    'mozzarella', 'cheddar', 'parmesan', 'ricotta', 'feta',
    'sour cream', 'ice cream', 'condensed milk', 'evaporated milk'
];

