// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBk6vjjq5VGVXYUcpsONsNah07tkMl2fQc",
  authDomain: "eduai-466305.firebaseapp.com",
  projectId: "eduai-466305",
  storageBucket: "eduai-466305.appspot.com", // <-- fix: should be .appspot.com
  messagingSenderId: "220718266197",
  appId: "1:220718266197:web:bfed8eac0ec1ef6a0b61dc",
  measurementId: "G-96H84EZN7S"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };