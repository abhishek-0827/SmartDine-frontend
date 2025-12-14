import { useState, useEffect } from 'react';
import RouteMap from './RouteMap';
import './RouteCard.css';

function RouteCard({ restaurant, routeData, userLocation, onClose }) {
    const [isVisible, setIsVisible] = useState(false);

    // Trigger animation on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for animation to complete before calling onClose
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!restaurant || !routeData || !userLocation) {
        return null;
    }

    const destination = {
        lat: restaurant.coordinates?.lat || restaurant.location?.lat || restaurant.lat,
        lon: restaurant.coordinates?.lon || restaurant.location?.lon || restaurant.lon
    };

    return (
        <>
            {/* Backdrop overlay for mobile */}
            <div
                className={`route-card-backdrop ${isVisible ? 'visible' : ''}`}
                onClick={handleClose}
            />

            {/* Route Card Panel */}
            <div className={`route-card-panel ${isVisible ? 'visible' : ''}`}>
                {/* Header */}
                <div className="route-card-header">
                    <div className="route-card-header-content">
                        <h3 className="route-card-title">Route to {restaurant.name}</h3>
                        <div className="route-card-meta">
                            <span className="route-meta-item">
                                📍 {routeData.distance_km} km
                            </span>
                            <span className="route-meta-separator">•</span>
                            <span className="route-meta-item">
                                ⏱️ {routeData.duration_min} min
                            </span>
                        </div>
                    </div>
                    <button
                        className="route-card-close-btn"
                        onClick={handleClose}
                        aria-label="Close route"
                    >
                        ✕
                    </button>
                </div>

                {/* Restaurant Info */}
                <div className="route-card-info">
                    <div className="route-info-row">
                        <span className="route-info-label">Restaurant</span>
                        <span className="route-info-value">{restaurant.name}</span>
                    </div>
                    {restaurant.cuisines && restaurant.cuisines.length > 0 && (
                        <div className="route-info-row">
                            <span className="route-info-label">Cuisine</span>
                            <span className="route-info-value">
                                {restaurant.cuisines.join(', ')}
                            </span>
                        </div>
                    )}
                    {restaurant.rating && (
                        <div className="route-info-row">
                            <span className="route-info-label">Rating</span>
                            <span className="route-info-value">⭐ {restaurant.rating}</span>
                        </div>
                    )}
                </div>

                {/* Map Container */}
                <div className="route-card-map-container">
                    <RouteMap
                        origin={userLocation}
                        destination={destination}
                        routeData={routeData}
                        restaurantName={restaurant.name}
                        onClose={handleClose}
                        isEmbedded={true}
                    />
                </div>
            </div>
        </>
    );
}

export default RouteCard;
