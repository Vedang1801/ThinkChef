import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { Search, X, Menu, ChefHat } from 'lucide-react';
import '../../styles/header.css';

// Props for Header component: optional search, sort, and filter handlers
interface HeaderProps {
  onSearchChange?: (term: string) => void;
  onSortChange?: (sortType: string) => void;
  onFilterChange?: (filterType: string, value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onSortChange, onFilterChange }) => {
  // Auth state and navigation
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  // UI state for menu and search
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Handle user logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Close menu on link click
  const handleLinkClick = () => {
    setShowMenu(false);
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
    setShowSearch(false);
  };

  // Handle sort dropdown change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSortChange) {
      onSortChange(e.target.value);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    if (onFilterChange) {
      onFilterChange('cuisine', '');
      onFilterChange('dietary', '');
      onFilterChange('meal', '');
      onFilterChange('difficulty', '');
    }
    setShowFilters(false);
  };

  return (
    <nav className="navbar">
      {/* Brand/logo section */}
      <div className="nav-brand">
        <Link to="/" className="brand-text">
          <ChefHat size={24} className="chef-icon" />
          Think Chef
        </Link>
      </div>

      {/* Search and sort controls */}
      <div className="nav-search">
        {showSearch ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} className="search-form">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-btn">
                <Search size={16} />
              </button>
            </form>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="search-close-btn"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            className="search-icon-btn"
            onClick={() => setShowSearch(true)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        )}
        {/* Sort and Filter */}
        <select
          onChange={handleSortChange}
          className="sort-dropdown"
          aria-label="Sort recipes"
        >
          <option value="">Sort by</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="top-rated">Top Rated</option>
        </select>

        {/* Filter Button and Dropdown */}
        <div className="filter-container">
          <button
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter recipes"
          >
            Filter
          </button>

          {showFilters && (
            <div className="filter-dropdown-panel">
              <div className="filter-group">
                <label>Cuisine</label>
                <select
                  onChange={(e) => onFilterChange?.('cuisine', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Cuisines</option>
                  <option value="italian">Italian</option>
                  <option value="chinese">Chinese</option>
                  <option value="indian">Indian</option>
                  <option value="mexican">Mexican</option>
                  <option value="japanese">Japanese</option>
                  <option value="thai">Thai</option>
                  <option value="french">French</option>
                  <option value="american">American</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Dietary Type</label>
                <select
                  onChange={(e) => onFilterChange?.('dietary', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Types</option>
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Meal Type</label>
                <select
                  onChange={(e) => onFilterChange?.('meal', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              <button className="clear-filters-btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links (desktop & mobile) */}
      <div className={`nav-links ${showMenu ? 'active' : ''}`}>
        <Link to="/" className="nav-link" onClick={handleLinkClick}>
          Home
        </Link>
        {loggedIn ? (
          <Link to="/recipe-generator" className="nav-link" onClick={handleLinkClick}>
            AI Generator
          </Link>
        ) : (
          <Link to="/login" className="nav-link" onClick={handleLinkClick}>
            AI Generator
          </Link>
        )}
        {loggedIn ? (
          <>
            <Link to="/addrecipes" className="nav-link" onClick={handleLinkClick}>
              Add Recipe
            </Link>
            <Link to="/profile" className="nav-link" onClick={handleLinkClick}>
              Profile
            </Link>
            <button className="nav-link logout-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link login-link" onClick={handleLinkClick}>
            Login
          </Link>
        )}
      </div>

      {/* Mobile menu toggle button */}
      <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
        {showMenu ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  );
};

export default Header;
