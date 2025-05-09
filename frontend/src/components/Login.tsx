import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);  // Loading state
  const [loginError, setLoginError] = useState(""); // To store error message from login failure
  const navigate = useNavigate();
  const { loggedIn, login } = useAuth();

  useEffect(() => {
    if (loggedIn) {
      navigate("/"); // Redirect to home page if logged in
    }
  }, [loggedIn, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); // Clear previous login error

    if (!formData.email.trim()) {
      setErrors((prevState) => ({
        ...prevState,
        email: "Email is required",
      }));
    } else {
      setErrors((prevState) => ({
        ...prevState,
        email: "",
      }));
    }

    if (!formData.password.trim()) {
      setErrors((prevState) => ({
        ...prevState,
        password: "Password is required",
      }));
    } else {
      setErrors((prevState) => ({
        ...prevState,
        password: "",
      }));
    }

    if (formData.email.trim() && formData.password.trim()) {
      setLoading(true); // Set loading state to true
      try {
        const response = await login(formData.email, formData.password);
        if (response.success) {
          navigate("/"); // Redirect to home on successful login
        } else {
          setLoginError("Invalid email or password"); // Handle login failure
        }
      } catch (error) {
        setLoginError("An error occurred. Please try again later.");
      } finally {
        setLoading(false); // Reset loading state after API call
      }
    }
  };

  return (
    <div className="loginbackground">
      <div className="formbody">
        <h2 className="formbodytitle">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4" style={{ position: "relative" }}>
            <input
              type="text"
              id="email"
              name="email"
              placeholder=" "
              value={formData.email}
              onChange={handleChange}
              className={`inputemail ${errors.email ? "border-red-500" : ""}`}
              required
            />
            <label htmlFor="email" className="floating-label">Email</label>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-4" style={{ position: "relative" }}>
            <input
              type="password"
              id="password"
              name="password"
              placeholder=" "
              value={formData.password}
              onChange={handleChange}
              className={`inputpassword ${errors.password ? "border-red-500" : ""}`}
              required
            />
            <label htmlFor="password" className="floating-label">Password</label>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          
          {loginError && (
            <p className="text-red-500 text-sm mt-2">{loginError}</p> // Display login error message
          )}

          <div className="mb-4 flex justify-center">
            <button type="submit" className="formlogin-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"} {/* Show loading text */}
            </button>
          </div>
        </form>
        <div className="mt-4">
          <p className="loginlastline">
            Don't have an account?{" "}
            <Link to="/register" className="text-black hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
