import { useState } from 'react'
import './ResultCard.css'

function ResultCard({ result, onDirectionsClick, onSimilarClick, onMenuClick }) {


    const handleSimilarDishes = () => {
        if (onSimilarClick) {
            onSimilarClick(result);
        }
    }

    const handleGetDirections = () => {
        if (onDirectionsClick) {
            onDirectionsClick(result);
        }
    }

    const handleMenuClick = () => {
        if (onMenuClick) {
            onMenuClick(result);
        }
    }


    // Calculate match percentage (mock for now - you can enhance this)
    const matchPercentage = result.score ? Math.min(Math.round(result.score * 10), 99) : Math.floor(Math.random() * 20) + 80;

    // Check if restaurant is open (mock for now)
    const isOpenNow = true;

    // Get craving tags from cuisines and tags
    const getCravingTags = () => {
        const tags = [];
        if (result.tags) {
            result.tags.forEach(tag => {
                if (tag.toLowerCase().includes('comfort')) tags.push({ label: 'Comforting', color: '#FED7AA' });
                if (tag.toLowerCase().includes('spicy')) tags.push({ label: 'Spicy', color: '#FEE2E2' });
                if (tag.toLowerCase().includes('sweet')) tags.push({ label: 'Sweet', color: '#FCE7F3' });
            });
        }
        if (result.cuisines) {
            result.cuisines.forEach(cuisine => {
                if (cuisine.toLowerCase().includes('light') || cuisine.toLowerCase().includes('salad')) {
                    tags.push({ label: 'Light', color: '#D1FAE5' });
                }
                if (cuisine.toLowerCase().includes('fresh')) {
                    tags.push({ label: 'Fresh', color: '#CFFAFE' });
                }
            });
        }
        // Default tags if none found
        if (tags.length === 0 && result.cuisines && result.cuisines.length > 0) {
            tags.push({ label: 'Savory', color: '#FFEDD5' });
        }
        return tags.slice(0, 3); // Max 3 tags
    };

    const cravingTags = getCravingTags();

    // Find matching menu item for price
    const suggestedItemDetails = result.menu_highlights?.find(item =>
        item.name.toLowerCase() === result.suggested_item?.toLowerCase() ||
        item.name.toLowerCase().includes(result.suggested_item?.toLowerCase()) ||
        result.suggested_item?.toLowerCase().includes(item.name.toLowerCase())
    );

    return (
        <div className="new-result-card">
            {/* Restaurant Image with Badges */}
            <div className="card-image-container">
                <div className="card-image-placeholder">
                    {/* Placeholder for restaurant image */}
                    <span className="image-icon">🍽️</span>
                </div>

                {/* Match Badge */}
                <div className="match-badge">
                    <span className="match-icon">🎯</span>
                    <span className="match-text">{matchPercentage}% Match</span>
                </div>

                {/* Open Now Badge */}
                {isOpenNow && (
                    <div className="open-badge">
                        Open Now
                    </div>
                )}
            </div>

            {/* Restaurant Info */}
            <div className="card-content">
                <h3 className="restaurant-name">{result.name}</h3>

                <div className="restaurant-meta">
                    <span className="cuisine-text">
                        {result.cuisines ? result.cuisines.join(' • ') : 'Restaurant'}
                    </span>
                    {result.price_level && (
                        <span className="price-level"> • {result.price_level}</span>
                    )}
                </div>

                <div className="rating-distance">
                    {result.rating && (
                        <span className="rating-new">
                            ⭐ {result.rating}
                        </span>
                    )}
                    {result.distance && (
                        <span className="distance-new">
                            📍 {result.distance}
                        </span>
                    )}
                </div>

                {/* Craving Tags */}
                {cravingTags.length > 0 && (
                    <div className="craving-tags">
                        {cravingTags.map((tag, index) => (
                            <span
                                key={index}
                                className="craving-tag"
                                style={{ backgroundColor: tag.color }}
                            >
                                {tag.label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Suggested Dish */}
                {result.suggested_item && (
                    <div className="suggested-dish-box">
                        <div className="suggested-label">Suggested Dish</div>
                        <div className="suggested-dish">
                            {result.suggested_item}
                            {suggestedItemDetails?.price && (
                                <span className="suggested-price"> — {suggestedItemDetails.price}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* AI Reason */}
                {result.short_reason && (
                    <p className="ai-reason">"{result.short_reason}"</p>
                )}

                {/* Action Buttons */}
                <div className="card-actions">
                    <button onClick={handleMenuClick} className="action-btn-new secondary">
                        📖 Menu
                    </button>
                    <button onClick={handleGetDirections} className="action-btn-new secondary">
                        🗺️ Directions
                    </button>
                    <button onClick={handleSimilarDishes} className="action-btn-new primary">
                        ✨ Similar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ResultCard
