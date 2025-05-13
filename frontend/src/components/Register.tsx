import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { ChefHat } from "lucide-react"; // Remove AlertCircle
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import "../styles/login.css";

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
    form: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (loggedIn) {
      navigate("/");
    }
  }, [loggedIn, navigate]);

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Basic validation
  const validateForm = () => {
    let hasError = false;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      form: "", // Add the missing 'form' property
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Register with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Update the user's profile with username
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: formData.username,
        });
      }

      // No need to manually sync with the database - authContext will handle this

      // Show success and redirect
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

          {errors.form && (
            <div className="error-message" style={{ marginBottom: "1rem" }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="input-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input${
                  errors.username ? " error" : ""
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
                className={`form-input${
                  errors.password ? " error" : ""
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
                className={`form-input${
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
