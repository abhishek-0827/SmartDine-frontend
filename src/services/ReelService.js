import { db, storage } from '../firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { uploadToStorage } from './PostService';

// Generate unique ID
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate thumbnail from video
export async function generateThumbnail(videoFile) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            // Seek to 1 second
            video.currentTime = 1;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.8);
        };

        video.src = URL.createObjectURL(videoFile);
    });
}

// Validate video duration (FREE TIER: max 30 seconds)
export async function validateVideo(videoFile) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            if (video.duration > 30) {
                reject(new Error('Video must be 30 seconds or less'));
            } else if (videoFile.size > 10 * 1024 * 1024) {
                reject(new Error('Video size must be less than 10MB'));
            } else {
                resolve(true);
            }
        };

        video.onerror = () => {
            reject(new Error('Invalid video file'));
        };

        video.src = URL.createObjectURL(videoFile);
    });
}

// Create a new reel
export async function createReel(userId, videoFile, caption, musicTrack = '') {
    try {
        // Validate video
        await validateVideo(videoFile);

        const reelId = generateId();

        // Upload video
        const videoPath = `reels/${userId}/${reelId}/video.mp4`;
        const videoUrl = await uploadToStorage(videoPath, videoFile);

        // Generate and upload thumbnail
        const thumbnailFile = await generateThumbnail(videoFile);
        const thumbnailPath = `reels/${userId}/${reelId}/thumbnail.jpg`;
        const thumbnailUrl = await uploadToStorage(thumbnailPath, thumbnailFile);

        // Get video duration
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });
        const duration = Math.round(video.duration);

        // Save to Firestore
        await setDoc(doc(db, 'reels', reelId), {
            userId,
            videoUrl,
            thumbnailUrl,
            caption,
            musicTrack,
            duration,
            createdAt: serverTimestamp(),
            likesCount: 0,
            commentsCount: 0,
            likedBy: []
        });

        console.log('✅ Reel created:', reelId);
        return reelId;
    } catch (error) {
        console.error('Error creating reel:', error);
        throw error;
    }
}

// Get user's reels
export async function getUserReels(userId) {
    try {
        const reelsRef = collection(db, 'reels');
        const q = query(
            reelsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        const reels = [];

        snapshot.forEach(doc => {
            reels.push({ id: doc.id, ...doc.data() });
        });

        return reels;
    } catch (error) {
        console.error('Error fetching reels:', error);
        return [];
    }
}

// Get reels feed
export async function getReelsFeed(userId) {
    try {
        // Get user's friends
        const userDoc = await getDoc(doc(db, 'users', userId));
        const friends = userDoc.data()?.friends || [];

        const userIds = [userId, ...friends];

        const reelsRef = collection(db, 'reels');
        const q = query(
            reelsRef,
            where('userId', 'in', userIds.slice(0, 10)),
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const snapshot = await getDocs(q);
        const reels = [];

        snapshot.forEach(doc => {
            reels.push({ id: doc.id, ...doc.data() });
        });

        return reels;
    } catch (error) {
        console.error('Error fetching reels feed:', error);
        return [];
    }
}

// Like/Unlike a reel
export async function toggleReelLike(reelId, userId) {
    try {
        const reelRef = doc(db, 'reels', reelId);
        const reelDoc = await getDoc(reelRef);

        if (!reelDoc.exists()) {
            throw new Error('Reel not found');
        }

        const likedBy = reelDoc.data().likedBy || [];
        const isLiked = likedBy.includes(userId);

        if (isLiked) {
            await updateDoc(reelRef, {
                likesCount: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            await updateDoc(reelRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
        }

        return !isLiked;
    } catch (error) {
        console.error('Error toggling reel like:', error);
        throw error;
    }
}
