import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// Inicializar App Check con reCAPTCHA v3
// Nota: Debes registrar tu dominio en Firebase Console y obtener la clave de sitio de reCAPTCHA v3
initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('TU_CLAVE_DE_SITIO_RECAPTCHA_V3'),
    isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export default app;
