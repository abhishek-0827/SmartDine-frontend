import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats } from '../services/ChatService';
import { getPendingRequests } from '../services/FriendsService';
import './Sidebar.css';

export default function Sidebar() {
    const location = useLocation();
    const { currentUser } = useAuth();
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [friendRequestCount, setFriendRequestCount] = useState(0);

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

    // Load friend requests count
    useEffect(() => {
        if (!currentUser) return;

        async function loadRequestCount() {
            const requests = await getPendingRequests(currentUser.uid);
            setFriendRequestCount(requests.length);
        }

        loadRequestCount();

        // Refresh count every 10 seconds to stay in sync
        const interval = setInterval(loadRequestCount, 10000);

        return () => clearInterval(interval);
    }, [currentUser]);

    const menuItems = [
        { path: '/home', icon: '🏠', label: 'Home' },
        { path: '/discover', icon: '🔍', label: 'Discover' },
        { path: '/create-post', icon: '➕', label: 'Create' },
        { path: '/feed', icon: '📱', label: 'Feed' },
        { path: '/friends', icon: '👥', label: 'Friends', badge: friendRequestCount },
        { path: '/chat', icon: '💬', label: 'Messages', badge: totalUnreadCount },
    ];

    const bottomItems = [
        { path: '/profile', icon: '👤', label: 'Profile' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🍽️</div>
                <span className="logo-text">SmartDine</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path + item.label}
                        to={item.path}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                        {item.badge > 0 && (
                            <span className="sidebar-badge">{item.badge}</span>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-bottom">
                {bottomItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
