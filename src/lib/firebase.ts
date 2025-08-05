// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "visageid-gsic4",
  "appId": "1:712085680469:web:1ac5391b93dfff4971ffdc",
  "storageBucket": "visageid-gsic4.firebasestorage.app",
  "apiKey": "AIzaSyCDQki3_w9nj3K_XHVrLeu2s_4f3Nqrn_A",
  "authDomain": "visageid-gsic4.firebaseapp.com",
  "messagingSenderId": "712085680469"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
