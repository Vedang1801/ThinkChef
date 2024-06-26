import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import '../styles/header.css';
import '../styles/home.css';
import '../styles/tips.css';
import '../styles/recipeCard.css';
import '../styles/profile.css';
import '../styles/main.css';
import '../styles/login.css';
import SearchBox from './SearchBox';

interface HeaderProps {
  onSearch: (searchTerm: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Ensure the Header component re-renders when loggedIn changes
  }, [loggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false); // Close the menu after logout
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLinkClick = () => {
    setShowMenu(false); // Close the menu when a link is clicked
  };

  return (
    <header className="header-container">
      <div className="header-left">RECIPE REALM</div>
      <div className="header-right">
        {/* Integrate the SearchBox component */}
        <SearchBox onSearch={onSearch} />
        <div className={`header-links ${showMenu ? 'show' : ''}`}>
          {loggedIn ? (
            <>
              <Link to="/" className="header-link1" onClick={handleLinkClick}>
                Home
              </Link>
              <Link to="/addrecipes" className="header-link2" onClick={handleLinkClick}>
                Add Recipe
              </Link>
              <Link to="/profile" className="header-link3" onClick={handleLinkClick}>
                Profile
              </Link>
              <span className="header-link4" onClick={handleLogout}>
                Logout
              </span>
            </>
          ) : (
            <>
              <Link to="/" className="header-link1" onClick={handleLinkClick}>
                Home
              </Link>
              <Link to="/login" className="header-link2" onClick={handleLinkClick}>
                Login
              </Link>
            </>
          )}
        </div>
        <div className="hamburger-menu" onClick={toggleMenu}>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;