/// <reference path="./firebase-auth-react-native.d.ts" />
import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJo_8UddsLv3fGMlpOd_ViT7IysL879iE",
  authDomain: "aba-visual-performance.firebaseapp.com",
  projectId: "aba-visual-performance",
  storageBucket: "aba-visual-performance.firebasestorage.app",
  messagingSenderId: "91590121486",
  appId: "1:91590121486:web:c56d4b0cae9f62566bc45f"
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);