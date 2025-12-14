import { useState, useEffect } from 'react'
import ResultsList from './ResultsList'
import { searchRestaurants, getRoute } from '../api'
import MenuModal from './MenuModal'
import RouteCard from './RouteCard'
import SimilarCard from './SimilarCard'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

function Home() {
    const { currentUser } = useAuth()
    const [userProfile, setUserProfile] = useState(null)

    // AI Search states
    const [selectedMood, setSelectedMood] = useState('')
    const [selectedCravings, setSelectedCravings] = useState([])
    const [selectedBudget, setSelectedBudget] = useState('')
    const [optionalDetails, setOptionalDetails] = useState('')

    // Results states
    const [results, setResults] = useState([])
    const [analysis, setAnalysis] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedRestaurant, setSelectedRestaurant] = useState(null)
    const [userLocation, setUserLocation] = useState(null)

    // Route states
    const [selectedRouteRestaurant, setSelectedRouteRestaurant] = useState(null)
    const [routeData, setRouteData] = useState(null)
    const [loadingRoute, setLoadingRoute] = useState(false)

    // Similar states
    const [selectedSimilarItem, setSelectedSimilarItem] = useState(null)

    const moods = [
        { id: 'happy', label: 'Happy', emoji: '😊', color: '#FEF3C7' },
        { id: 'tired', label: 'Tired', emoji: '☕', color: '#FED7AA' },
        { id: 'excited', label: 'Excited', emoji: '⚡', color: '#FBCFE8' },
        { id: 'stressed', label: 'Stressed', emoji: '😰', color: '#DDD6FE' },
        { id: 'energetic', label: 'Energetic', emoji: '🔋', color: '#D1FAE5' },
        { id: 'calm', label: 'Calm', emoji: '🍃', color: '#CFFAFE' },
    ]

    const cravings = [
        { id: 'spicy', label: 'Spicy', emoji: '🌶️', color: '#FEE2E2' },
        { id: 'sweet', label: 'Sweet', emoji: '🍰', color: '#FCE7F3' },
        { id: 'comforting', label: 'Comforting', emoji: '🍕', color: '#FED7AA' },
        { id: 'light', label: 'Light', emoji: '🥗', color: '#D1FAE5' },
        { id: 'savory', label: 'Savory', emoji: '🍖', color: '#FFEDD5' },
        { id: 'fresh', label: 'Fresh', emoji: '❄️', color: '#CFFAFE' },
    ]

    const budgetOptions = [
        { id: 'budget', label: 'Budget', emoji: '💵', color: '#D1FAE5' },
        { id: 'medium', label: 'Medium', emoji: '💰', color: '#DBEAFE' },
        { id: 'premium', label: 'Premium', emoji: '💎', color: '#E0E7FF' },
    ]

    useEffect(() => {
        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    setUserLocation(location);
                    localStorage.setItem('userLocation', JSON.stringify(location));
                },
                (err) => {
                    console.log("Location permission denied or error:", err)
                }
            )
        }
    }, [])

    // Fetch SmartDine ID
    useEffect(() => {
        async function fetchProfile() {
            if (currentUser) {
                try {
                    const { doc, getDoc } = await import('firebase/firestore')
                    const { db } = await import('../firebase')
                    const docSnap = await getDoc(doc(db, "users", currentUser.uid))
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data())
                    }
                } catch (e) {
                    console.error("Profile fetch error:", e)
                }
            }
        }
        fetchProfile()
    }, [currentUser])

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) return "Good Morning ☀️"
        if (hour >= 12 && hour < 17) return "Good Afternoon 🌤️"
        if (hour >= 17 && hour < 21) return "Good Evening 🌇"
        return "Good Night 🌙"
    }

    const toggleCraving = (cravingId) => {
        setSelectedCravings(prev =>
            prev.includes(cravingId)
                ? prev.filter(id => id !== cravingId)
                : [...prev, cravingId]
        )
    }

    const handleSearch = async (e) => {
        e.preventDefault()

        // Build query from mood, cravings, budget, and details
        let queryParts = []
        if (selectedMood) queryParts.push(`Mood: ${selectedMood}`)
        if (selectedCravings.length > 0) queryParts.push(`Cravings: ${selectedCravings.join(', ')}`)
        if (selectedBudget) queryParts.push(`Budget: ${selectedBudget}`)
        if (optionalDetails.trim()) queryParts.push(optionalDetails.trim())

        const finalQuery = queryParts.join(', ')
        if (!finalQuery) {
            setError('Please select at least a mood or craving')
            return
        }

        setLoading(true)
        setError('')
        setResults([])
        setAnalysis('')

        try {
            const data = await searchRestaurants(finalQuery, userLocation, currentUser?.uid)
            setResults(data.results || [])
            setAnalysis(data.analysis || '')

            // Log context information to console
            if (data.context) {
                console.log('═══════════════════════════════════════')
                console.log('🎯 SMARTDINE ANALYSIS CONTEXT')
                console.log('═══════════════════════════════════════')

                if (data.context.time) {
                    console.log('\n⏰ TIME ANALYSIS:')
                    console.log('  Current Time:', data.context.time.current_time)
                    console.log('  Time of Day:', data.context.time.time_of_day)
                    console.log('  Day:', data.context.time.day_of_week)
                    console.log('  Weekend:', data.context.time.is_weekend ? 'Yes' : 'No')
                    console.log('  Season:', data.context.time.season)
                }

                if (data.context.weather) {
                    console.log('\n🌦️ WEATHER ANALYSIS:')
                    console.log('  Condition:', data.context.weather.condition)
                    console.log('  Temperature:', data.context.weather.temperature)
                    console.log('  Feels Like:', data.context.weather.feels_like)
                    console.log('  Description:', data.context.weather.description)
                } else {
                    console.log('\n🌦️ WEATHER: Not available (add OPENWEATHER_API_KEY to .env)')
                }

                if (data.context.user && data.context.user.profile_loaded) {
                    console.log('\n👤 USER BEHAVIOR ANALYSIS:')
                    console.log('  Favorite Cuisines:', data.context.user.favorite_cuisines.join(', '))
                    console.log('  Favorite Restaurants:', data.context.user.favorite_restaurants.join(', '))
                    console.log('  Total Posts:', data.context.user.total_posts)
                    console.log('  Total Likes:', data.context.user.total_likes)
                    console.log('  Total Comments:', data.context.user.total_comments)
                    console.log('  Most Active Time:', data.context.user.most_active_time)
                } else {
                    console.log('\n👤 USER BEHAVIOR: Not analyzed (no posts/likes/comments found)')
                }

                console.log('\n═══════════════════════════════════════\n')
            }
        } catch (err) {
            setError('Failed to fetch results. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getReadyToSearchText = () => {
        const parts = []
        if (selectedMood) parts.push(selectedMood)
        if (selectedCravings.length > 0) parts.push(selectedCravings.join(', '))
        if (selectedBudget) parts.push(selectedBudget)
        if (optionalDetails.trim()) parts.push(optionalDetails.trim())
        return parts.length > 0 ? `Ready to search with: ${parts.join(', ')}` : ''
    }

    const handleSurpriseMe = async () => {
        // Randomly select a mood
        const randomMood = moods[Math.floor(Math.random() * moods.length)]
        setSelectedMood(randomMood.id)

        // Randomly select 2-3 cravings
        const numCravings = Math.floor(Math.random() * 2) + 2 // 2 or 3
        const shuffledCravings = [...cravings].sort(() => Math.random() - 0.5)
        const randomCravings = shuffledCravings.slice(0, numCravings).map(c => c.id)
        setSelectedCravings(randomCravings)

        // Randomly select a budget
        const randomBudget = budgetOptions[Math.floor(Math.random() * budgetOptions.length)]
        setSelectedBudget(randomBudget.id)

        // Clear optional details
        setOptionalDetails('')

        // Build query and search where budget is incorporated
        const queryParts = [randomMood.id, ...randomCravings, randomBudget.id]
        const finalQuery = queryParts.join(', ')

        setLoading(true)
        setError('')
        setResults([])
        setAnalysis('')

        try {
            const data = await searchRestaurants(finalQuery, userLocation)
            setResults(data.results || [])
            setAnalysis(data.analysis || '')
        } catch (err) {
            setError('Failed to fetch results. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDirectionsClick = async (restaurant) => {
        setLoadingRoute(true);
        try {
            const userLocString = localStorage.getItem('userLocation');
            const parsedUserLocation = userLocString ? JSON.parse(userLocString) : null;

            if (!parsedUserLocation) {
                alert('Please enable location services to get directions');
                setLoadingRoute(false);
                return;
            }

            // Get destination coordinates from restaurant
            const destination = {
                lat: restaurant.coordinates?.lat || restaurant.location?.lat || restaurant.lat,
                lon: restaurant.coordinates?.lon || restaurant.location?.lon || restaurant.lon
            };

            // Validate destination
            if (!destination.lat || !destination.lon) {
                console.error('Invalid destination - lat:', destination.lat, 'lon:', destination.lon);
                console.error('Full restaurant:', restaurant);
                alert('Restaurant location not available');
                setLoadingRoute(false);
                return;
            }

            console.log('Getting route from:', parsedUserLocation, 'to:', destination);

            const route = await getRoute(parsedUserLocation, destination);
            setRouteData(route);
            setSelectedRouteRestaurant(restaurant);
        } catch (error) {
            console.error('Failed to load route:', error);
            console.error('Error details:', error.response?.data);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to load route: ${errorMessage}. \n\nCheck if your Backend URL is correct and the server is running.`);
        } finally {
            setLoadingRoute(false);
        }
    }

    const handleSimilarClick = (restaurant) => {
        // Close route card if open
        setSelectedRouteRestaurant(null);
        setRouteData(null);

        // Open similar card
        setSelectedSimilarItem({
            dish: restaurant.suggested_item || restaurant.name,
            restaurantName: restaurant.name
        });
    }

    const handleSimilarDirections = (item) => {
        // Close similar card
        setSelectedSimilarItem(null);

        // Open route card with the selected similar item
        handleDirectionsClick({
            name: item.restaurant_name,
            coordinates: item.coordinates
        });
    }

    const handleMenuClick = (restaurant) => {
        setSelectedRestaurant(restaurant);
    }


    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <TopHeader />

                <div className="content-area">
                    {/* Greeting */}
                    <div className="greeting-section">
                        <h1 className="greeting-title">{getGreeting()} 👋</h1>
                        <p className="greeting-subtitle">
                            Tell us how you're feeling and what you're craving, then let AI find your perfect meal.
                        </p>
                    </div>

                    {/* AI Search Card */}
                    <div className="ai-search-card">
                        <div className="ai-search-header">
                            <div className="ai-icon">🍽️</div>
                            <div>
                                <h2 className="ai-search-title">SmartDine AI Search</h2>
                                <p className="ai-search-subtitle">Complete all steps, then search</p>
                            </div>
                            <button
                                type="button"
                                className="btn-surprise-me"
                                onClick={handleSurpriseMe}
                                disabled={loading}
                            >
                                ✨ Surprise Me
                            </button>
                        </div>

                        <form onSubmit={handleSearch}>
                            {/* Step 1: Mood Selection */}
                            <div className="search-step">
                                <div className="step-header">
                                    <span className="step-number">1</span>
                                    <span className="step-emoji">😊</span>
                                    <span className="step-title">What's your mood?</span>
                                </div>
                                <div className="mood-grid">
                                    {moods.map(mood => (
                                        <button
                                            key={mood.id}
                                            type="button"
                                            className={`mood-btn ${selectedMood === mood.id ? 'selected' : ''}`}
                                            style={{ backgroundColor: mood.color }}
                                            onClick={() => setSelectedMood(mood.id)}
                                        >
                                            <span className="mood-emoji">{mood.emoji}</span>
                                            <span className="mood-label">{mood.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Craving Selection */}
                            <div className="search-step">
                                <div className="step-header">
                                    <span className="step-number">2</span>
                                    <span className="step-emoji">🔥</span>
                                    <span className="step-title">What are you craving?</span>
                                </div>
                                <div className="craving-grid">
                                    {cravings.map(craving => (
                                        <button
                                            key={craving.id}
                                            type="button"
                                            className={`craving-btn ${selectedCravings.includes(craving.id) ? 'selected' : ''}`}
                                            onClick={() => toggleCraving(craving.id)}
                                        >
                                            <span className="craving-emoji">{craving.emoji}</span>
                                            <span className="craving-label">{craving.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3: Budget Selection */}
                            <div className="search-step">
                                <div className="step-header">
                                    <span className="step-number">3</span>
                                    <span className="step-emoji">💰</span>
                                    <span className="step-title">What's your budget?</span>
                                </div>
                                <div className="mood-grid">
                                    {budgetOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            className={`mood-btn ${selectedBudget === option.id ? 'selected' : ''}`}
                                            style={{ backgroundColor: option.color }}
                                            onClick={() => setSelectedBudget(option.id)}
                                        >
                                            <span className="mood-emoji">{option.emoji}</span>
                                            <span className="mood-label">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 4: Optional Details */}
                            <div className="search-step">
                                <div className="step-header">
                                    <span className="step-number">4</span>
                                    <span className="step-emoji">✨</span>
                                    <span className="step-title">Add details (optional)</span>
                                </div>
                                <textarea
                                    className="details-input"
                                    placeholder='Optional: Add more details like "near me", "quick lunch", "romantic dinner"...'
                                    value={optionalDetails}
                                    onChange={(e) => setOptionalDetails(e.target.value)}
                                    rows="3"
                                />
                            </div>

                            {/* Search Button */}
                            <button type="submit" className="search-submit-btn" disabled={loading}>
                                <span className="submit-search-icon">🔍</span>
                                {loading ? 'Searching...' : 'Search with SmartDine AI'}
                            </button>

                            {/* Ready to search text */}
                            {getReadyToSearchText() && (
                                <div className="ready-text">{getReadyToSearchText()}</div>
                            )}
                        </form>

                        {/* AI Understanding */}
                        {analysis && (
                            <div className="ai-understanding">
                                <div className="understanding-header">
                                    <span className="understanding-icon">🧠</span>
                                    <span className="understanding-title">AI Understanding:</span>
                                </div>
                                <p className="understanding-text">{analysis}</p>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && <div className="error-message">{error}</div>}

                    {/* Results Section */}
                    {results.length > 0 && (
                        <div className="results-section">
                            <div className="section-header">
                                <div className="ai-icon">🍽️</div>
                                <div>
                                    <h2 className="section-title">SmartDine AI Pick</h2>
                                    <p className="section-subtitle">Personalized just for you</p>
                                </div>
                            </div>

                            <ResultsList
                                results={results}
                                onSelect={setSelectedRestaurant}
                                onDirectionsClick={handleDirectionsClick}
                                onSimilarClick={handleSimilarClick}
                                onMenuClick={handleMenuClick}
                            />
                        </div>
                    )}
                </div>
            </div>

            {selectedRestaurant && (
                <MenuModal
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                />
            )}

            {selectedRouteRestaurant && routeData && userLocation && (
                <RouteCard
                    restaurant={selectedRouteRestaurant}
                    routeData={routeData}
                    userLocation={userLocation}
                    onClose={() => {
                        setSelectedRouteRestaurant(null);
                        setRouteData(null);
                    }}
                />
            )}

            {selectedSimilarItem && (
                <SimilarCard
                    dish={selectedSimilarItem.dish}
                    restaurantName={selectedSimilarItem.restaurantName}
                    onClose={() => setSelectedSimilarItem(null)}
                    onGetDirections={handleSimilarDirections}
                />
            )}
        </div>
    )
}

export default Home
