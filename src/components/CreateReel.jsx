import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReel } from '../services/ReelService';
import { useNavigate } from 'react-router-dom';
import './CreatePost.css';

const MUSIC_TRACKS = [
    { id: 'none', name: 'No Music' },
    { id: 'track1', name: 'Upbeat Pop' },
    { id: 'track2', name: 'Chill Vibes' },
    { id: 'track3', name: 'Electronic' },
];

export default function CreateReel() {
    const [videoFile, setVideoFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [caption, setCaption] = useState('');
    const [musicTrack, setMusicTrack] = useState('none');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError('Please select a video file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Video must be less than 10MB');
            return;
        }

        setVideoFile(file);
        setPreview(URL.createObjectURL(file));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!videoFile) {
            setError('Please select a video');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await createReel(currentUser.uid, videoFile, caption, musicTrack);
            navigate('/feed');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-container">
            <div className="create-post-header">
                <button onClick={() => navigate('/feed')} className="btn-back">
                    ← Back
                </button>
                <h2>Create Reel</h2>
            </div>

            <form onSubmit={handleSubmit} className="create-post-form">
                <div className="upload-section">
                    <label htmlFor="video-upload" className="upload-label">
                        {!videoFile ? (
                            <>
                                <div className="upload-icon">🎥</div>
                                <p>Click to upload video</p>
                                <p className="upload-hint">Max 30 seconds, 10MB</p>
                            </>
                        ) : (
                            <div className="preview-grid">
                                <div className="preview-item">
                                    <video src={preview} controls />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVideoFile(null);
                                            setPreview('');
                                        }}
                                        className="btn-remove"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </label>
                    <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="form-group">
                    <label>Caption</label>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption..."
                        rows="3"
                        maxLength="200"
                    />
                </div>

                <div className="form-group">
                    <label>Music Track</label>
                    <select
                        value={musicTrack}
                        onChange={(e) => setMusicTrack(e.target.value)}
                    >
                        {MUSIC_TRACKS.map(track => (
                            <option key={track.id} value={track.id}>
                                {track.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading || !videoFile}
                >
                    {loading ? 'Uploading...' : 'Post Reel'}
                </button>
            </form>
        </div>
    );
}
