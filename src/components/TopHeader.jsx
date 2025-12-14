import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './TopHeader.css';

export default function TopHeader() {
    const { currentUser, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="top-header">
            <div className="mobile-username">
                {currentUser?.email?.split('@')[0] || 'User'}
            </div>
            <div className="header-actions">
                <div className="header-profile" onClick={() => setShowDropdown(!showDropdown)}>
                    <div className="profile-avatar">
                        {currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {showDropdown && (
                        <div className="profile-dropdown">
                            <div className="dropdown-item">{currentUser?.email}</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item" onClick={handleLogout}>
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
