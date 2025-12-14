import { useState, useEffect } from 'react';
import './SimilarCard.css';

function SimilarCard({ dish, restaurantName, onClose, onGetDirections }) {
    const [similarDishes, setSimilarDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

    // Trigger animation on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Fetch similar dishes
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            const mockSimilarDishes = generateSimilarDishes(dish);
            setSimilarDishes(mockSimilarDishes);
            setLoading(false);
        }, 500);
    }, [dish]);

    const generateSimilarDishes = (baseDish) => {
        const dishType = baseDish.toLowerCase();
        const variations = [];

        if (dishType.includes('juice') || dishType.includes('shake')) {
            variations.push(
                { name: 'Mango Juice', restaurant_name: 'Fresh Juice Corner', price: '₹80', distance: '2.3 km', category: 'Beverage', restaurantId: 'r001', coordinates: { lat: 11.0169, lon: 76.9558 } },
                { name: 'Orange Juice', restaurant_name: 'Vitamin Bar', price: '₹70', distance: '1.8 km', category: 'Beverage', restaurantId: 'r002', coordinates: { lat: 11.016, lon: 76.9419 } },
                { name: 'Mixed Fruit Juice', restaurant_name: 'Healthy Bites', price: '₹90', distance: '3.1 km', category: 'Beverage', restaurantId: 'r003', coordinates: { lat: 11.0202, lon: 76.9581 } },
                { name: 'Watermelon Juice', restaurant_name: 'Juice Junction', price: '₹75', distance: '2.7 km', category: 'Beverage', restaurantId: 'r004', coordinates: { lat: 11.0128, lon: 76.9594 } }
            );
        } else if (dishType.includes('biryani')) {
            variations.push(
                { name: 'Chicken Biryani', restaurant_name: 'Biryani House', price: '₹270', distance: '1.5 km', category: 'Main Course', restaurantId: 'r005', coordinates: { lat: 11.0301, lon: 76.981 } },
                { name: 'Mutton Biryani', restaurant_name: 'Royal Biryani', price: '₹330', distance: '2.2 km', category: 'Main Course', restaurantId: 'r006', coordinates: { lat: 11.0179, lon: 76.9562 } },
                { name: 'Veg Biryani', restaurant_name: 'Spice Garden', price: '₹180', distance: '1.9 km', category: 'Main Course', restaurantId: 'r007', coordinates: { lat: 11.0105, lon: 76.959 } },
                { name: 'Egg Biryani', restaurant_name: 'Biryani Express', price: '₹150', distance: '2.8 km', category: 'Main Course', restaurantId: 'r008', coordinates: { lat: 11.0192, lon: 76.9465 } }
            );
        } else if (dishType.includes('pizza')) {
            variations.push(
                { name: 'Margherita Pizza', restaurant_name: 'Pizza Corner', price: '₹320', distance: '1.2 km', category: 'Italian', restaurantId: 'r009', coordinates: { lat: 11.0174, lon: 76.941 } },
                { name: 'Pepperoni Pizza', restaurant_name: 'Italian Bistro', price: '₹420', distance: '2.5 km', category: 'Italian', restaurantId: 'r010', coordinates: { lat: 11.0188, lon: 76.947 } },
                { name: 'Veggie Supreme Pizza', restaurant_name: 'Pizza Palace', price: '₹380', distance: '1.7 km', category: 'Italian', restaurantId: 'r011', coordinates: { lat: 11.022, lon: 76.97 } },
                { name: 'BBQ Chicken Pizza', restaurant_name: 'Wood Fired Pizza', price: '₹450', distance: '3.0 km', category: 'Italian', restaurantId: 'r012', coordinates: { lat: 11.0285, lon: 76.9815 } }
            );
        } else if (dishType.includes('sweet') || dishType.includes('pak') || dishType.includes('mysore')) {
            variations.push(
                { name: 'Mysore Pak (sweet) (Classic)', restaurant_name: 'Local Eatery', price: '₹200', distance: '1.5 km', category: 'Dessert', restaurantId: 'r013', coordinates: { lat: 11.018, lon: 76.9565 } },
                { name: 'Mysore Pak (sweet) (Special)', restaurant_name: 'Premium Restaurant', price: '₹350', distance: '2.0 km', category: 'Dessert', restaurantId: 'r014', coordinates: { lat: 11.019, lon: 76.9435 } },
                { name: 'Mysore Pak (sweet) (Deluxe)', restaurant_name: 'Fine Dine', price: '₹450', distance: '2.8 km', category: 'Dessert', restaurantId: 'r015', coordinates: { lat: 11.0265, lon: 76.982 } }
            );
        } else {
            // Generic similar dishes
            variations.push(
                { name: `${baseDish} (Classic)`, restaurant_name: 'Local Eatery', price: '₹200', distance: '1.5 km', category: 'Popular', restaurantId: 'r013', coordinates: { lat: 11.018, lon: 76.9565 } },
                { name: `${baseDish} (Special)`, restaurant_name: 'Premium Restaurant', price: '₹350', distance: '2.0 km', category: 'Premium', restaurantId: 'r014', coordinates: { lat: 11.019, lon: 76.9435 } },
                { name: `${baseDish} (Deluxe)`, restaurant_name: 'Fine Dine', price: '₹450', distance: '2.8 km', category: 'Luxury', restaurantId: 'r015', coordinates: { lat: 11.0265, lon: 76.982 } }
            );
        }

        return variations;
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleDirectionsClick = (item) => {
        if (onGetDirections) {
            onGetDirections(item);
        }
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`similar-card-backdrop ${isVisible ? 'visible' : ''}`}
                onClick={handleClose}
            />

            {/* Similar Card Panel */}
            <div className={`similar-card-panel ${isVisible ? 'visible' : ''}`}>
                {/* Header */}
                <div className="similar-card-header">
                    <div className="similar-card-header-content">
                        <h3 className="similar-card-title">Similar to "{dish}"</h3>
                        <p className="similar-card-subtitle">
                            {loading ? 'Loading...' : `${similarDishes.length} items found`}
                        </p>
                    </div>
                    <button
                        className="similar-card-close-btn"
                        onClick={handleClose}
                        aria-label="Close similar items"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="similar-card-content">
                    {loading ? (
                        <div className="similar-loading">
                            <div className="loading-spinner">⏳</div>
                            <p>Finding similar dishes...</p>
                        </div>
                    ) : (
                        <div className="similar-items-list">
                            {similarDishes.map((item, index) => (
                                <div key={index} className="similar-item-card">
                                    <div className="similar-item-header">
                                        <h4 className="similar-item-name">{item.name}</h4>
                                        <span className="similar-item-category">{item.category}</span>
                                    </div>

                                    <div className="similar-item-restaurant">
                                        <span className="restaurant-icon">📍</span>
                                        <span className="restaurant-name">{item.restaurant_name}</span>
                                    </div>

                                    <div className="similar-item-meta">
                                        <div className="similar-item-badges">
                                            <span className="badge badge-price">{item.price}</span>
                                            <span className="badge badge-distance">{item.distance}</span>
                                        </div>
                                        <button
                                            className="similar-item-directions-btn"
                                            onClick={() => handleDirectionsClick(item)}
                                        >
                                            🗺️ Directions
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default SimilarCard;
