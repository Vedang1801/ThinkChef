import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";
import "../styles/header.css";



const Header = () => {
  const { loggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure the Header component re-renders when loggedIn changes
  }, [loggedIn]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header-container">
      <div className="header-left">
        Recipe Management System
      </div>
      <div className="header-right">
        {loggedIn ? (
          <div className="header-links">
            <Link
              to="/"
              className="header-link1"
            >
              Home
            </Link>
            <Link
              to="/addrecipes"
              className="header-link2"
            >
              Add Recipe
            </Link>
            <Link
              to="/profile"
              className="header-link3"
            >
              Profile
            </Link>
            <span
              className="header-link4"
              onClick={handleLogout}
            >
              Logout
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              to="/"
              className="hover:text-3xl hover:text-slate-100 transition-all duration-300 ease-in-out bg-gradient-to-r from-orange-200 to-indigo-100 text-transparent bg-clip-text text-2xl font-bold hover:no-underline"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="hover:text-3xl hover:text-slate-100 transition-all duration-300 ease-in-out bg-gradient-to-r from-orange-200 to-indigo-100 text-transparent bg-clip-text text-2xl font-bold hover:no-underline"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
