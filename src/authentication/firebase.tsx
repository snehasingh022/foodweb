// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null;
let db: Firestore;

// Initialize Firebase only on the client side and if it hasn't been initialized already
if (typeof window !== "undefined") {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]; // Use the already initialized app
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Initialize analytics only if supported
  const initAnalytics = async () => {
    if (await isSupported()) {
      analytics = getAnalytics(app);
    } else {
      analytics = null;
    }
  };
  
  initAnalytics().catch(console.error);
}


// Remove the Protected export since DemoOne is not defined
export { auth, analytics, db, app };
