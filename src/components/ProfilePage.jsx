import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile, getSocialCounts } from '../services/FriendsService';
import { getFeed, getLikedPosts } from '../services/SupabasePostService';
import PostCard from './PostCard';
import './ProfilePage.css';

export default function ProfilePage() {
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [socialCounts, setSocialCounts] = useState({ followers: 0, following: 0 });
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        location: '',
        favoriteCuisines: '',
        dietaryPreferences: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);

                // Load user's posts
                const userPosts = await getFeed(currentUser.uid);
                const myPosts = userPosts.filter(post => post.user_id === currentUser.uid);
                setPosts(myPosts);

                // Load liked posts
                const liked = await getLikedPosts(currentUser.uid);
                setLikedPosts(liked);



                // Load social counts
                const counts = await getSocialCounts(currentUser.uid);
                setSocialCounts(counts);

                // Initialize edit form
                setEditForm({
                    bio: profile?.bio || '',
                    location: profile?.location || '',
                    favoriteCuisines: profile?.favoriteCuisines?.join(', ') || '',
                    dietaryPreferences: profile?.dietaryPreferences?.join(', ') || ''
                });

                setLoading(false);
            }
        }
        loadProfile();
    }, [currentUser]);

    const handlePostDeleted = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    const handleEditProfile = () => {
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const updates = {
                bio: editForm.bio,
                location: editForm.location,
                favoriteCuisines: editForm.favoriteCuisines
                    ? editForm.favoriteCuisines.split(',').map(c => c.trim()).filter(c => c)
                    : [],
                dietaryPreferences: editForm.dietaryPreferences
                    ? editForm.dietaryPreferences.split(',').map(p => p.trim()).filter(p => p)
                    : []
            };

            await updateUserProfile(currentUser.uid, updates);

            // Reload profile
            const updatedProfile = await getUserProfile(currentUser.uid);
            setUserProfile(updatedProfile);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Profile Header with Gradient */}
            <div className="profile-header-gradient">
                <div className="profile-header-content">
                    <div className="profile-avatar-large">
                        {userProfile?.smartdineId?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name">{userProfile?.displayName || 'User'}</h1>
                        <div className="profile-handle">@{userProfile?.smartdineId || 'user'}</div>
                        <div className="profile-bio">
                            {userProfile?.bio || 'Food enthusiast | Restaurant explorer | Sharing my culinary adventures'}
                        </div>
                        {userProfile?.location && (
                            <div className="profile-location">📍 {userProfile.location}</div>
                        )}
                    </div>
                    <button className="btn-edit-profile" onClick={handleEditProfile}>Edit Profile</button>
                </div>
            </div>

            {/* Stats Section */}
            <div className="profile-stats">
                <div className="stat-item">
                    <div className="stat-number">{posts.length}</div>
                    <div className="stat-label">Posts</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">{socialCounts.followers}</div>
                    <div className="stat-label">Followers</div>
                </div>
                <div className="stat-item">
                    <div className="stat-number">{socialCounts.following}</div>
                    <div className="stat-label">Following</div>
                </div>
            </div>

            {/* Additional Info */}
            {(userProfile?.favoriteCuisines?.length > 0 || userProfile?.dietaryPreferences?.length > 0) && (
                <div className="profile-details">
                    {userProfile?.favoriteCuisines?.length > 0 && (
                        <div className="detail-section">
                            <span className="detail-icon">🍽️</span>
                            <span className="detail-label">Favorite Cuisines:</span>
                            <span className="detail-value">{userProfile.favoriteCuisines.join(', ')}</span>
                        </div>
                    )}
                    {userProfile?.dietaryPreferences?.length > 0 && (
                        <div className="detail-section">
                            <span className="detail-icon">🥗</span>
                            <span className="detail-label">Dietary Preferences:</span>
                            <span className="detail-value">{userProfile.dietaryPreferences.join(', ')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Posts
                </button>
                <button
                    className={`profile-tab ${activeTab === 'liked' ? 'active' : ''}`}
                    onClick={() => setActiveTab('liked')}
                >
                    Liked
                </button>

            </div>

            {/* Content Area */}
            <div className="profile-content">
                {activeTab === 'posts' && (
                    <div className="profile-posts">
                        {posts.length === 0 ? (
                            <div className="no-posts-profile">
                                <p>No posts yet. Share your first dining experience!</p>
                            </div>
                        ) : (
                            <div className="posts-grid-profile">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'liked' && (
                    <div className="profile-liked">
                        {likedPosts.length === 0 ? (
                            <div className="no-posts-profile">
                                <p>No liked posts yet. Start exploring and like posts you enjoy!</p>
                            </div>
                        ) : (
                            <div className="posts-grid-profile">
                                {likedPosts.map(post => (
                                    <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
                                ))}
                            </div>
                        )}
                    </div>
                )}


            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Profile</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows="3"
                                    maxLength="200"
                                />
                                <span className="char-count">{editForm.bio.length}/200</span>
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="e.g., New York, NY"
                                />
                            </div>
                            <div className="form-group">
                                <label>Favorite Cuisines</label>
                                <input
                                    type="text"
                                    value={editForm.favoriteCuisines}
                                    onChange={(e) => setEditForm({ ...editForm, favoriteCuisines: e.target.value })}
                                    placeholder="e.g., Italian, Japanese, Mexican (comma-separated)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Dietary Preferences</label>
                                <input
                                    type="text"
                                    value={editForm.dietaryPreferences}
                                    onChange={(e) => setEditForm({ ...editForm, dietaryPreferences: e.target.value })}
                                    placeholder="e.g., Vegetarian, Gluten-free (comma-separated)"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
