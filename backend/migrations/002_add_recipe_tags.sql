-- Migration: Add recipe tags and categories
-- Run this migration to add new columns to recipes table

-- Add new columns for recipe categorization
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS dietary_type VARCHAR(20) DEFAULT 'vegetarian',
ADD COLUMN IF NOT EXISTS meal_types TEXT[],
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary ON recipes(dietary_type);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

-- Add comments for documentation
COMMENT ON COLUMN recipes.cuisine_type IS 'Cuisine category: italian, chinese, indian, etc.';
COMMENT ON COLUMN recipes.dietary_type IS 'Dietary type: vegan, vegetarian, eggetarian, pescatarian, non_vegetarian';
COMMENT ON COLUMN recipes.meal_types IS 'Array of meal types: breakfast, lunch, dinner, snack, dessert, appetizer';
COMMENT ON COLUMN recipes.difficulty IS 'Recipe difficulty: easy, medium, hard';

