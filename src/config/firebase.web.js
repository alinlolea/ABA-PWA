import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJo_8UddsLv3fGMlpOd_ViT7IysL879iE",
  authDomain: "aba-visual-performance.firebaseapp.com",
  projectId: "aba-visual-performance",
  storageBucket: "aba-visual-performance.firebasestorage.app",
  messagingSenderId: "91590121486",
  appId: "1:91590121486:web:c56d4b0cae9f62566bc45f",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
