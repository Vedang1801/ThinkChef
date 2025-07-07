import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { AlertCircle, ChefHat } from "lucide-react";
import "../styles/login.css";

const Login = () => {
  // State for form fields and errors
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
  // Auth context
  const { loggedIn, login, loginWithGoogle } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  // Handle input changes and clear errors
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setLoginError("");
  };

  // Validate form fields
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

  // Handle form submit for email/password login
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

      // Map Firebase error codes to user-friendly messages
      let errorMessage = "Failed to sign in";

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/invalid-email":
        case "auth/wrong-password":
        case "auth/user-not-found":
          errorMessage = "Incorrect email or password. Please try again.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled. Please contact support.";
          break;
        case "auth/too-many-requests":
          errorMessage =
            "Too many unsuccessful login attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = "Failed to sign in. Please try again later.";
      }

      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginbackground">
      <div className="login-container">
        <div className="login-image"></div>
        <div className="formbody">
          {/* Brand logo and title */}
          <div className="brand-logo">
            <ChefHat size={24} className="logo-icon" />
            <span className="logo-text">Think Chef</span>
          </div>
          <h1 className="formbodytitle">Sign in or create an account</h1>

          {/* Error message for login failures */}
          {loginError && (
            <div className="login-error-message">
              <AlertCircle size={16} />
              {loginError}
            </div>
          )}

          {/* Email/password login form */}
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
              <div className="password-header">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </Link>
              </div>
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

          {/* Separator for alternative login */}
          <div className="form-separator">
            <span>or</span>
          </div>

          {/* Google login button */}
          <button
            className="formlogin-button google"
            type="button"
            onClick={async () => {
              setLoading(true);
              setLoginError("");
              try {
                await loginWithGoogle();
              } catch (error: any) {
                setLoginError(error?.message || "Google sign-in failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <img
                  src="/google-icon.svg"
                  alt="Google"
                  className="google-icon"
                />
                Continue with Google
              </>
            )}
          </button>

          {/* Link to registration page */}
          <p className="loginlastline">
            Don't have an account? <Link to="/register">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
