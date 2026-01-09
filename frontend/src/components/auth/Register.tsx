import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { ChefHat } from "lucide-react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import "../../styles/login.css";

// Register component handles user registration and validation
const Register = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // State for error messages
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    form: "",
  });

  // Loading state for form submission
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loggedIn } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  // Handle input changes for form fields
  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Validate form fields before submission
  const validateForm = () => {
    let hasError = false;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      form: "",
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
    return !hasError;
  };

  // Handle form submission for registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Register user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      // Update user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: formData.username,
        });
      }
      // Redirect to home on success
      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to create account";
      // Handle common Firebase auth errors
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      }
      setErrors({ ...errors, form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Render registration form UI
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
          <h1 className="formbodytitle">Create an account</h1>

          {/* Show form-level error if present */}
          {errors.form && (
            <div className="error-message" style={{ marginBottom: "1rem" }}>
              {errors.form}
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="register-form">
            <div className="input-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input${errors.username ? " error" : ""
                  }`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input${errors.email ? " error" : ""}`}
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
                className={`form-input${errors.password ? " error" : ""
                  }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input${errors.confirmPassword ? " error" : ""
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

          {/* Link to login page for existing users */}
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
