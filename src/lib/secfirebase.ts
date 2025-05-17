import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Secondary Firebase Config
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