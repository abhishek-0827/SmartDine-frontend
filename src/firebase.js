import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyADj_ou4L1uUcvR85G2R5jIMd-cdeG4Odo",
    authDomain: "smartdine-d41ad.firebaseapp.com",
    projectId: "smartdine-d41ad",
    storageBucket: "smartdine-d41ad.firebasestorage.app",
    messagingSenderId: "623414028618",
    appId: "1:623414028618:web:e6c765cbc9a9d4f633f9b3",
    measurementId: "G-7P2KMDHT9P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and Auth
// Use try-catch for analytics as it might fail in some envs (though typically fine in browser)
let analytics;
try {
    analytics = getAnalytics(app);
} catch (e) {
    console.warn("Firebase Analytics failed to load:", e);
}

export { analytics };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
