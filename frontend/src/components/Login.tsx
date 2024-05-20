import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from './authContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const { loggedIn, login } = useAuth();

  useEffect(() => {
    if (loggedIn) {
      navigate('/'); // Redirect to home page if logged in
    }
  }, [loggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setErrors(prevState => ({
        ...prevState,
        email: 'Email is required'
      }));
    } else {
      setErrors(prevState => ({
        ...prevState,
        email: ''
      }));
    }

    if (!formData.password.trim()) {
      setErrors(prevState => ({
        ...prevState,
        password: 'Password is required'
      }));
    } else {
      setErrors(prevState => ({
        ...prevState,
        password: ''
      }));
    }

    if (formData.email.trim() && formData.password.trim()) {
      login(formData.email, formData.password);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-bold mb-2">
              Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
        <div className="mt-4">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
