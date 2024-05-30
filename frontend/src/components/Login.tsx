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
  const navigate = useNavigate();
  const { loggedIn, login } = useAuth();

  useEffect(() => {
    if (loggedIn) {
      navigate("/"); // Redirect to home page if logged in
    }
  }, [loggedIn, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
      login(formData.email, formData.password);
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
          <div className="mb-4 flex justify-center">
            <button type="submit" className="formlogin-button">
              Login
            </button>
          </div>
        </form>
        <div className="mt-4">
          <p className="loginlastline">
            Don't have an account?{" "}
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
