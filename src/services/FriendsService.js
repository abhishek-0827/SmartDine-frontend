import { db } from "../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getCountFromServer,
    limit
} from "firebase/firestore";

// Search for a user by SmartDine ID
// Search for a user by SmartDine ID (Prefix search behavior)
export async function searchUserById(searchTerm) {
    try {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return null;
        if (!term) return [];

        const usersRef = collection(db, "users");

        // Use range query for prefix search (startsWith)
        // This allows searching "john" to find "john_doe"
        const q = query(
            usersRef,
            where("smartdineId", ">=", term),
            where("smartdineId", "<=", term + '\uf8ff'),
            limit(5)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error searching user:", error);
        throw error;
    }
}

// Get User Profile by ID
export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

// Update User Profile
export async function updateUserProfile(userId, updates) {
    try {
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, updates, { merge: true });
        console.log("Profile updated successfully");
        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}

// --- Approval-Based Follow System ---

// Send Follow Request (Modified)
export async function followUser(currentUserId, targetUserId) {
    try {
        // 1. Add to targetUser's 'followRequests' subcollection
        await setDoc(doc(db, "users", targetUserId, "followRequests", currentUserId), {
            requestedAt: new Date()
        });

        // 2. Add to currentUser's 'following' subcollection with status 'pending'
        await setDoc(doc(db, "users", currentUserId, "following", targetUserId), {
            status: 'pending',
            requestedAt: new Date()
        });
    } catch (error) {
        console.error("Error sending follow request:", error);
        throw error;
    }
}

// Accept Follow Request
export async function acceptFollowRequest(currentUserId, requesterId) {
    try {
        // 1. Remove from 'followRequests'
        await deleteDoc(doc(db, "users", currentUserId, "followRequests", requesterId));

        // 2. Create entry in 'followers'
        await setDoc(doc(db, "users", currentUserId, "followers", requesterId), {
            followedAt: new Date()
        });

        // 3. Update requester's 'following' status to 'accepted'
        await setDoc(doc(db, "users", requesterId, "following", currentUserId), {
            status: 'accepted',
            followedAt: new Date()
        }, { merge: true });

    } catch (error) {
        console.error("Error accepting request:", error);
        throw error;
    }
}

// Reject Follow Request
export async function rejectFollowRequest(currentUserId, requesterId) {
    try {
        // 1. Remove from 'followRequests'
        await deleteDoc(doc(db, "users", currentUserId, "followRequests", requesterId));

        // 2. Remove from requester's 'following' (effectively cancelling the request)
        await deleteDoc(doc(db, "users", requesterId, "following", currentUserId));

    } catch (error) {
        console.error("Error rejecting request:", error);
        throw error;
    }
}

// Unfollow a user (or cancel request)
export async function unfollowUser(currentUserId, targetUserId) {
    try {
        // 1. Remove from 'following'
        await deleteDoc(doc(db, "users", currentUserId, "following", targetUserId));

        // 2. Remove from 'followers' (if exists)
        await deleteDoc(doc(db, "users", targetUserId, "followers", currentUserId));

        // 3. Remove from 'followRequests' (if it was just a pending request)
        await deleteDoc(doc(db, "users", targetUserId, "followRequests", currentUserId));

    } catch (error) {
        console.error("Error unfollowing user:", error);
        throw error;
    }
}

// Check Follow Status
export async function checkFollowStatus(currentUserId, targetUserId) {
    try {
        const docRef = doc(db, "users", currentUserId, "following", targetUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().status; // 'pending' or 'accepted'
        }
        return null; // Not following and not requested
    } catch (error) {
        console.error("Error checking follow status:", error);
        return null;
    }
}

// Get Follower/Following Counts (Only accepted)
export async function getSocialCounts(userId) {
    try {
        const followersColl = collection(db, "users", userId, "followers");
        // For following, we need to filter only 'accepted' ones if we want strict counts,
        // but `count()` aggregation doesn't support complex filters easily without indexes.
        // For simplicity/perf in this demo, 'following' subcollection is mixed.
        // We will just count 'followers' accurately.
        // For 'following', let's just count all docs for now (including pending) or client-side filter.
        // Better: client load list and count. OR Firestore Query.

        const qFollowing = query(collection(db, "users", userId, "following"), where("status", "==", "accepted"));

        const followersSnap = await getCountFromServer(followersColl);
        const followingSnap = await getCountFromServer(qFollowing);

        return {
            followers: followersSnap.data().count,
            following: followingSnap.data().count
        };
    } catch (error) {
        console.error("Error getting counts:", error);
        return { followers: 0, following: 0 };
    }
}

// Get List of Pending Requests (profiles)
export async function getPendingRequests(userId) {
    try {
        const requestsColl = collection(db, "users", userId, "followRequests");
        const snap = await getDocs(requestsColl);

        const profiles = await Promise.all(snap.docs.map(d => getUserProfile(d.id)));
        return profiles.filter(p => p !== null);
    } catch (error) {
        console.error("Error getting pending requests:", error);
        return [];
    }
}

// Get List of Following (profiles) - Accepts optional status filter
export async function getFollowingList(userId) {
    try {
        const followingColl = collection(db, "users", userId, "following");
        const q = query(followingColl, where("status", "==", "accepted"));
        const snap = await getDocs(q);

        const profiles = await Promise.all(snap.docs.map(d => getUserProfile(d.id)));
        return profiles.filter(p => p !== null);
    } catch (error) {
        console.error("Error getting following list:", error);
        return [];
    }
}

// Get List of Followers (profiles)
export async function getFollowersList(userId) {
    try {
        const followersColl = collection(db, "users", userId, "followers");
        const snap = await getDocs(followersColl);

        const profiles = await Promise.all(snap.docs.map(d => getUserProfile(d.id)));
        return profiles.filter(p => p !== null);
    } catch (error) {
        console.error("Error getting followers list:", error);
        return [];
    }
}

// Get Mutual Friends Count between current user and target user
export async function getMutualFriendsCount(currentUserId, targetUserId) {
    try {
        // Get current user's following list
        const currentFollowing = await getFollowingList(currentUserId);
        const currentFollowingIds = new Set(currentFollowing.map(f => f.id));

        // Get target user's following list
        const targetFollowing = await getFollowingList(targetUserId);
        const targetFollowingIds = new Set(targetFollowing.map(f => f.id));

        // Find intersection (mutual friends)
        const mutualCount = [...currentFollowingIds].filter(id => targetFollowingIds.has(id)).length;

        return mutualCount;
    } catch (error) {
        console.error("Error getting mutual friends count:", error);
        return 0;
    }
}

