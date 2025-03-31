import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Paste your config here, e.g.:
  apiKey: "AIzaSyD3jpqpBy4aZTpdvtPP7R7pXduxWw_Oxj0",
  authDomain: "miamipickupapp.firebaseapp.com",
  projectId: "miamipickupapp",
  storageBucket: "miamipickupapp.firebasestorage.app",
  messagingSenderId: "670690053309",
  appId: "1:670690053309:web:83c7d89f9192f0a569fbd4"
  // etc.
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);