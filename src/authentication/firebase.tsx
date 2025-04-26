// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
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
let auth:any;
let analytics:any;
let db:any;

if (typeof window !== "undefined") {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); // Initialize auth only on the client side
  analytics = getAnalytics(app); // Initialize analytics only on the client side
  db = getFirestore(app); // Initialize Firestore
}

export { auth, analytics, db };
