import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to fix map sizing issues
function MapUpdater({ bounds }) {
    const map = useMap();

    useEffect(() => {
        // Force a resize calculation when the component mounts
        const resizeMap = () => {
            map.invalidateSize();
            if (bounds) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        // Immediate adjustment
        resizeMap();

        // Delayed adjustment for animations
        const timeoutId = setTimeout(resizeMap, 300);
        const timeoutId2 = setTimeout(resizeMap, 800);

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
        };
    }, [map, bounds]);

    return null;
}

// Custom icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const restaurantIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function RouteMap({ origin, destination, routeData, restaurantName, onClose, isEmbedded = false }) {
    if (!origin || !destination || !routeData) {
        if (isEmbedded) return <div className="loading-map">Loading route...</div>;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}>
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <p>Loading route...</p>
                    <button onClick={onClose} style={{
                        marginTop: '15px',
                        padding: '8px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}>Close</button>
                </div>
            </div>
        );
    }

    // Convert GeoJSON coordinates to Leaflet format [lat, lon]
    const routeCoordinates = routeData.route_geojson.coordinates.map(coord => [coord[1], coord[0]]);

    // Calculate bounds to fit the entire route
    const bounds = [
        [origin.lat, origin.lon],
        [destination.lat, destination.lon]
    ];

    const handleClose = (e) => {
        e.stopPropagation();
        onClose();
    };

    // Render Clean Map (Embedded Mode)
    if (isEmbedded) {
        return (
            <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                <MapContainer
                    bounds={bounds}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={false} // Cleaner on mobile
                >
                    <MapUpdater bounds={bounds} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[origin.lat, origin.lon]} icon={userIcon}>
                        <Popup><strong>Your Location</strong></Popup>
                    </Marker>
                    <Marker position={[destination.lat, destination.lon]} icon={restaurantIcon}>
                        <Popup><strong>{restaurantName}</strong></Popup>
                    </Marker>
                    <Polyline
                        positions={routeCoordinates}
                        color="#667eea"
                        weight={4}
                        opacity={0.8}
                    />
                </MapContainer>
            </div>
        );
    }

    // Render Full Modal Map (Standalone Mode)
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header - Fixed at top */}
            <div style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10001
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Route to {restaurantName}</h3>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>
                        {routeData.distance_km} km • {routeData.duration_min} min drive
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '1.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Info Bar - Fixed below header */}
            <div style={{
                padding: '16px 24px',
                background: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10001
            }}>
                <div style={{ display: 'flex', gap: '40px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px', fontWeight: '600' }}>Distance</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1F2937' }}>
                            {routeData.distance_km} km
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px', fontWeight: '600' }}>Duration</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1F2937' }}>
                            {routeData.duration_min} min
                        </div>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '0.9rem',
                    color: '#6B7280'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#3B82F6', borderRadius: '50%' }} />
                        Your Location
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '50%' }} />
                        Restaurant
                    </div>
                </div>
            </div>

            {/* Map - Fills remaining space */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer
                    bounds={bounds}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <MapUpdater bounds={bounds} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[origin.lat, origin.lon]} icon={userIcon}>
                        <Popup><strong>Your Location</strong></Popup>
                    </Marker>
                    <Marker position={[destination.lat, destination.lon]} icon={restaurantIcon}>
                        <Popup><strong>{restaurantName}</strong></Popup>
                    </Marker>
                    <Polyline
                        positions={routeCoordinates}
                        color="#667eea"
                        weight={4}
                        opacity={0.8}
                    />
                </MapContainer>
            </div>
        </div>
    );
}
