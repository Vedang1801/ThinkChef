import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: "",
      email: "",
      password: "",
    };

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length <= 5) {
      newErrors.password = "Password must be at least 6 characters long";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post("/api/register", formData);
        toast.success(response.data);
        navigate("/login");
        console.log(response.data); // Assuming server sends back a success message
      } catch (error) {
        console.error("Error registering user: ", error);
        toast.error("Registration failed");
      }
    }
  };

  return (
    <div className="loginbackground">
      <div className="formbody">
        <h2 className="formbodytitle">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4" style={{ position: "relative" }}>
            <input
              type="text"
              id="username"
              name="username"
              placeholder=" "
              value={formData.username}
              onChange={handleChange}
              className={`inputusername ${errors.username ? "error" : ""}`}
              required
            />
            <label htmlFor="username" className="floating-label">Username</label>
            {errors.username && (
              <p className="error-message">{errors.username}</p>
            )}
          </div>

          <div className="mb-4" style={{ position: "relative" }}>
            <input
              type="email"
              id="email"
              name="email"
              placeholder=" "
              value={formData.email}
              onChange={handleChange}
              className={`inputemail ${errors.email ? "error" : ""}`}
              required
            />
            <label htmlFor="email" className="floating-label">Email</label>
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="mb-4" style={{ position: "relative" }}>
            <input
              type="password"
              id="password"
              name="password"
              placeholder=" "
              value={formData.password}
              onChange={handleChange}
              className={`inputpassword ${errors.password ? "error" : ""}`}
              required
            />
            <label htmlFor="password" className="floating-label">Password</label>
            {errors.password && (
              <p className="error-message">{errors.password}</p>
            )}
          </div>

          <div className="mb-4 flex justify-center">
            <button type="submit" className="formlogin-button">
              Register
            </button>
          </div>
        </form>
        <div className="mt-4">
          <p className="loginlastline">
            Already have an account?{" "}
            <Link to="/login" className="text-black hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
