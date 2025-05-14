// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Media Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsLezwK8WE2rVAY_fxUBfyEt5rpSH0ZE0",
  authDomain: "foodweb-world.firebaseapp.com",
  projectId: "foodweb-world",
  storageBucket: "foodweb-world.firebasestorage.app",
  messagingSenderId: "766590226062",
  appId: "1:766590226062:web:acd3a01063bccd15cb03df",
  measurementId: "G-HF25RR23JN"
};

// Initialize Firebase
let mediaApp: FirebaseApp;
let mediaAuth: Auth;
let mediaAnalytics: Analytics | null;
let mediaDb: Firestore;
let mediaStorage: any;

// Initialize Firebase only on the client side and if it hasn't been initialized already
if (typeof window !== "undefined") {
  // Use a unique name for this Firebase instance
  mediaApp = initializeApp(firebaseConfig, "media-app");
  mediaAuth = getAuth(mediaApp);
  mediaDb = getFirestore(mediaApp);
  mediaStorage = getStorage(mediaApp);
  
  // Initialize analytics only if supported
  const initAnalytics = async () => {
    if (await isSupported()) {
      mediaAnalytics = getAnalytics(mediaApp);
    } else {
      mediaAnalytics = null;
    }
  };
  
  initAnalytics().catch(console.error);
}

export { mediaAuth, mediaAnalytics, mediaDb, mediaApp, mediaStorage }; 