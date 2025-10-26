// Firebase Configuration
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyAvspShkZtE2dObxr4m1_jEJ7_Fk_U5ymM",
    authDomain: "global-smile-86712.firebaseapp.com",
    projectId: "global-smile-86712",
    storageBucket: "global-smile-86712.firebasestorage.app",
    messagingSenderId: "309461784439",
    appId: "1:309461784439:web:6d49bbf84f767e716c7372",
    measurementId: "G-X6H9DBGBDX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export for use in other files
window.firebaseApp = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;
