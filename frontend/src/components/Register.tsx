import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "./authContext"; // Remove this line
import { ChefHat } from "lucide-react";
import "../styles/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const navigate = useNavigate();
  // const { register } = useAuth(); // Remove this line

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Add registration logic here
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Basic validation
    let hasError = false;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    if (!formData.username) {
      newErrors.username = "Username is required";
      hasError = true;
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
      hasError = true;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      hasError = true;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      if (response.ok) {
        navigate("/login");
      } else {
        const msg = await response.text();
        setRegisterError(msg || "Registration failed");
      }
    } catch (err) {
      setRegisterError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginbackground">
      <div className="login-container">
        <div className="login-image"></div>
        <div className="formbody">
          <div className="brand-logo">
            <ChefHat size={24} className="logo-icon" />
            <span className="logo-text">Think Chef</span>
          </div>
          <h1 className="formbodytitle">Create an account</h1>

          {registerError && (
            <div className="error-message" style={{ marginBottom: "1rem" }}>
              {registerError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="mb-4">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`inputusername${
                  errors.username ? " error" : ""
                }`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`inputemail${errors.email ? " error" : ""}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`inputpassword${
                  errors.password ? " error" : ""
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`inputpassword${
                  errors.confirmPassword ? " error" : ""
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="formlogin-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="loginlastline">
            Already have an account?{" "}
            <Link to="/login" className="text-black hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
