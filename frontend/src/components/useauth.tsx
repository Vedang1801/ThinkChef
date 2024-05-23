import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";
import { useState, useEffect } from "react";

const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if the token exists in local storage
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token); // Set isLoggedIn to true if token exists
  }, []);

  const logout = () => {
    // Remove the token from local storage
    localStorage.removeItem("token");
    setIsLoggedIn(false); // Update isLoggedIn state
    // Optionally perform any additional logout logic, such as redirecting to the login page
  };

  return {
    isLoggedIn,
    logout,
  };
};

export default useAuth;
