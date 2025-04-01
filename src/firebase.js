import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD3jpqpBy4aZTpdvtPP7R7pXduxWw_Oxj0",
  authDomain: "miamipickupapp.firebaseapp.com",
  projectId: "miamipickupapp",
  storageBucket: "miamipickupapp.firebasestorage.app",
  messagingSenderId: "670690053309",
  appId: "1:670690053309:web:83c7d89f9192f0a569fbd4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  setDoc, 
  getDoc, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
};