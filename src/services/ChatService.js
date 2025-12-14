import { db } from "../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    getDoc,
    addDoc,
    onSnapshot,
    serverTimestamp,
    orderBy,
    limit,
    updateDoc
} from "firebase/firestore";

// Helper: Generate a consistent Chat ID for two users
export function getChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Send a Message
export async function sendMessage(senderId, receiverId, text) {
    console.log('sendMessage called with:', { senderId, receiverId, text });

    const chatId = getChatId(senderId, receiverId);
    console.log('Generated chatId:', chatId);

    const chatDocRef = doc(db, "chats", chatId);

    try {
        // Get current unread count for receiver
        const chatDoc = await getDoc(chatDocRef);
        const currentUnreadCount = chatDoc.exists()
            ? (chatDoc.data().unreadCount || {})
            : {};

        // Increment unread count for receiver
        const newUnreadCount = {
            ...currentUnreadCount,
            [receiverId]: (currentUnreadCount[receiverId] || 0) + 1,
            [senderId]: 0 // Sender has read their own messages
        };

        // 1. Ensure chat document exists or update it
        console.log('Setting chat document...');
        await setDoc(chatDocRef, {
            participants: [senderId, receiverId],
            lastMessage: {
                text,
                senderId,
                createdAt: serverTimestamp()
            },
            updatedAt: serverTimestamp(),
            unreadCount: newUnreadCount,
            participantsMap: {
                [senderId]: true,
                [receiverId]: true
            }
        }, { merge: true });

        // 2. Add message to 'messages' subcollection
        console.log('Adding message to subcollection...');
        const messagesColl = collection(db, "chats", chatId, "messages");
        await addDoc(messagesColl, {
            text,
            senderId,
            createdAt: serverTimestamp()
        });

        console.log('Message sent successfully!');

    } catch (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", {
            code: error.code,
            message: error.message,
            senderId,
            receiverId,
            chatId
        });
        throw error;
    }
}

// Subscribe to a specific Chat's messages
export function subscribeToChatMessages(senderId, receiverId, callback, onError) {
    const chatId = getChatId(senderId, receiverId);
    const messagesColl = collection(db, "chats", chatId, "messages");

    // Order by created time
    const q = query(messagesColl, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    }, (error) => {
        // Ignore permission errors caused by logout
        if (error.code === 'permission-denied') return;

        console.error("Error subscribing to messages:", error);
        if (onError) onError(error);
    });
}

// Subscribe to User's Active Chats (Inbox)
export function subscribeToUserChats(userId, callback, onError) {
    const chatsRef = collection(db, "chats");
    // Query chats where specific user is a participant. 
    // Note: Array-contains works for array fields.
    // REMOVED orderBy("updatedAt", "desc") to avoid needing a composite index.
    // We will sort client-side in ChatPage.jsx
    const q = query(
        chatsRef,
        where("participants", "array-contains", userId)
    );

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(chats);
    }, (error) => {
        // Ignore permission errors caused by logout
        if (error.code === 'permission-denied') return;

        console.error("Firestore subscription error:", error);
        if (onError) onError(error);
    });
}

// Mark chat as read for a specific user
export async function markChatAsRead(senderId, receiverId) {
    const chatId = getChatId(senderId, receiverId);
    const chatDocRef = doc(db, "chats", chatId);

    try {
        const chatDoc = await getDoc(chatDocRef);
        if (!chatDoc.exists()) return;

        const currentUnreadCount = chatDoc.data().unreadCount || {};

        // Reset unread count for the current user
        await updateDoc(chatDocRef, {
            [`unreadCount.${senderId}`]: 0
        });
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
}
