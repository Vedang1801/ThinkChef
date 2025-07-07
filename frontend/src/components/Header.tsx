import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import { Search, X, Menu, ChefHat } from 'lucide-react';
import '../styles/header.css';

// Props for Header component: optional search and sort handlers
interface HeaderProps {
  onSearchChange?: (term: string) => void;
  onSortChange?: (sortType: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onSortChange }) => {
  // Auth state and navigation
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  // UI state for menu and search
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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
        {/* Sort dropdown */}
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
      </div>

      {/* Navigation links (desktop & mobile) */}
      <div className={`nav-links ${showMenu ? 'active' : ''}`}>
        <Link to="/" className="nav-link" onClick={handleLinkClick}>
          Home
        </Link>
        <Link to="/recipe-generator" className="nav-link" onClick={handleLinkClick}>
          AI Generator
        </Link>
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
