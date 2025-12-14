import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import './Login.css';

export default function Login() {
    const inputRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Convert Firebase error codes to user-friendly messages
    const getErrorMessage = (error) => {
        const errorCode = error.code;

        switch (errorCode) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Invalid email or password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed login attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support.';
            default:
                return 'Unable to sign in. Please check your credentials and try again.';
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        const userInput = inputRef.current.value.trim();
        const password = passwordRef.current.value;

        try {
            setError("");
            setLoading(true);

            let emailToLogin = userInput;

            // If input is NOT an email (no @), treat as SmartDine ID
            if (!userInput.includes('@')) {
                const usersRef = collection(db, "users");
                // Query for the smartdineId (lowercase)
                const q = query(usersRef, where("smartdineId", "==", userInput.toLowerCase()));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setLoading(false);
                    return setError("SmartDine ID not found. Please check and try again.");
                }

                // Get the email associated with this ID
                emailToLogin = querySnapshot.docs[0].data().email;
            }

            // Login with the resolved email
            await login(emailToLogin, password);
            navigate("/home");
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }

        setLoading(false);
    }

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">🍽️</div>
                </div>

                {/* Title */}
                <h2 className="login-title">Welcome back</h2>
                <p className="login-subtitle">Continue your food discovery journey</p>

                {/* Error Message */}
                {error && <div className="login-error">{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-form-group">
                        <label className="login-label">Email</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">✉️</span>
                            <input
                                type="text"
                                ref={inputRef}
                                required
                                placeholder="you@example.com"
                                className="login-input"
                            />
                        </div>
                    </div>

                    <div className="login-form-group">
                        <label className="login-label">Password</label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">🔒</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                ref={passwordRef}
                                required
                                placeholder="••••••••"
                                className="login-input"
                            />
                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        disabled={loading}
                        type="submit"
                        className="login-submit-btn"
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                {/* Sign Up Link */}
                <div className="login-signup-link">
                    Don't have an account? <Link to="/signup" className="login-link">Sign up</Link>
                </div>

                {/* Back to Home */}
                <Link to="/" className="login-back-home">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
