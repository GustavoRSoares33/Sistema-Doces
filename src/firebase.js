// Importa as funções que precisamos do pacote que acabamos de instalar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// SUBSTITUA ESTE BLOCO PELO CÓDIGO QUE VOCÊ COPIOU DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvPL_X1kJ7kWNxOXTRLUSJrvP8qNwU3ss",
  authDomain: "sistema-de-doces.firebaseapp.com",
  projectId: "sistema-de-doces",
  storageBucket: "sistema-de-doces.firebasestorage.app",
  messagingSenderId: "937659928220",
  appId: "1:937659928220:web:7351cfe2cd83aa88ada759"
};

// Inicializa o aplicativo do Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o banco de dados Firestore e o exporta para usarmos nos outros arquivos
export const db = getFirestore(app);
export const auth = getAuth(app);