// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace with your actual Firebase config object from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDa5lkKbThEfRpUDk2iK3ZaQv71NIe6ZdE",
  authDomain: "sproject-d6684.firebaseapp.com",
  projectId: "sproject-d6684",
  storageBucket: "sproject-d6684.appspot.com",
  messagingSenderId: "250439299647",
  appId: "1:250439299647:web:f0c707d1d9de30f2227e8a",
  measurementId: "G-L85LF5JSP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);
const db = getFirestore(app);

export { db, storage };
