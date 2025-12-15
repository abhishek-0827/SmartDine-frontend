import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './DiscoveryPage.css';
import config from '../config';

export default function DiscoveryPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedMenus, setExpandedMenus] = useState(new Set());
    const { currentUser } = useAuth();

    const toggleMenu = (restaurantId) => {
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(restaurantId)) {
                newSet.delete(restaurantId);
            } else {
                newSet.add(restaurantId);
            }
            return newSet;
        });
    };

    const capitalizePriceLevel = (priceLevel) => {
        if (!priceLevel) return '';
        return priceLevel.charAt(0).toUpperCase() + priceLevel.slice(1);
    };

    useEffect(() => {
        fetchRestaurants();
    }, [currentPage, searchQuery]);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 12,
                search: searchQuery
            });

            if (currentUser) {
                params.append('userId', currentUser.uid);
            }

            const url = `${config.API_BASE_URL}/discover?${params}`;
            const response = await fetch(url);
            const data = await response.json();

            setRestaurants(data.results || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const getInteractionBadge = (interaction) => {
        switch (interaction) {
            case 'posted':
                return <span className="badge badge-posted">📝 Posted</span>;
            case 'commented':
                return <span className="badge badge-commented">💬 Commented</span>;
            case 'liked':
                return <span className="badge badge-liked">❤️ Liked</span>;
            default:
                return <span className="badge badge-discover">🔍 Discover</span>;
        }
    };

    const renderPagination = () => {
        if (!pagination || pagination.total_pages <= 1) return null;

        const pages = [];
        const { current_page, total_pages } = pagination;

        // Always show first page
        pages.push(1);

        // Show pages around current page
        for (let i = Math.max(2, current_page - 1); i <= Math.min(total_pages - 1, current_page + 1); i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        // Always show last page
        if (!pages.includes(total_pages)) {
            pages.push(total_pages);
        }

        return (
            <div className="pagination">
                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(current_page - 1)}
                    disabled={!pagination.has_prev}
                >
                    ← Previous
                </button>

                {pages.map((page, index) => {
                    // Add ellipsis if there's a gap
                    const prevPage = pages[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                        <div key={page} style={{ display: 'flex', gap: '8px' }}>
                            {showEllipsis && <span className="pagination-ellipsis">...</span>}
                            <button
                                className={`pagination-number ${page === current_page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        </div>
                    );
                })}

                <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(current_page + 1)}
                    disabled={!pagination.has_next}
                >
                    Next →
                </button>
            </div>
        );
    };

    return (
        <div className="discovery-page">
            <div className="discovery-header">
                <h1>🍽️ Discover Restaurants</h1>
                <div className="search-wrapper">
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search restaurants, cuisines, or dishes..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>
                {pagination && (
                    <p className="results-count">
                        Showing {restaurants.length} of {pagination.total_results} results
                    </p>
                )}
            </div>

            {loading ? (
                <div className="loading">Loading restaurants...</div>
            ) : restaurants.length === 0 ? (
                <div className="no-results">
                    <p>No restaurants found</p>
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}>
                            Clear Search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="restaurants-grid">
                        {restaurants.map((item, index) => (
                            item.type === 'dish' ? (
                                // Dish Card
                                <div key={`dish-${index}`} className="dish-card">
                                    <div className="dish-header">
                                        <h3>{item.dish_name}</h3>
                                        <span className="dish-price">{item.dish_price}</span>
                                    </div>
                                    <div className="dish-restaurant-info">
                                        <span className="restaurant-icon">🍽️</span>
                                        <span className="restaurant-name">{item.restaurant_name}</span>
                                    </div>
                                    <div className="dish-cuisines">
                                        {item.restaurant_cuisines.map((cuisine, idx) => (
                                            <span key={idx} className="cuisine-tag">{cuisine}</span>
                                        ))}
                                    </div>
                                    <div className="dish-info">
                                        <span className="rating">⭐ {item.restaurant_rating}</span>
                                        <span className="price">{capitalizePriceLevel(item.restaurant_price_level)}</span>
                                    </div>
                                </div>
                            ) : (
                                // Restaurant Card
                                <div key={item.id} className="restaurant-card">
                                    {expandedMenus.has(item.id) ? (
                                        // Menu View
                                        <div className="menu-view">
                                            <div className="menu-view-header">
                                                <h3>{item.name}</h3>
                                                <button
                                                    className="close-menu-btn"
                                                    onClick={() => toggleMenu(item.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="menu-view-content">
                                                {item.menu_highlights.map((menuItem, idx) => (
                                                    <div key={idx} className="menu-view-item">
                                                        <span className="menu-view-item-name">{menuItem.name}</span>
                                                        <span className="menu-view-item-price">{menuItem.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // Normal Card View
                                        <>
                                            <div className="card-header">
                                                <h3>{item.name}</h3>
                                                {getInteractionBadge(item.user_interaction)}
                                            </div>

                                            <div className="card-cuisines">
                                                {item.cuisines.map((cuisine, idx) => (
                                                    <span key={idx} className="cuisine-tag">{cuisine}</span>
                                                ))}
                                            </div>

                                            <p className="card-description">{item.description}</p>

                                            <div className="card-info">
                                                <span className="rating">⭐ {item.rating}</span>
                                                <span className="price">{capitalizePriceLevel(item.price_level)}</span>
                                            </div>

                                            <div className="card-tags">
                                                {item.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="tag">{tag}</span>
                                                ))}
                                            </div>

                                            {/* User Interaction Details */}
                                            {item.user_interaction !== 'none' && (
                                                <div className="user-interaction-details">
                                                    {item.user_interaction === 'posted' && (
                                                        <p className="interaction-text">📝 You posted about this restaurant</p>
                                                    )}
                                                    {item.user_interaction === 'commented' && (
                                                        <p className="interaction-text">💬 You commented about this place</p>
                                                    )}
                                                    {item.user_interaction === 'liked' && (
                                                        <p className="interaction-text">❤️ You liked a post about this restaurant</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Click to View Menu */}
                                            <button
                                                className="view-menu-btn"
                                                onClick={() => toggleMenu(item.id)}
                                            >
                                                🍽️ View Full Menu ({item.menu_highlights.length} items)
                                            </button>
                                        </>
                                    )}
                                </div>
                            )
                        ))}
                    </div>

                    {renderPagination()}
                </>
            )}
        </div>
    );
}
