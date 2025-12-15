import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats } from '../services/ChatService';
import './TopHeader.css';

export default function TopHeader() {
    const { currentUser, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = subscribeToUserChats(
            currentUser.uid,
            (chatList) => {
                // Calculate total unread messages for current user
                const total = chatList.reduce((sum, chat) => {
                    return sum + (chat.unreadCount?.[currentUser.uid] || 0);
                }, 0);
                setTotalUnreadCount(total);
            },
            (err) => console.error('Error loading chats:', err)
        );

        return () => unsubscribe();
    }, [currentUser]);

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
                <Link to="/chat" className="header-messages-btn">
                    <span className="messages-icon">💬</span>
                    {totalUnreadCount > 0 && (
                        <span className="messages-badge">{totalUnreadCount}</span>
                    )}
                </Link>
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
