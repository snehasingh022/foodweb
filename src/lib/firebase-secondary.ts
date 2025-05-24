import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Updated Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBFUlYyJuvFMQSdywxPeMIfe8NUo6zf7A4",
  authDomain: "goyal-stores-chain.firebaseapp.com",
  databaseURL: "https://goyal-stores-chain-default-rtdb.firebaseio.com",
  projectId: "goyal-stores-chain",
  storageBucket: "goyal-stores-chain.firebasestorage.app",
  messagingSenderId: "348888889312",
  appId: "1:348888889312:web:d2f46fa51c8759d9979d85",
  measurementId: "G-M3L31S02QW"
};

// Initialize Firebase
const appName = "secondary"; // Unique name for secondary app

let app;
if (getApps().find((a) => a.name === appName)) {
  app = getApp(appName);
} else {
  app = initializeApp(firebaseConfig, appName);
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };