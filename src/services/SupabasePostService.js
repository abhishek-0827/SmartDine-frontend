import { supabase } from './SupabaseClient';
import config from '../config';

// Generate unique ID
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Compress image before upload
async function compressImage(file, maxSizeMB = 1) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

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

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Upload file to Supabase Storage
async function uploadToSupabase(bucket, path, file) {
    console.log('Uploading to Supabase:', { bucket, path, fileName: file.name });

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        console.error('Error details:', { bucket, path, message: error.message });
        throw error;
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    console.log('Public URL:', publicUrl);
    return publicUrl;
}

// Create a new post
export async function createPost(userId, files, caption, tags = [], location = '') {
    try {
        if (files.length > 3) {
            throw new Error('Maximum 3 images allowed');
        }

        if (files.length === 0) {
            throw new Error('At least one file is required');
        }

        const postId = generateId();
        const mediaUrls = [];

        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

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

            const fileName = `${postId}_${i}_${file.name}`;
            const path = `${userId}/${fileName}`;
            const url = await uploadToSupabase('posts', path, uploadFile);
            mediaUrls.push(url);
        }

        const type = files[0].type.startsWith('video/') ? 'video' : 'image';

        // Save to Supabase database
        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    user_id: userId,
                    type,
                    media_urls: mediaUrls,
                    caption,
                    tags,
                    location,
                    likes_count: 0,
                    comments_count: 0,
                    liked_by: []
                }
            ])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Post created:', data.id);
        return data.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}

// Get user's posts
export async function getUserPosts(userId) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

// Get feed (user + friends posts)
export async function getFeed(userId) {
    try {
        console.log('getFeed called for userId:', userId);

        // For now, just get all posts (you can add friends logic later)
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        console.log('Posts fetched:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('Error fetching feed:', error);
        return [];
    }
}

// Like/Unlike a post
export async function toggleLike(postId, userId) {
    try {
        // Get current post
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('liked_by, likes_count')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;

        const likedBy = post.liked_by || [];
        const isLiked = likedBy.includes(userId);

        let newLikedBy;
        let newLikesCount;

        if (isLiked) {
            // Unlike
            newLikedBy = likedBy.filter(id => id !== userId);
            newLikesCount = Math.max(0, (post.likes_count || 0) - 1);

            // Delete from likes table
            const { error: deleteLikeError } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (deleteLikeError) {
                console.error('Error deleting from likes table:', deleteLikeError);
                // Continue anyway - the main posts table update is more important
            }
        } else {
            // Like
            newLikedBy = [...likedBy, userId];
            newLikesCount = (post.likes_count || 0) + 1;

            // Insert into likes table
            const { error: insertLikeError } = await supabase
                .from('likes')
                .insert([{
                    post_id: postId,
                    user_id: userId
                }]);

            if (insertLikeError) {
                console.error('Error inserting into likes table:', insertLikeError);
                // Continue anyway - the main posts table update is more important
            }
        }

        // Update posts table
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                liked_by: newLikedBy,
                likes_count: newLikesCount
            })
            .eq('id', postId);

        if (updateError) throw updateError;

        // Clear user cache in backend
        try {
            await fetch(`${config.API_BASE_URL}/clear-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            console.log('✅ User cache cleared after like/unlike');
        } catch (cacheError) {
            console.warn('⚠️ Failed to clear user cache:', cacheError.message);
            // Don't throw - cache clearing is not critical
        }

        return !isLiked;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}


// Add a comment to a post
export async function addComment(postId, userId, commentText) {
    try {
        // Get current post
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('comments, comments_count')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;

        const comments = post.comments || [];
        const newComment = {
            userId,
            text: commentText,
            createdAt: new Date().toISOString()
        };

        const newComments = [...comments, newComment];
        const newCommentsCount = (post.comments_count || 0) + 1;

        // Update posts table
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                comments: newComments,
                comments_count: newCommentsCount
            })
            .eq('id', postId);

        if (updateError) throw updateError;

        // Insert into comments table
        const { error: insertCommentError } = await supabase
            .from('comments')
            .insert([{
                post_id: postId,
                user_id: userId,
                text: commentText
            }]);

        if (insertCommentError) {
            console.error('Error inserting into comments table:', insertCommentError);
            // Continue anyway - the main posts table update is more important
        }

        // Clear user cache in backend
        try {
            await fetch(`${config.API_BASE_URL}/clear-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            console.log('✅ User cache cleared after comment');
        } catch (cacheError) {
            console.warn('⚠️ Failed to clear user cache:', cacheError.message);
            // Don't throw - cache clearing is not critical
        }

        console.log('✅ Comment added to post:', postId);
        return newComment;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}


// Delete a post
export async function deletePost(postId, userId) {
    try {
        console.log('🗑️ Attempting to delete post:', postId, 'for user:', userId);

        // First, get the post to retrieve media URLs for deletion
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Error fetching post for deletion:', fetchError);
            throw fetchError;
        }

        if (!post) {
            throw new Error('Post not found or you do not have permission to delete it');
        }

        console.log('📄 Post found, deleting from database...');

        // Delete the post from database
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error deleting post from database:', deleteError);
            throw deleteError;
        }

        console.log('✅ Post deleted successfully:', postId);

        // Optionally delete media files from storage (if needed)
        if (post.media_urls && post.media_urls.length > 0) {
            console.log('🗑️ Cleaning up media files...');
            // Note: Supabase storage deletion would go here if needed
        }

        return true;
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        throw error;
    }
}

// Get posts liked by a user
export async function getLikedPosts(userId) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .contains('liked_by', [userId])
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        console.log('Liked posts fetched:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('Error fetching liked posts:', error);
        return [];
    }
}

// Get food recommendations based on user's liked posts
export async function getRecommendations(userId) {
    try {
        // First, get user's liked posts to analyze their preferences
        const likedPosts = await getLikedPosts(userId);

        if (likedPosts.length === 0) {
            // If no liked posts, return recent posts with food tags
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .not('tags', 'is', null)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data || [];
        }

        // Extract common tags from liked posts
        const tagFrequency = {};
        likedPosts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => {
                    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
                });
            }
        });

        // Get top 3 most common tags
        const topTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag]) => tag);

        if (topTags.length === 0) {
            return [];
        }

        // Get posts with similar tags that user hasn't liked
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .overlaps('tags', topTags)
            .not('liked_by', 'cs', `{${userId}}`)
            .order('likes_count', { ascending: false })
            .limit(20);

        if (error) throw error;

        console.log('Recommendations fetched:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

export { compressImage, uploadToSupabase };
