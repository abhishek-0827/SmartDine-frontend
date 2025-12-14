import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import {
    searchUserById,
    followUser,
    unfollowUser,
    checkFollowStatus,
    getSocialCounts,
    getFollowersList,
    getFollowingList,
    getPendingRequests,
    acceptFollowRequest,
    rejectFollowRequest,
    getMutualFriendsCount
} from '../services/FriendsService';
import './FriendsPage.css';

// Component to handle follower actions (Follow Back or Message)
function FollowerActions({ user, currentUserId, onFollow, loading }) {
    const [isFollowingBack, setIsFollowingBack] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        async function checkIfFollowingBack() {
            const status = await checkFollowStatus(currentUserId, user.uid || user.id);
            setIsFollowingBack(status === 'accepted');
            setIsPending(status === 'pending');
            setCheckingStatus(false);
        }
        checkIfFollowingBack();
    }, [currentUserId, user]);

    const handleFollowBack = async () => {
        setIsPending(true);
        await onFollow(user.uid);
    };

    if (checkingStatus) {
        return <span className="checking-status">...</span>;
    }

    if (isFollowingBack) {
        // Already following back - show Message button
        return (
            <Link to={`/chat/${user.uid}`} className="btn-message">
                💬 Message
            </Link>
        );
    } else if (isPending) {
        // Request sent - show Requested button
        return (
            <button className="btn-pending" disabled>
                Requested
            </button>
        );
    } else {
        // Not following back - show Follow Back button
        return (
            <button onClick={handleFollowBack} className="btn-follow" disabled={loading}>
                Follow Back
            </button>
        );
    }
}

export default function FriendsPage() {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [followStatusMap, setFollowStatusMap] = useState({});
    const [counts, setCounts] = useState({ followers: 0, following: 0 });
    const [activeTab, setActiveTab] = useState('following');
    const [listData, setListData] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [mutualCounts, setMutualCounts] = useState({});

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        });

        loadStats();
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        loadList(activeTab);
    }, [currentUser, activeTab]);

    async function loadStats() {
        if (!currentUser) return;
        const c = await getSocialCounts(currentUser.uid);
        setCounts(c);
    }

    async function loadList(type) {
        if (!currentUser) return;
        setLoading(true);
        setListData([]);
        setMutualCounts({});

        let data = [];
        if (type === 'following') {
            data = await getFollowingList(currentUser.uid);
        } else if (type === 'followers') {
            data = await getFollowersList(currentUser.uid);
        } else if (type === 'suggestions') {
            // Show friends of friends (like Instagram)
            // Get people your friends follow, but you don't follow yet
            const myFollowing = await getFollowingList(currentUser.uid);
            const myFollowingIds = new Set(myFollowing.map(f => f.id));

            // Get all people followed by my friends
            const friendsOfFriends = new Set();
            const friendsOfFriendsData = [];

            for (const friend of myFollowing) {
                const theirFollowing = await getFollowingList(friend.id);
                for (const person of theirFollowing) {
                    // Add if not already my friend and not myself
                    if (!myFollowingIds.has(person.id) && person.id !== currentUser.uid) {
                        if (!friendsOfFriends.has(person.id)) {
                            friendsOfFriends.add(person.id);
                            friendsOfFriendsData.push(person);
                        }
                    }
                }
            }

            data = friendsOfFriendsData;
        } else if (type === 'requests') {
            data = await getPendingRequests(currentUser.uid);
        }

        // Always update request count for badge
        const requests = await getPendingRequests(currentUser.uid);
        setRequestCount(requests.length);

        // Calculate mutual friends and check follow status for suggestions
        if (data.length > 0) {
            const mutuals = {};
            const statuses = {};

            for (const user of data) {
                const count = await getMutualFriendsCount(currentUser.uid, user.id);
                mutuals[user.id] = count;

                // For suggestions, we also need to know if we already requested them
                if (type === 'suggestions') {
                    const status = await checkFollowStatus(currentUser.uid, user.id);
                    statuses[user.id] = status || 'none';
                }
            }
            setMutualCounts(mutuals);
            if (type === 'suggestions') {
                setFollowStatusMap(statuses);
            }
        }

        setListData(data);
        setLoading(false);
    }

    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim()) {
                performSearch(searchTerm);
            } else {
                setSearchResults([]);
                setFollowStatusMap({});
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    async function performSearch(term) {
        setLoading(true);
        setError('');
        setSearchResults([]);
        setFollowStatusMap({});

        try {
            const users = await searchUserById(term);

            // Filter out current user from results
            const filteredUsers = (users || []).filter(u => u.uid !== currentUser.uid);

            if (filteredUsers.length > 0) {
                setSearchResults(filteredUsers);

                // Check follow status and mutuals for all results
                const statuses = {};
                const mutuals = {};

                for (const user of filteredUsers) {
                    const status = await checkFollowStatus(currentUser.uid, user.uid || user.id);
                    statuses[user.uid || user.id] = status || 'none';

                    const mutualCount = await getMutualFriendsCount(currentUser.uid, user.id);
                    mutuals[user.id] = mutualCount;
                }

                setFollowStatusMap(statuses);
                setMutualCounts(prev => ({ ...prev, ...mutuals }));
            }
        } catch (err) {
            setError('Error searching user');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Handle form submit (prevent default only)
    function handleSearchSubmit(e) {
        e.preventDefault();
    }

    async function handleFollow(targetUid) {
        console.log('handleFollow called with:', targetUid);

        // If targetUid is an object (user was passed instead of uid), extract the id
        if (typeof targetUid === 'object' && targetUid !== null) {
            console.log('User object received:', targetUid);
            targetUid = targetUid.uid || targetUid.id;
        }

        if (!targetUid || typeof targetUid !== 'string') {
            console.error('Invalid targetUid after extraction:', targetUid);
            setError('Unable to send follow request');
            return;
        }

        setLoading(true);
        try {
            await followUser(currentUser.uid, targetUid);

            // Update local status map
            setFollowStatusMap(prev => ({
                ...prev,
                [targetUid]: 'pending'
            }));

            setActionMsg('Follow request sent!');
            setTimeout(() => setActionMsg(''), 3000);
            await loadStats();
            await loadList(activeTab);
        } catch (err) {
            setError('Error sending follow request');
        } finally {
            setLoading(false);
        }
    }

    async function handleUnfollow(targetUid) {
        setLoading(true);
        try {
            await unfollowUser(currentUser.uid, targetUid);
            setActionMsg('Unfollowed successfully');
            setTimeout(() => setActionMsg(''), 3000);
            await loadStats();
            await loadList(activeTab);

            // Update local status map
            setFollowStatusMap(prev => ({
                ...prev,
                [targetUid]: 'none'
            }));
        } catch (err) {
            setError('Error unfollowing');
        } finally {
            setLoading(false);
        }
    }

    async function handleAcceptRequest(requesterUid) {
        setLoading(true);
        try {
            await acceptFollowRequest(currentUser.uid, requesterUid);
            setActionMsg('Request accepted!');
            setTimeout(() => setActionMsg(''), 3000);
            await loadStats();
            await loadList('requests');
        } catch (err) {
            setError('Error accepting request');
        } finally {
            setLoading(false);
        }
    }

    async function handleRejectRequest(requesterUid) {
        setLoading(true);
        try {
            await rejectFollowRequest(currentUser.uid, requesterUid);
            setActionMsg('Request rejected');
            setTimeout(() => setActionMsg(''), 3000);
            await loadList('requests');
        } catch (err) {
            setError('Error rejecting request');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="friends-page">
            <div className="friends-page-header">
                <h1 className="friends-page-title">Friends & Connections</h1>
            </div>

            {/* Search Bar */}
            <div className="friends-search-section">
                <form onSubmit={handleSearchSubmit} className="friends-search-form">
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="friends-search-input"
                    />
                </form>
            </div>

            {/* Content Switch: Show Search Results OR Tabs/List */}
            {searchTerm.trim() ? (
                // --- SEARCH RESULTS MODE ---
                <div className="search-result-section">
                    <h3 className="section-title">Search Results</h3>
                    {loading && <div className="friends-loading">Searching...</div>}

                    {!loading && searchResults.length === 0 && (
                        <div className="no-friends">No users found matching "{searchTerm}"</div>
                    )}

                    <div className="friends-grid">
                        {searchResults.map(result => (
                            <div key={result.uid || result.id} className="friend-card">
                                <div className="friend-info">
                                    <div className="friend-avatar">
                                        {result.smartdineId?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="friend-details">
                                        <div className="friend-name">{result.displayName || result.smartdineId}</div>
                                        <div className="friend-handle">@{result.smartdineId}</div>
                                        <div className="friend-mutual">
                                            {mutualCounts[result.id] !== undefined
                                                ? `${mutualCounts[result.id]} mutual friend${mutualCounts[result.id] !== 1 ? 's' : ''}`
                                                : 'Loading...'}
                                        </div>
                                    </div>
                                </div>
                                <div className="friend-actions">
                                    {(!followStatusMap[result.uid || result.id] || followStatusMap[result.uid || result.id] === 'none') && (
                                        <button onClick={() => handleFollow(result.uid || result.id)} className="btn-follow" disabled={loading}>
                                            Follow
                                        </button>
                                    )}
                                    {followStatusMap[result.uid || result.id] === 'pending' && (
                                        <button className="btn-pending" disabled>
                                            Requested
                                        </button>
                                    )}
                                    {followStatusMap[result.uid || result.id] === 'accepted' && (
                                        <>
                                            <Link to={`/chat/${result.uid || result.id}`} className="btn-message">
                                                💬 Message
                                            </Link>
                                            <button onClick={() => handleUnfollow(result.uid || result.id)} className="btn-unfollow" disabled={loading}>
                                                Unfollow
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // --- NORMAL TABS MODE ---
                <>
                    {/* Tabs */}
                    <div className="friends-tabs">
                        <button
                            className={`friends-tab ${activeTab === 'following' ? 'active' : ''}`}
                            onClick={() => setActiveTab('following')}
                        >
                            Following
                        </button>
                        <button
                            className={`friends-tab ${activeTab === 'followers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('followers')}
                        >
                            Followers
                        </button>
                        <button
                            className={`friends-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('suggestions')}
                        >
                            Suggestions
                        </button>
                        <button
                            className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('requests')}
                        >
                            Requests
                            {requestCount > 0 && activeTab !== 'requests' && (
                                <span className="tab-badge">{requestCount}</span>
                            )}
                        </button>
                    </div>

                    {/* Messages */}
                    {error && <div className="friends-error">{error}</div>}
                    {actionMsg && <div className="friends-success">{actionMsg}</div>}

                    {/* Friends List */}
                    <div className="friends-list-section">
                        {loading && <div className="friends-loading">Loading...</div>}

                        {!loading && listData.length === 0 && (
                            <div className="no-friends">
                                {activeTab === 'following' && <p>No following yet. Search and follow people!</p>}
                                {activeTab === 'followers' && <p>No followers yet.</p>}
                                {activeTab === 'suggestions' && <p>No suggestions available.</p>}
                                {activeTab === 'requests' && <p>No pending requests.</p>}
                            </div>
                        )}

                        {!loading && listData.length > 0 && (
                            <div className="friends-grid">
                                {listData.map((user) => (
                                    <div key={user.uid} className="friend-card">
                                        <div className="friend-info">
                                            <div className="friend-avatar">
                                                {user.smartdineId?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="friend-details">
                                                <div className="friend-name">{user.displayName || user.smartdineId}</div>
                                                <div className="friend-handle">@{user.smartdineId}</div>
                                                <div className="friend-mutual">
                                                    {mutualCounts[user.id] !== undefined
                                                        ? `${mutualCounts[user.id]} mutual friend${mutualCounts[user.id] !== 1 ? 's' : ''}`
                                                        : 'Loading...'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="friend-actions">
                                            {activeTab === 'following' && (
                                                <>
                                                    <Link to={`/chat/${user.uid}`} className="btn-message">
                                                        💬 Message
                                                    </Link>
                                                    <button onClick={() => handleUnfollow(user.uid)} className="btn-unfollow" disabled={loading}>
                                                        Unfollow
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'followers' && (
                                                <FollowerActions user={user} currentUserId={currentUser.uid} onFollow={handleFollow} loading={loading} />
                                            )}
                                            {activeTab === 'suggestions' && (
                                                <>
                                                    {followStatusMap[user.uid || user.id] === 'pending' ? (
                                                        <button className="btn-pending" disabled>
                                                            Requested
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleFollow(user.uid)} className="btn-follow" disabled={loading}>
                                                            Follow
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {activeTab === 'requests' && (
                                                <>
                                                    <button onClick={() => handleAcceptRequest(user.uid)} className="btn-accept" disabled={loading}>
                                                        Accept
                                                    </button>
                                                    <button onClick={() => handleRejectRequest(user.uid)} className="btn-reject" disabled={loading}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
