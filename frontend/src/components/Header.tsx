import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import { Home, PlusSquare, User, LogOut, Menu, X, Search } from 'lucide-react';
import '../styles/header.css';

interface HeaderProps {
  onSearchChange?: (term: string) => void;
  onSortChange?: (sortType: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onSortChange }) => {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLinkClick = () => {
    setShowMenu(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
    setShowSearch(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSortChange) {
      onSortChange(e.target.value);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-text">
          THINK CHEF
        </Link>
      </div>

      {/* Add search and sort functionality */}
      <div className="nav-search">
        {showSearch ? (
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            <button type="submit" className="search-btn">Search</button>
            <button 
              type="button" 
              onClick={() => setShowSearch(false)}
              className="search-close-btn"
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <button 
            className="search-icon-btn" 
            onClick={() => setShowSearch(true)}
          >
            <Search size={20} />
          </button>
        )}

        {/* Sort dropdown (optional) */}
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

      <div className={`nav-links ${showMenu ? 'active' : ''}`}>
        {loggedIn ? (
          <>
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/addrecipes" className="nav-link" onClick={handleLinkClick}>
              <PlusSquare size={20} />
              <span>Add Recipe</span>
            </Link>
            <Link to="/profile" className="nav-link" onClick={handleLinkClick}>
              <User size={20} />
              <span>Profile</span>
            </Link>
            <button className="nav-link logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              <Home size={20} />
              <span>Home</span>
            </Link>
            <Link to="/login" className="nav-link" onClick={handleLinkClick}>
              <LogOut size={20} />
              <span>Login</span>
            </Link>
          </>
        )}
      </div>
      <button className="menu-toggle" onClick={toggleMenu}>
        {showMenu ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  );
};

export default Header;
