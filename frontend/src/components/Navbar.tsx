// File: src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./authContext"; 
import "../styles/navbar.css";

const Navbar: React.FC = () => {
  // Get authentication state and logout function
  const { loggedIn, logout } = useAuth();

  return (
    <nav className="navbar">
      {/* Brand/logo section */}
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src="/logo.png" alt="Think Chef" className="logo" />
        </Link>
      </div>
      {/* Main navigation links */}
      <div className="navbar-menu">
        <div className="navbar-start">
          <Link to="/" className="navbar-item">
            Home
          </Link>
          <Link to="/recipes" className="navbar-item">
            Recipes
          </Link>
          <Link to="/categories" className="navbar-item">
            Categories
          </Link>
          <Link to="/popular" className="navbar-item">
            Popular
          </Link>
          <Link to="/latest" className="navbar-item">
            Latest
          </Link>
        </div>
        {/* User account links (login or dropdown) */}
        <div className="navbar-end">
          {!loggedIn ? (
            <Link to="/login" className="navbar-item">
              Login
            </Link>
          ) : (
            <div className="navbar-item has-dropdown is-hoverable">
              <a className="navbar-link">
                Account
              </a>
              <div className="navbar-dropdown is-boxed">
                <Link to="/profile" className="navbar-item">
                  Profile
                </Link>
                <Link to="/addrecipes" className="navbar-item">
                  Create Recipe
                </Link>
                <Link to="/favorites" className="navbar-item">
                  Favorites
                </Link>
                <hr className="navbar-divider" />
                <a className="navbar-item" onClick={logout}>
                  Logout
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;