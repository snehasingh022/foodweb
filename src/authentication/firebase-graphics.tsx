// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Graphics Firebase configuration
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
let graphicsApp: FirebaseApp;
let graphicsAuth: Auth;
let graphicsAnalytics: Analytics | null;
let graphicsDb: Firestore;
let graphicsStorage: any;

// Initialize Firebase only on the client side and if it hasn't been initialized already
if (typeof window !== "undefined") {
  // Use a unique name for this Firebase instance
  graphicsApp = initializeApp(firebaseConfig, "graphics-app");
  graphicsAuth = getAuth(graphicsApp);
  graphicsDb = getFirestore(graphicsApp);
  graphicsStorage = getStorage(graphicsApp);
  
  // Initialize analytics only if supported
  const initAnalytics = async () => {
    if (await isSupported()) {
      graphicsAnalytics = getAnalytics(graphicsApp);
    } else {
      graphicsAnalytics = null;
    }
  };
  
  initAnalytics().catch(console.error);
}

export { graphicsAuth, graphicsAnalytics, graphicsDb, graphicsApp, graphicsStorage }; 