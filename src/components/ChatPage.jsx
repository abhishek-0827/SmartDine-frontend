import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getFollowingList } from '../services/FriendsService';
import {
    subscribeToUserChats,
    subscribeToChatMessages,
    sendMessage,
    markChatAsRead
} from '../services/ChatService';
import { useParams, Link } from 'react-router-dom';
import './ChatPage.css';

export default function ChatPage() {
    const { currentUser } = useAuth();
    const { friendId } = useParams();

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const messagesEndRef = useRef(null);

    // Load chats
    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = subscribeToUserChats(
            currentUser.uid,
            async (chatList) => {
                try {
                    const enrichedChats = await Promise.all(chatList.map(async (chat) => {
                        const otherUid = chat.participants.find(uid => uid !== currentUser.uid);
                        const profile = await getUserProfile(otherUid);
                        return { ...chat, otherUser: profile };
                    }));

                    enrichedChats.sort((a, b) => {
                        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
                        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
                        return dateB - dateA;
                    });

                    setChats(enrichedChats);
                    setLoading(false);
                } catch (err) {
                    console.error("Error processing chats:", err);
                    setLoading(false);
                }
            },
            (err) => {
                console.error("Firestore error:", err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Handle active chat
    useEffect(() => {
        if (!currentUser || !friendId) {
            setActiveChatUser(null);
            setMessages([]);
            return;
        }

        // Hide sidebar when chat is selected on mobile
        setShowSidebar(false);


        async function loadActiveChat() {
            try {
                const profile = await getUserProfile(friendId);
                setActiveChatUser(profile);

                await markChatAsRead(currentUser.uid, friendId);

                const unsubscribe = subscribeToChatMessages(currentUser.uid, friendId, (msgs) => {
                    setMessages(msgs);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error("Error loading chat:", err);
            }
        }

        loadActiveChat();
    }, [currentUser, friendId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatUser || sending) return;

        setSending(true);
        try {
            await sendMessage(currentUser.uid, activeChatUser.uid, newMessage.trim());
            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="chat-page">
            {/* Left Sidebar - Conversations List */}
            <div className={`chat-sidebar ${showSidebar ? 'show' : ''}`}>
                <div className="chat-sidebar-header">
                    <h2 className="chat-sidebar-title">Messages</h2>
                    <button
                        className="mobile-close-sidebar-btn"
                        onClick={() => setShowSidebar(false)}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                <div className="chat-search-section">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="chat-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="conversations-list">
                    {loading && <div className="chat-loading">Loading...</div>}

                    {!loading && chats.length === 0 && (
                        <div className="no-conversations">
                            <p>No conversations yet</p>
                        </div>
                    )}

                    {!loading && chats
                        .filter(chat => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const userName = (chat.otherUser.displayName || chat.otherUser.smartdineId || '').toLowerCase();
                            const lastMsg = typeof chat.lastMessage === 'string'
                                ? chat.lastMessage.toLowerCase()
                                : (chat.lastMessage?.text || '').toLowerCase();
                            return userName.includes(query) || lastMsg.includes(query);
                        })
                        .map((chat) => (
                            <Link
                                key={chat.chatId || chat.otherUser?.uid}
                                to={`/chat/${chat.otherUser.uid}`}
                                className={`conversation-item ${activeChatUser?.uid === chat.otherUser.uid ? 'active' : ''}`}
                            >
                                <div className="conversation-avatar">
                                    {chat.otherUser.smartdineId?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-header">
                                        <span className="conversation-name">
                                            {chat.otherUser.displayName || chat.otherUser.smartdineId}
                                        </span>
                                        <span className="conversation-time">
                                            {formatTime(chat.updatedAt)}
                                        </span>
                                    </div>
                                    <div className="conversation-preview">
                                        {typeof chat.lastMessage === 'string' ? chat.lastMessage : (chat.lastMessage?.text || 'Start a conversation')}
                                    </div>
                                </div>
                                {chat.unreadCount?.[currentUser.uid] > 0 && (
                                    <div className="unread-badge">{chat.unreadCount[currentUser.uid]}</div>
                                )}
                            </Link>
                        ))}
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="chat-main">
                {!activeChatUser ? (
                    <>
                        {/* Empty State Header with Menu Button */}
                        <div className="chat-header">
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setShowSidebar(true)}
                                aria-label="Show conversations"
                            >
                                ☰
                            </button>
                            <div className="chat-user-info">
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1F2937' }}>Messages</h3>
                            </div>
                        </div>
                        <div className="chat-empty-state">
                            <div className="empty-icon">💬</div>
                            <p className="empty-text">Select a conversation to start messaging</p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setShowSidebar(true)}
                                aria-label="Show conversations"
                            >
                                ☰
                            </button>
                            <div className="chat-user-info">
                                <div className="chat-user-avatar">
                                    {activeChatUser.smartdineId?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="chat-user-details">
                                    <div className="chat-user-name">
                                        {activeChatUser.displayName || activeChatUser.smartdineId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={msg.id || `msg-${index}`}
                                    className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}
                                >
                                    <div className="message-bubble">
                                        {msg.text}
                                    </div>
                                    <div className="message-time">
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="chat-input-section">
                            <form onSubmit={handleSendMessage} className="chat-input-form">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="chat-message-input"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    className="chat-send-btn"
                                    disabled={sending || !newMessage.trim()}
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
