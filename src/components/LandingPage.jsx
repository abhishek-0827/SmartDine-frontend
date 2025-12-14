import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
    const { currentUser } = useAuth();

    // If user is already logged in, redirect to home
    if (currentUser) {
        return <Navigate to="/home" replace />;
    }

    const moods = [
        { id: 'happy', emoji: '😊', label: 'Happy', color: '#FEF3C7' },
        { id: 'tired', emoji: '☕', label: 'Tired', color: '#FFEDD5' },
        { id: 'excited', emoji: '⚡', label: 'Excited', color: '#FCE7F3' },
        { id: 'stressed', emoji: '😰', label: 'Stressed', color: '#DBEAFE' }
    ];

    const additionalFeatures = [
        {
            icon: '📍',
            title: 'Location-Based',
            description: 'Find restaurants near you with real-time distance and navigation',
            color: '#DBEAFE'
        },
        {
            icon: '⭐',
            title: 'Personalized Ratings',
            description: 'Get recommendations based on your taste preferences and past favorites',
            color: '#FEF3C7'
        },
        {
            icon: '💬',
            title: 'Social Sharing',
            description: 'Share your food discoveries with friends and see what they love',
            color: '#FCE7F3'
        },
        {
            icon: '🎯',
            title: 'Smart Filters',
            description: 'Filter by cuisine, price, dietary restrictions, and more',
            color: '#FEE2E2'
        },
        {
            icon: '📊',
            title: 'Mood Analytics',
            description: 'Track your food preferences and discover patterns in your cravings',
            color: '#E0E7FF'
        }
    ];

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-logo">
                    <div className="logo-icon-landing">🍽️</div>
                    <span className="logo-text-landing">SmartDine</span>
                </div>
                <div className="landing-header-actions">
                    <Link to="/contact" className="btn-contact">Contact Us</Link>
                    <Link to="/login" className="btn-login">Log In</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-badge">
                    🎯 ✨ AI-Powered Mood-Based Discovery
                </div>
                <h1 className="hero-title">
                    Food that<br />
                    <span className="hero-gradient">matches your mood</span>
                </h1>
                <p className="hero-subtitle">
                    SmartDine understands how you feel and what you crave. Get<br />
                    personalized restaurant recommendations powered by emotional AI.
                </p>
                <div className="hero-buttons">
                    <Link to="/signup" className="btn-primary-hero">
                        ✨ Start Your Journey
                    </Link>
                </div>

                {/* Mood Selection Preview */}
                <div className="mood-preview-section">
                    <p className="mood-preview-title">HOW ARE YOU FEELING TODAY?</p>
                    <div className="mood-preview-grid">
                        {moods.map((mood) => (
                            <div
                                key={mood.id}
                                className="mood-preview-card"
                                style={{ background: mood.color }}
                            >
                                <span className="mood-emoji">{mood.emoji}</span>
                                <span className="mood-label">{mood.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Features Section */}
                <div className="features-content">
                    <h2 className="features-title">Emotionally Intelligent Dining</h2>
                    <p className="features-subtitle">
                        SmartDine combines AI, mood science, and food psychology to recommend<br />
                        the perfect meal
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#FEF3C7' }}>
                                🧠
                            </div>
                            <h3 className="feature-title">Mood-Based AI</h3>
                            <p className="feature-description">
                                Our AI analyzes your emotions and energy levels to suggest restaurants
                                that match your vibe
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#FEE2E2' }}>
                                🔥
                            </div>
                            <h3 className="feature-title">Craving Intelligence</h3>
                            <p className="feature-description">
                                Tell us what you're craving - spicy, sweet, comforting - and we'll find
                                the perfect match
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#FEF3C7' }}>
                                ⏰
                            </div>
                            <h3 className="feature-title">Time-Aware</h3>
                            <p className="feature-description">
                                Breakfast, lunch, or late-night cravings - SmartDine adapts to your
                                dining schedule
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Features Section */}
                <div className="additional-features-section">
                    <h2 className="additional-features-title">Everything You Need</h2>
                    <p className="additional-features-subtitle">
                        Discover all the powerful features that make SmartDine your perfect dining companion
                    </p>

                    <div className="additional-features-grid">
                        {additionalFeatures.map((feature, index) => (
                            <div key={index} className="additional-feature-card">
                                <div className="additional-feature-icon" style={{ background: feature.color }}>
                                    {feature.icon}
                                </div>
                                <h4 className="additional-feature-title">{feature.title}</h4>
                                <p className="additional-feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <div className="logo-icon-landing">🍽️</div>
                        <span className="logo-text-landing">SmartDine</span>
                    </div>
                    <div className="footer-links">
                        <a href="#about">About</a>
                        <a href="#privacy">Privacy</a>
                        <a href="#terms">Terms</a>
                        <Link to="/contact">Contact</Link>
                    </div>
                    <div className="footer-copyright">
                        © 2024 SmartDine. All rights reserved
                    </div>
                </div>
            </footer>
        </div>
    );
}
