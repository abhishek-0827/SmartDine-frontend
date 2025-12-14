import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toggleLike, deletePost, addComment } from '../services/SupabasePostService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './PostCard.css';

export default function PostCard({ post, onPostDeleted }) {
    const [userData, setUserData] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.liked_by?.length || 0);
    const [comments, setComments] = useState(post.comments || []);
    const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadUserData();
        setIsLiked(post.liked_by?.includes(currentUser.uid) || false);
    }, [post.user_id]);

    const loadUserData = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', post.user_id));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleLike = async () => {
        try {
            const newLikedState = await toggleLike(post.id, currentUser.uid);
            setIsLiked(newLikedState);
            setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || submittingComment) return;

        setSubmittingComment(true);
        try {
            const newComment = await addComment(post.id, currentUser.uid, commentText.trim());
            setComments(prev => [...prev, newComment]);
            setCommentText('');
            setCommentsCount(prev => prev + 1);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        } finally {
            setSubmittingComment(false);
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === post.media_urls.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? post.media_urls.length - 1 : prev - 1
        );
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };


    const handleDelete = async () => {
        console.log('🔴 DELETE BUTTON CLICKED - Starting delete process');
        console.log('Post ID:', post.id);
        console.log('Current User ID:', currentUser?.uid);
        console.log('Post User ID:', post.user_id);

        setShowDeleteConfirm(true);
        setShowMenu(false);
    };

    const confirmDelete = async () => {
        console.log('✅ User confirmed deletion - Proceeding...');
        setShowDeleteConfirm(false);
        setDeleting(true);

        try {
            console.log('📞 Calling deletePost function...');
            await deletePost(post.id, currentUser.uid);
            console.log('✅ deletePost completed successfully');

            if (onPostDeleted) {
                console.log('📢 Calling onPostDeleted callback');
                onPostDeleted(post.id);
            } else {
                console.log('⚠️ No onPostDeleted callback provided');
            }

            alert('Post deleted successfully!');
        } catch (error) {
            console.error('❌ ERROR in handleDelete:', error);
            console.error('Error details:', error.message);
            alert('Failed to delete post: ' + error.message);
        } finally {
            console.log('🏁 Delete process finished');
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        console.log('❌ User cancelled deletion');
        setShowDeleteConfirm(false);
    };



    const isOwnPost = currentUser.uid === post.user_id;

    return (
        <div className="new-post-card">
            <div className="new-post-header">
                <div className="post-user-info">
                    <div className="post-user-avatar">
                        {userData?.smartdineId?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="post-user-details">
                        <div className="post-user-name">{userData?.displayName || userData?.smartdineId || 'User'}</div>
                        <div className="post-user-handle">@{userData?.smartdineId || 'user'}  {formatTimeAgo(post.created_at)}</div>
                    </div>
                </div>
                {isOwnPost && (
                    <div className="post-menu-container">
                        <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}></button>
                        {showMenu && (
                            <div className="post-menu-dropdown">
                                <button onClick={handleDelete} className="menu-item delete" disabled={deleting}>
                                    {deleting ? ' Deleting...' : ' Delete Post'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {post.caption && (<div className="new-post-caption">{post.caption}</div>)}
            {post.location && (
                <div className="restaurant-tag">
                    <span className="restaurant-icon"></span>
                    <span className="restaurant-name">{post.location}</span>
                </div>
            )}
            <div className="new-post-media">
                {post.type === 'video' ? (<video src={post.media_urls[0]} controls />) : (
                    <>
                        <img src={post.media_urls[currentImageIndex]} alt="Post" />
                        {post.media_urls.length > 1 && (
                            <>
                                <button onClick={prevImage} className="media-nav-btn prev">◀</button>
                                <button onClick={nextImage} className="media-nav-btn next">▶</button>
                                <div className="media-indicator">{currentImageIndex + 1} / {post.media_urls.length}</div>
                            </>
                        )}
                    </>
                )}
            </div>
            <div className="new-post-actions">
                <button onClick={handleLike} className={`action-icon-btn ${isLiked ? 'liked' : ''}`} title="Like">{isLiked ? '❤️' : '🤍'}</button>
                <button className="action-icon-btn" onClick={() => setShowCommentInput(!showCommentInput)} title="Comment">💬</button>
            </div>
            <div className="post-stats">
                <span className="stat-item">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                <span className="stat-item">{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
            </div>
            {
                showCommentInput && (
                    <form onSubmit={handleCommentSubmit} className="comment-input-section">
                        <div className="comment-user-avatar">{currentUser?.email?.[0]?.toUpperCase() || 'U'}</div>
                        <input type="text" placeholder="Add a comment..." className="comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} disabled={submittingComment} />
                        <button type="submit" className="comment-submit-btn" disabled={!commentText.trim() || submittingComment}>
                            {submittingComment ? '...' : <img src="/send-icon.png" alt="Send" className="send-icon" />}
                        </button>
                    </form>
                )
            }
            {
                comments.length > 0 && (
                    <div className="comments-list">
                        {comments.slice(-3).map((comment, index) => (<CommentItem key={index} comment={comment} />))}
                        {comments.length > 3 && (<button className="view-all-comments" onClick={() => setShowCommentInput(true)}>View all {comments.length} comments</button>)}
                    </div>
                )
            }
            {
                post.tags && post.tags.length > 0 && (
                    <div className="new-post-tags">
                        {post.tags.map((tag, i) => (<span key={i} className="new-tag">#{tag}</span>))}
                    </div>
                )
            }
            {/* Delete Confirmation Dialog */}
            {
                showDeleteConfirm && (
                    <div className="delete-confirm-overlay" onClick={cancelDelete}>
                        <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                            <h3>Delete Post?</h3>
                            <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                            <div className="delete-confirm-actions">
                                <button onClick={cancelDelete} className="btn-cancel">Cancel</button>
                                <button onClick={confirmDelete} className="btn-delete" disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function CommentItem({ comment }) {
    const [commentUserData, setCommentUserData] = useState(null);
    useEffect(() => { loadCommentUser(); }, [comment.userId]);
    const loadCommentUser = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', comment.userId));
            if (userDoc.exists()) { setCommentUserData(userDoc.data()); }
        } catch (error) { console.error('Error loading comment user:', error); }
    };
    return (
        <div className="comment-item">
            <div className="comment-avatar">{commentUserData?.smartdineId?.[0]?.toUpperCase() || 'U'}</div>
            <div className="comment-content">
                <span className="comment-username">{commentUserData?.displayName || commentUserData?.smartdineId || 'User'}</span>
                <span className="comment-text">{comment.text}</span>
            </div>
        </div>
    );
}
