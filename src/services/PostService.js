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

// Generate unique ID
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Compress image before upload (FREE TIER OPTIMIZATION)
async function compressImage(file, maxSizeMB = 1) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                const maxDimension = 1200;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Upload file to Firebase Storage
async function uploadToStorage(path, file) {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
}

// Create a new post
export async function createPost(userId, files, caption, tags = [], location = '') {
    try {
        // FREE TIER: Limit to 3 images max
        if (files.length > 3) {
            throw new Error('Maximum 3 images allowed');
        }

        const postId = generateId();
        const mediaUrls = [];

        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check file size (max 100MB per file)
            if (file.size > 100 * 1024 * 1024) {
                throw new Error('File size must be less than 100MB');
            }

            let uploadFile = file;

            // Compress images
            if (file.type.startsWith('image/')) {
                console.log('Compressing image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
                uploadFile = await compressImage(file);
                console.log('Compressed size:', (uploadFile.size / 1024 / 1024).toFixed(2), 'MB');
            }

            const path = `posts/${userId}/${postId}/${file.name}`;
            const url = await uploadToStorage(path, uploadFile);
            mediaUrls.push(url);
        }

        // Determine post type
        const type = files[0].type.startsWith('video/') ? 'video' : 'image';

        // Save to Firestore
        await setDoc(doc(db, 'posts', postId), {
            userId,
            type,
            mediaUrls,
            caption,
            tags,
            location,
            createdAt: serverTimestamp(),
            likesCount: 0,
            commentsCount: 0,
            likedBy: []
        });

        console.log('✅ Post created:', postId);
        return postId;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}

// Get user's posts
export async function getUserPosts(userId) {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(20) // FREE TIER: Limit queries
        );

        const snapshot = await getDocs(q);
        const posts = [];

        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        return posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

// Get feed (user + friends posts)
export async function getFeed(userId) {
    try {
        console.log('getFeed called for userId:', userId);

        // Get user's friends
        const userDoc = await getDoc(doc(db, 'users', userId));
        console.log('User doc exists:', userDoc.exists());

        const friends = userDoc.data()?.friends || [];
        console.log('Friends:', friends);

        // Include user's own posts
        const userIds = [userId, ...friends];
        console.log('Querying posts for userIds:', userIds.slice(0, 10));

        // FREE TIER: Limit to recent posts only
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef,
            where('userId', 'in', userIds.slice(0, 10)), // Firestore limit: max 10 items in 'in' query
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const snapshot = await getDocs(q);
        const posts = [];

        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        console.log('Posts fetched:', posts.length);
        return posts;
    } catch (error) {
        console.error('Error fetching feed:', error);
        console.error('Error details:', error.message, error.code);
        return [];
    }
}

// Like/Unlike a post
export async function toggleLike(postId, userId) {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post not found');
        }

        const likedBy = postDoc.data().likedBy || [];
        const isLiked = likedBy.includes(userId);

        if (isLiked) {
            // Unlike
            await updateDoc(postRef, {
                likesCount: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            // Like
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
        }

        return !isLiked;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

// Delete a post
export async function deletePost(postId, userId) {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error('Post not found');
        }

        // Verify ownership
        if (postDoc.data().userId !== userId) {
            throw new Error('Unauthorized');
        }

        // Note: In production, also delete files from Storage
        await postRef.delete();

        console.log('✅ Post deleted:', postId);
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
}

export { compressImage, uploadToStorage };
