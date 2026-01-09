import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./authContext";
import { ChefHat, ArrowLeft } from "lucide-react";
import "../../styles/login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      // Error is handled by resetPassword function in authContext
      // but we might want to show a generic error here
      setError("Failed to send password reset email. Please try again.");
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

          <h1 className="formbodytitle">Reset your password</h1>

          {emailSent ? (
            <div className="email-sent">
              <div className="success-message">
                Password reset email sent!
              </div>
              <p>
                Check your inbox for instructions to reset your password.
                If you don't see the email, check your spam folder.
              </p>
              <Link to="/login" className="back-to-login">
                <ArrowLeft size={16} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <p className="reset-instructions">
                Enter the email address associated with your account and we'll send you
                instructions to reset your password.
              </p>

              {error && <div className="login-error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="input-group">
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="inputemail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="formlogin-button"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset instructions"}
                </button>
              </form>

              <div className="loginlastline">
                <Link to="/login" className="back-to-login">
                  <ArrowLeft size={16} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
