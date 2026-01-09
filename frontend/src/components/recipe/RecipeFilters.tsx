import React from 'react';
import { X } from 'lucide-react';
import { CUISINE_OPTIONS, DIETARY_OPTIONS, MEAL_TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '../constants/recipeOptions';
import '../styles/recipeFilters.css';

interface RecipeFiltersProps {
    filters: {
        cuisine: string;
        dietary: string;
        meal: string;
        difficulty: string;
    };
    onFilterChange: (filterType: string, value: string) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
    filters,
    onFilterChange,
    onApplyFilters,
    onClearFilters
}) => {
    const hasActiveFilters = filters.cuisine || filters.dietary || filters.meal || filters.difficulty;

    const getFilterLabel = (type: string, value: string) => {
        const options = {
            cuisine: CUISINE_OPTIONS,
            dietary: DIETARY_OPTIONS,
            meal: MEAL_TYPE_OPTIONS,
            difficulty: DIFFICULTY_OPTIONS
        }[type];

        return options?.find(opt => opt.value === value)?.label || value;
    };

    return (
        <div className="recipe-filters">
            <h3>Filter Recipes</h3>

            <div className="filters-grid">
                <div className="filter-group">
                    <label htmlFor="filter-cuisine">Cuisine</label>
                    <select
                        id="filter-cuisine"
                        className="filter-select"
                        value={filters.cuisine}
                        onChange={(e) => onFilterChange('cuisine', e.target.value)}
                    >
                        <option value="">All Cuisines</option>
                        {CUISINE_OPTIONS.filter(opt => opt.value).map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-dietary">Dietary Type</label>
                    <select
                        id="filter-dietary"
                        className="filter-select"
                        value={filters.dietary}
                        onChange={(e) => onFilterChange('dietary', e.target.value)}
                    >
                        <option value="">All Types</option>
                        {DIETARY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-meal">Meal Type</label>
                    <select
                        id="filter-meal"
                        className="filter-select"
                        value={filters.meal}
                        onChange={(e) => onFilterChange('meal', e.target.value)}
                    >
                        <option value="">All Meals</option>
                        {MEAL_TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-difficulty">Difficulty</label>
                    <select
                        id="filter-difficulty"
                        className="filter-select"
                        value={filters.difficulty}
                        onChange={(e) => onFilterChange('difficulty', e.target.value)}
                    >
                        <option value="">All Levels</option>
                        {DIFFICULTY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="filter-actions">
                {hasActiveFilters && (
                    <button className="filter-button clear" onClick={onClearFilters}>
                        Clear Filters
                    </button>
                )}
                <button className="filter-button apply" onClick={onApplyFilters}>
                    Apply Filters
                </button>
            </div>

            {hasActiveFilters && (
                <div className="active-filters">
                    {filters.cuisine && (
                        <span className="filter-tag">
                            {getFilterLabel('cuisine', filters.cuisine)}
                            <button onClick={() => onFilterChange('cuisine', '')}>
                                <X size={14} />
                            </button>
                        </span>
                    )}
                    {filters.dietary && (
                        <span className="filter-tag">
                            {getFilterLabel('dietary', filters.dietary)}
                            <button onClick={() => onFilterChange('dietary', '')}>
                                <X size={14} />
                            </button>
                        </span>
                    )}
                    {filters.meal && (
                        <span className="filter-tag">
                            {getFilterLabel('meal', filters.meal)}
                            <button onClick={() => onFilterChange('meal', '')}>
                                <X size={14} />
                            </button>
                        </span>
                    )}
                    {filters.difficulty && (
                        <span className="filter-tag">
                            {getFilterLabel('difficulty', filters.difficulty)}
                            <button onClick={() => onFilterChange('difficulty', '')}>
                                <X size={14} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipeFilters;
