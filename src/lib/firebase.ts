import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if config has been modified from the placeholders
const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your_api_key_here" &&
  !firebaseConfig.apiKey.startsWith("your_");

if (!isConfigured) {
  console.warn(
    "WARNING: Firebase is not configured yet. Please configure the environment variables in your .env file at the project root."
  );
}

// Initialize Firebase (safely, fallback to empty config if not configured to prevent crashes during initial builds)
const app = getApps().length === 0 
  ? initializeApp(isConfigured ? firebaseConfig : { apiKey: "dummy-key-for-compilation-only", projectId: "dummy-project" }) 
  : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, isConfigured };
