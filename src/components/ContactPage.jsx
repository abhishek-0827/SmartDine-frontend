import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './ContactPage.css';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or 'sending'
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize EmailJS
    useEffect(() => {
        emailjs.init('OYKAVTgYemAmHZaGj'); // Public key
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSubmitStatus('error');
            return;
        }

        // Set sending status
        setSubmitStatus('sending');
        setErrorMessage('');

        try {
            // Prepare template parameters
            const templateParams = {
                from_name: formData.name,
                from_email: formData.email,
                subject: formData.subject,
                message: formData.message,
                to_name: 'SmartDine Team',
                reply_to: formData.email
            };

            // Send admin notification email
            const adminResponse = await emailjs.send(
                'service_vdhnifl',      // Service ID
                'template_eccl8e7',     // Admin notification template ID
                templateParams,
                'OYKAVTgYemAmHZaGj'     // Public key
            );

            console.log('Admin notification sent successfully:', adminResponse);

            // Try to send auto-reply email to user (optional - won't fail if template doesn't exist)
            try {
                const autoReplyResponse = await emailjs.send(
                    'service_vdhnifl',      // Service ID
                    'template_autoreply',   // Auto-reply template ID (create this in EmailJS)
                    templateParams,
                    'OYKAVTgYemAmHZaGj'     // Public key
                );
                console.log('Auto-reply sent successfully:', autoReplyResponse);
            } catch (autoReplyError) {
                // Auto-reply failed, but that's okay - admin email was sent
                console.warn('Auto-reply failed (template may not exist yet):', autoReplyError);
            }

            // Show success message
            setSubmitStatus('success');
            setErrors({});

            // Reset form
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });

            // Clear success message after 5 seconds
            setTimeout(() => {
                setSubmitStatus(null);
            }, 5000);

        } catch (error) {
            console.error('Email sending failed:', error);
            setSubmitStatus('error');
            setErrorMessage('Failed to send message. Please try again or contact us directly at abhicodemaker@gmail.com');

            // Clear error message after 7 seconds
            setTimeout(() => {
                setSubmitStatus(null);
                setErrorMessage('');
            }, 7000);
        }
    };

    return (
        <div className="contact-page">
            {/* Header */}
            <header className="contact-header">
                <Link to="/" className="contact-logo">
                    <div className="logo-icon-contact">🍽️</div>
                    <span className="logo-text-contact">SmartDine</span>
                </Link>
                <div className="contact-header-actions">
                    <Link to="/login" className="btn-login-contact">Log In</Link>
                    <Link to="/signup" className="btn-signup-contact">Sign Up</Link>
                </div>
            </header>

            {/* Contact Section */}
            <section className="contact-section">
                <div className="contact-container">
                    <div className="contact-info">
                        <h1 className="contact-title">Get in Touch</h1>
                        <p className="contact-subtitle">
                            Have a question or feedback? We'd love to hear from you.
                            Fill out the form and we'll get back to you as soon as possible.
                        </p>

                        <div className="contact-details">
                            <div className="contact-detail-item">
                                <div className="contact-icon">📧</div>
                                <div>
                                    <h3>Email</h3>
                                    <p>abhicodemaker@gmail.com</p>
                                </div>
                            </div>
                            <div className="contact-detail-item">
                                <div className="contact-icon">📱</div>
                                <div>
                                    <h3>Phone</h3>
                                    <p>+91 9965317703</p>
                                </div>
                            </div>
                            <div className="contact-detail-item">
                                <div className="contact-icon">📍</div>
                                <div>
                                    <h3>Location</h3>
                                    <p>Coimbatore, Tamil Nadu, India</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-wrapper">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={errors.name ? 'error' : ''}
                                    placeholder="Your name"
                                />
                                {errors.name && <span className="error-message">{errors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error' : ''}
                                    placeholder="your.email@example.com"
                                />
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject *</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={errors.subject ? 'error' : ''}
                                    placeholder="What is this about?"
                                />
                                {errors.subject && <span className="error-message">{errors.subject}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message *</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className={errors.message ? 'error' : ''}
                                    placeholder="Tell us more..."
                                    rows="6"
                                />
                                {errors.message && <span className="error-message">{errors.message}</span>}
                            </div>

                            <button type="submit" className="btn-submit-contact" disabled={submitStatus === 'sending'}>
                                {submitStatus === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>

                            {submitStatus === 'success' && (
                                <div className="success-message">
                                    ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
                                </div>
                            )}

                            {submitStatus === 'error' && errorMessage && (
                                <div className="error-message-box">
                                    ✗ {errorMessage}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="contact-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <div className="logo-icon-contact">🍽️</div>
                        <span className="logo-text-contact">SmartDine</span>
                    </div>
                    <div className="footer-links">
                        <Link to="/">Home</Link>
                        <a href="#about">About</a>
                        <a href="#privacy">Privacy</a>
                        <a href="#terms">Terms</a>
                    </div>
                    <div className="footer-copyright">
                        © 2024 SmartDine. All rights reserved
                    </div>
                </div>
            </footer>
        </div>
    );
}
