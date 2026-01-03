import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCO8MAbiEJDjTMN4ZEy4xU2eaTr61jWLEg",
  authDomain: "rate-manager-2b763.firebaseapp.com",
  databaseURL: "https://rate-manager-2b763-default-rtdb.firebaseio.com",
  projectId: "rate-manager-2b763",
  storageBucket: "rate-manager-2b763.firebasestorage.app",
  messagingSenderId: "103218629674",
  appId: "1:103218629674:web:60a537b4a4bd8e25c7c753"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
