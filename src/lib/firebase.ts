// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVPDCAGMGePL3PcBBlAY25etCWHs1EfKs",
  authDomain: "visageid-ae9b9.firebaseapp.com",
  projectId: "visageid-ae9b9",
  storageBucket: "visageid-ae9b9.appspot.com",
  messagingSenderId: "808812032105",
  appId: "1:808812032105:web:d3a524ab6d68c47d34f2f8",
  measurementId: "G-B1X6HRVCK7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
