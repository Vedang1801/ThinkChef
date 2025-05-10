import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { AlertCircle } from "lucide-react";
import "../styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { loggedIn, login } = useAuth();

  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setLoginError("");
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoginError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Successful login will redirect in the useEffect above
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(
        error?.response?.data ||
          error?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginbackground">
      <div className="login-container">
        <div className="login-image"></div>
        <div className="formbody">
          <div className="brand-logo">Think Chef</div>
          <h1 className="formbodytitle">Sign in or create an account</h1>

          {loginError && (
            <div className="login-error-message">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`inputemail${
                  errors.email ? " error" : ""
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>

            <div className="input-group">
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

            <button
              type="submit"
              className="formlogin-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Continue with Email"}
            </button>
          </form>

          <div className="form-separator">
            <span>or</span>
          </div>

          <p className="loginlastline">
            Don't have an account? <Link to="/register">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
