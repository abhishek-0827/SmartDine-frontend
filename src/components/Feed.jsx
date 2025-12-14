import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFeed } from '../services/SupabasePostService';
import PostCard from './PostCard';
import './Feed.css';

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        setLoading(true);
        try {
            const feedPosts = await getFeed(currentUser.uid);
            setPosts(feedPosts);
        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostDeleted = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    if (loading) {
        return (
            <div className="feed-page">
                <div className="feed-loading">Loading feed...</div>
            </div>
        );
    }

    return (
        <div className="feed-page">
            <div className="feed-page-header">
                <h1 className="feed-page-title">Social Feed</h1>
                <p className="feed-page-subtitle">See what your friends are dining</p>
            </div>

            <div className="feed-posts-container">
                {posts.length === 0 ? (
                    <div className="no-posts">
                        <p>No posts yet. Follow friends to see their posts!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
                    ))
                )}
            </div>
        </div>
    );
}
