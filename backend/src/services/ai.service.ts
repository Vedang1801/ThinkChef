import OpenAI from 'openai';
import logger from '../utils/logger.util';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedRecipe {
    title: string;
    ingredients: string[];
    method: string;
}

/**
 * Generate a recipe using OpenAI based on provided ingredients
 */
export const generateRecipe = async (ingredients: string[]): Promise<GeneratedRecipe> => {
    if (!ingredients || ingredients.length === 0) {
        throw new Error('Please provide at least one ingredient');
    }

    logger.info('Generating recipe for ingredients:', ingredients);

    const prompt = `Create a delicious recipe using these ingredients: ${ingredients.join(', ')}.

Please provide the response in the following JSON format:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "method": "Step-by-step cooking instructions with each step on a new line, numbered like:\\n1. First step here\\n2. Second step here\\n3. Third step here"
}

Make sure the recipe is practical, delicious, and uses the provided ingredients as main components. You can suggest additional common ingredients if needed. Format the method with clear numbered steps separated by newlines.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional chef who creates amazing recipes. Always respond with valid JSON format.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
            throw new Error('No response from OpenAI');
        }

        try {
            // Parse the JSON response
            const recipe = JSON.parse(responseText);

            // Validate the response structure
            if (!recipe.title || !recipe.ingredients || !recipe.method) {
                throw new Error('Invalid recipe structure');
            }

            return recipe;
        } catch (jsonError) {
            logger.error('Error parsing recipe JSON:', jsonError);
            logger.debug('Raw OpenAI response:', responseText);

            // Fallback recipe if JSON parsing fails
            return {
                title: `Recipe with ${ingredients.join(', ')}`,
                ingredients: ingredients.map((ing) => `${ing} - as needed`),
                method: responseText || 'Recipe generation failed. Please try again.',
            };
        }
    } catch (error: any) {
        logger.error('Error generating recipe:', error);
        throw new Error(`Failed to generate recipe: ${error.message}`);
    }
};
