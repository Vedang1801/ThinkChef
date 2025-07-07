// App.tsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Profile from "./components/Profile";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import AddReceipe from "./components/AddReceipe";
import ReceipeDetail from "./components/ReceipeDetail";
import RecipeGenerator from "./components/RecipeGenerator";
import { AuthProvider } from "./components/authContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from 'react';
import ForgotPassword from "./components/ForgotPassword";

// Main App component sets up routing, global providers, and layout
function App() {
  // State for search term in header
  const [searchTerm, setSearchTerm] = useState("");
  // State for sort type in header
  const [sortType, setSortType] = useState("");

  return (
    // Router provides client-side navigation
    <Router>
      {/* AuthProvider supplies authentication context to all children */}
      <AuthProvider>
        {/* Header handles search and sort, passes handlers to update state */}
        <Header 
          onSearchChange={setSearchTerm}
          onSortChange={setSortType}
        />
        {/* Define all main routes for the app */}
        <Routes>
          <Route path="/" element={<Home searchTerm={searchTerm} sortType={sortType} />} />
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
