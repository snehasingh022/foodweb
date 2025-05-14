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
  apiKey: "AIzaSyBmmVS6bpeMW9UyYMPHV7yOczlid7krb00",
  authDomain: "pruthvi-travels-6d10a.firebaseapp.com",
  projectId: "pruthvi-travels-6d10a",
  storageBucket: "pruthvi-travels-6d10a.firebasestorage.app",
  messagingSenderId: "1066483473483",
  appId: "1:1066483473483:web:07ec9b6e61fcd1f6c001ce",
  measurementId: "G-YCEVPRPPZH"
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

export { auth, analytics, db, app };
