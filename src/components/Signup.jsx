import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import './Signup.css';

export default function Signup() {
    const nameRef = useRef();
    const emailRef = useRef();
    const idRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    // Convert Firebase error codes to user-friendly messages
    const getErrorMessage = (error) => {
        const errorCode = error.code;

        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please sign in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password is too weak. Please use at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'permission-denied':
                return 'Unable to create account. Please try again.';
            default:
                return 'Unable to create account. Please try again later.';
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match");
        }

        const smartdineId = idRef.current.value.toLowerCase().trim();
        const email = emailRef.current.value.trim();

        // Simple regex check for clean IDs (alphanumeric only)
        if (!/^[a-z0-9_.]+$/.test(smartdineId)) {
            return setError("ID can only contain letters, numbers, underscores and dots.");
        }

        if (smartdineId.length < 3) {
            return setError("ID must be at least 3 characters.");
        }

        try {
            setError("");
            setLoading(true);

            // 1. Check if SmartDine ID is available
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("smartdineId", "==", smartdineId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setLoading(false);
                return setError("SmartDine ID is already taken. Please choose another.");
            }

            // 2. Create Auth User
            const userCredential = await signup(email, passwordRef.current.value);
            const user = userCredential.user;

            // 3. Create User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: nameRef.current.value,
                smartdineId: smartdineId,
                email: email,
                createdAt: new Date()
            });

            // Redirect to home after signup
            navigate("/home");
        } catch (err) {
            console.error("Signup Error:", err);
            setError(getErrorMessage(err));
        }

        setLoading(false);
    }

    return (
        <div className="signup-page">
            <div className="signup-container">
                {/* Logo */}
                <div className="signup-logo">
                    <div className="signup-logo-icon">🍽️</div>
                </div>

                {/* Title */}
                <h2 className="signup-title">Join SmartDine</h2>
                <p className="signup-subtitle">Start discovering food that matches your mood</p>

                {/* Error Message */}
                {error && <div className="signup-error">{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="signup-form-group">
                        <label className="signup-label">Full Name</label>
                        <div className="signup-input-wrapper">
                            <span className="signup-input-icon">👤</span>
                            <input
                                type="text"
                                ref={nameRef}
                                required
                                placeholder="John Doe"
                                className="signup-input"
                            />
                        </div>
                    </div>

                    <div className="signup-form-group">
                        <label className="signup-label">SmartDine ID</label>
                        <div className="signup-input-wrapper">
                            <span className="signup-input-icon">@</span>
                            <input
                                type="text"
                                ref={idRef}
                                required
                                placeholder="unique_username"
                                className="signup-input"
                            />
                        </div>
                        <small className="signup-hint">Your unique handle for friends</small>
                    </div>

                    <div className="signup-form-group">
                        <label className="signup-label">Email</label>
                        <div className="signup-input-wrapper">
                            <span className="signup-input-icon">✉️</span>
                            <input
                                type="email"
                                ref={emailRef}
                                required
                                placeholder="you@example.com"
                                className="signup-input"
                            />
                        </div>
                    </div>

                    <div className="signup-form-group">
                        <label className="signup-label">Password</label>
                        <div className="signup-input-wrapper">
                            <span className="signup-input-icon">🔒</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                ref={passwordRef}
                                required
                                placeholder="••••••••"
                                className="signup-input"
                            />
                            <button
                                type="button"
                                className="signup-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div className="signup-form-group">
                        <label className="signup-label">Confirm Password</label>
                        <div className="signup-input-wrapper">
                            <span className="signup-input-icon">🔒</span>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                ref={passwordConfirmRef}
                                required
                                placeholder="••••••••"
                                className="signup-input"
                            />
                            <button
                                type="button"
                                className="signup-password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Create Account Button */}
                    <button
                        disabled={loading}
                        type="submit"
                        className="signup-submit-btn"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                {/* Sign In Link */}
                <div className="signup-signin-link">
                    Already have an account? <Link to="/login" className="signup-link">Sign in</Link>
                </div>

                {/* Back to Home */}
                <Link to="/" className="signup-back-home">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
