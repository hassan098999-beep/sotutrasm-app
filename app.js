// Import Firebase modules needed
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {  
  apiKey: "AIzaSyBJxyFwFseINtXqdEU0JYESl6zQYVj0hSw",  
  authDomain: "sotutrasm-manager.firebaseapp.com",  
  projectId: "sotutrasm-manager",  
  storageBucket: "sotutrasm-manager.firebasestorage.app",  
  messagingSenderId: "452756329466",  
  appId: "1:452756329466:web:8c5b54a2818e4602874a43",  
  measurementId: "G-GGQC6EDSZB"  
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const input = document.getElementById("dataInput");
const list = document.getElementById("list");

// Save data to Firestore
window.saveData = async () => {
    const val = input.value.trim();
    if (!val) return;
    await addDoc(collection(db, "items"), { text: val });
    input.value = "";
};

// Real-time listener
onSnapshot(collection(db, "items"), (snap) => {
    list.innerHTML = "";
    snap.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = doc.data().text;
        list.appendChild(li);
    });
});

// Register Service Worker for PWA
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
}