import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import { Home, PlusSquare, User, LogOut, Menu, X, SortDesc } from 'lucide-react';
import '../styles/header.css';
import SearchBox from './SearchBox';

interface HeaderProps {
  onSearch: (searchTerm: string) => void;
  onSort: (sortType: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onSort }) => {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  const handleSort = (sortType: string) => {
    onSort(sortType);
    setShowSortMenu(false);
  };

  const handleSearch = (searchTerm: string) => {
    console.log('Search term in Header:', searchTerm);
    onSearch(searchTerm);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-text">
          THINK CHEF
        </Link>
      </div>

      <div className="nav-search">
        <SearchBox onSearch={handleSearch} />
      </div>

      <div className="sort-container">
        <button 
          className="sort-button"
          onClick={() => setShowSortMenu(!showSortMenu)}
        >
          <SortDesc size={20} />
          <span>Sort</span>
        </button>
        
        {showSortMenu && (
          <div className="sort-menu">
            <button onClick={() => handleSort('top-rated')}>Top Rated</button>
            <button onClick={() => handleSort('newest')}>Newest First</button>
            <button onClick={() => handleSort('oldest')}>Oldest First</button>
            <button onClick={() => handleSort('rating-asc')}>Rating (Low to High)</button>
            <button onClick={() => handleSort('rating-desc')}>Rating (High to Low)</button>
          </div>
        )}
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
