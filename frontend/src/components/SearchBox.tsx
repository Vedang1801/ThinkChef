    // Start of Selection
    import '../styles/SearchBox.css';
    import React, { useState, useEffect, useRef } from 'react';
    import { Search, X } from 'lucide-react';
    import { debounce } from 'lodash';
    
    interface Recipe {
      recipe_id: number;
      title: string;
      description: string;
    }
    
    interface SearchBoxProps {
      onSearch: (searchTerm: string) => void;
    }
    
    const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [isActive, setIsActive] = useState(false);
      const [suggestions, setSuggestions] = useState<Recipe[]>([]);
      const [showSuggestions, setShowSuggestions] = useState(false);
      const searchContainerRef = useRef<HTMLDivElement>(null);
    
      // Debounce the search to avoid too many API calls
      const debouncedSearch = debounce(async (term: string) => {
        try {
          // Always call onSearch with the current term
          onSearch(term);
          
          if (term.trim()) {
            console.log('Searching for:', term); // Debug log
            
            const response = await fetch(`/api/search/suggestions?term=${encodeURIComponent(term)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
    
            console.log('Search response status:', response.status); // Debug log
    
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
    
            const suggestionsData: Recipe[] = await response.json();
            console.log('Received suggestions:', suggestionsData); // Debug log
            
            setSuggestions(suggestionsData);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    
      const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
      };
    
      const handleSearchToggle = () => {
        setIsActive(!isActive);
        if (!isActive) {
          setTimeout(() => {
            document.getElementById('search-input')?.focus();
          }, 100);
        } else {
          handleClearSearch();
        }
      };
    
      const handleClearSearch = () => {
        setSearchTerm('');
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch('');
        document.getElementById('search-input')?.focus();
      };
    
      const handleSuggestionClick = (suggestion: Recipe) => {
        setSearchTerm(suggestion.title);
        onSearch(suggestion.title); // Make sure to trigger the search
        setShowSuggestions(false);
        setIsActive(false); // Close the search box after selection
      };
    
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            searchContainerRef.current && 
            !searchContainerRef.current.contains(event.target as Node)
          ) {
            setIsActive(false);
            setShowSuggestions(false);
          }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, []);
    
      // Add cleanup for debounced function
      useEffect(() => {
        return () => {
          debouncedSearch.cancel();
        };
      }, []);
    
      return (
        <div className="search-container" ref={searchContainerRef}>
          <div className={`search-wrapper ${isActive ? 'active' : ''}`}>
            <div className="search-input-container">
              <Search 
                size={20} 
                className="search-icon" 
                onClick={handleSearchToggle}
              />
              <input
                id="search-input"
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                onFocus={() => {
                  setIsActive(true);
                  if (searchTerm) setShowSuggestions(true);
                }}
              />
              {searchTerm && (
                <X 
                  size={20} 
                  className="search-clear-icon" 
                  onClick={handleClearSearch}
                />
              )}
            </div>
    
            {showSuggestions && searchTerm && (
              <div className="search-suggestions">
                {suggestions && suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.recipe_id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search size={16} />
                      <div className="suggestion-content">
                        <span className="suggestion-title">{suggestion.title}</span>
                        {suggestion.description && (
                          <span className="suggestion-description">
                            {suggestion.description.length > 60 
                              ? `${suggestion.description.substring(0, 60)}...` 
                              : suggestion.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="suggestion-item no-results">
                    <span>No recipes found</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };
    
    export default SearchBox;