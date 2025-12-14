import { useState, useEffect } from 'react';
import './MenuModal.css';

function MenuModal({ restaurant, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    // Trigger animation on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // ESC key support
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300); // Match animation duration
    };

    if (!restaurant) return null;

    return (
        <div
            className={`menu-modal-overlay ${isVisible ? 'visible' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`menu-modal-container ${isVisible ? 'visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="menu-modal-header">
                    <h2>Menu – {restaurant.name}</h2>
                    <button
                        className="menu-modal-close-btn"
                        onClick={handleClose}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="menu-modal-content">
                    {restaurant.menu_highlights && restaurant.menu_highlights.length > 0 ? (
                        <div className="menu-items-grid">
                            {restaurant.menu_highlights.map((item, index) => (
                                <div key={index} className="menu-item-card">
                                    <div className="menu-item-info">
                                        <span className="menu-item-name">{item.name}</span>
                                        <span className="menu-item-price">{item.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-menu-items">
                            <p>No menu items available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MenuModal;
