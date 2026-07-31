// Importa as funções que precisamos do pacote que acabamos de instalar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// SUBSTITUA ESTE BLOCO PELO CÓDIGO QUE VOCÊ COPIOU DO FIREBASE
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializa o aplicativo do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o banco de dados Firestore e o exporta para usarmos nos outros arquivos
export const db = getFirestore(app);
export const auth = getAuth(app);