import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, serverTimestamp, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

export const firebaseConfig = {
    apiKey: "AIzaSyDfFteYw6Enn0jaFvyonvW8XNtqxWuZCA8",
    authDomain: "xts-issuetracker.firebaseapp.com",
    projectId: "xts-issuetracker",
    storageBucket: "xts-issuetracker.firebasestorage.app",
    messagingSenderId: "865565422535",
    appId: "1:865565422535:web:05aa61869fc03361db9fe2",
    measurementId: "G-MMV55EQRJW"
};

// Initialize Firebase and export functions
window.initializeApp = initializeApp;
window.getFirestore = getFirestore;
window.collection = collection;
window.query = query;
window.where = where;
window.getDocs = getDocs;
window.getAuth = getAuth;
window.GoogleAuthProvider = GoogleAuthProvider;
window.addDoc = addDoc;
window.updateDoc = updateDoc;
window.doc = doc;
window.arrayUnion = arrayUnion;
window.serverTimestamp = serverTimestamp;
window.signInWithPopup = signInWithPopup;
window.orderBy = orderBy;
window.limit = limit;
window.getDoc = getDoc;
