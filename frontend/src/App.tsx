import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Profile from './components/Profile';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AddReceipe from './components/AddReceipe';
import ReceipeDetail from './components/ReceipeDetail';
import { AuthProvider } from './components/authContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



function App() {
  return (
    <Router>
      <AuthProvider>
      
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/addrecipes" element={<AddReceipe />} />
          <Route path="/recipes/:id" element={<ReceipeDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
         
        </Routes>
      <ToastContainer position="bottom-right"  theme="colored" />
      </AuthProvider>
    </Router>
  );
}

export default App;
