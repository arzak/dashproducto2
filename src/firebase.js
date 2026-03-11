import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyCTcy-LYaoFaba2tGStRj-CtQNbwBlnre8",
    authDomain: "dashboardpsicotest.firebaseapp.com",
    projectId: "dashboardpsicotest",
    storageBucket: "dashboardpsicotest.firebasestorage.app",
    messagingSenderId: "825729226609",
    appId: "1:825729226609:web:ce0306388f359a169088d0",
    measurementId: "G-0KP820N9QW",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export default app;
