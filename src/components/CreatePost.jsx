import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/FriendsService';
import { createPost } from '../services/SupabasePostService';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './CreatePost.css';

export default function CreatePost() {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProfile() {
            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
            }
        }
        loadProfile();
    }, [currentUser]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length > 10) {
            setError('Maximum 10 files allowed');
            return;
        }

        const validFiles = selectedFiles.filter(file =>
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );

        if (validFiles.length !== selectedFiles.length) {
            setError('Only images and videos are allowed');
            return;
        }

        setFiles(validFiles);
        setError('');

        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
            await createPost(currentUser.uid, files, caption, tagsArray, location);
            navigate('/feed');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-page">
            <div className="create-post-header">
                <h1 className="create-post-title">Create Post</h1>
            </div>

            {/* Create Post Card */}
            <div className="create-post-card">
                {/* User Info */}
                <div className="create-post-user">
                    <div className="create-user-avatar">
                        {userProfile?.smartdineId?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="create-user-info">
                        <div className="create-user-name">{userProfile?.displayName || userProfile?.smartdineId || 'User'}</div>
                        <div className="create-user-subtitle">Share your dining experience</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Caption Input */}
                    <textarea
                        className="create-caption-input"
                        placeholder="What's on your plate? Share your dining experience..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={4}
                    />

                    {/* Restaurant Location */}
                    <div className="create-location-section">
                        <label className="create-label">Add Restaurant Location</label>
                        <input
                            type="text"
                            className="create-location-input"
                            placeholder="Search restaurants..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Media Upload Buttons */}
                    <div className="create-media-buttons">
                        <label className="media-upload-btn">
                            <span>📷 Add Photo/Video</span>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Upload Area */}
                    <div className="create-upload-area">
                        {previews.length === 0 ? (
                            <div className="upload-placeholder">
                                <div className="upload-icon">🖼️</div>
                                <p className="upload-text">Click to upload or drag and drop</p>
                                <p className="upload-subtext">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        ) : (
                            <div className="preview-grid">
                                {previews.map((preview, index) => (
                                    <div key={index} className="preview-item">
                                        {files[index].type.startsWith('video/') ? (
                                            <video src={preview} controls className="preview-media" />
                                        ) : (
                                            <img src={preview} alt={`Preview ${index + 1}`} className="preview-media" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="remove-preview-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && <div className="create-error">{error}</div>}

                    {/* Action Buttons */}
                    <div className="create-actions">
                        <button
                            type="submit"
                            className="btn-publish"
                            disabled={loading || files.length === 0}
                        >
                            {loading ? '⏳ Publishing...' : '🚀 Publish Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
