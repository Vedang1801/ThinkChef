// App.tsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import Profile from "./components/Profile";
import Home from "./components/Home";
import AllRecipes from "./components/AllRecipes";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import AddReceipe from "./components/recipe/AddReceipe";
import ReceipeDetail from "./components/recipe/ReceipeDetail";
import RecipeGenerator from "./components/recipe/RecipeGenerator";
import { AuthProvider } from "./components/auth/authContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from 'react';
import ForgotPassword from "./components/auth/ForgotPassword";

// Main App component sets up routing, global providers, and layout
function App() {
  // State for search term in header
  const [searchTerm, setSearchTerm] = useState("");
  // State for sort type in header
  const [sortType, setSortType] = useState("");
  // State for filters
  const [filters, setFilters] = useState({
    cuisine: '',
    dietary: '',
    meal: '',
    difficulty: ''
  });

  // Handle filter changes from Header
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Handle sort change and scroll to top
  const handleSortChange = (sortValue: string) => {
    setSortType(sortValue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // Router provides client-side navigation
    <Router>
      {/* AuthProvider supplies authentication context to all children */}
      <AuthProvider>
        {/* Header handles search, sort, and filters */}
        <Header
          onSearchChange={setSearchTerm}
          onSortChange={handleSortChange}
          onFilterChange={handleFilterChange}
        />
        {/* Define all main routes for the app */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<AllRecipes searchTerm={searchTerm} sortType={sortType} filters={filters} />} />
          <Route path="/addrecipes" element={<AddReceipe />} />
          <Route path="/recipes/:id" element={<ReceipeDetail />} />
          <Route path="/recipe-generator" element={<RecipeGenerator />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        {/* ToastContainer for global notifications */}
        <ToastContainer position="bottom-right" theme="colored" />
      </AuthProvider>
    </Router>
  );
}

export default App;
