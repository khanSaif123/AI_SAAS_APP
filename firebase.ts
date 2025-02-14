import {getApp,getApps, initializeApp} from "firebase/app"
import {getFirestore} from "firebase/firestore"
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBPOCroBJIrlwbUxrNDQ-2gfJRCtM94arc",
    authDomain: "chat-with-pdf-96dd4.firebaseapp.com",
    projectId: "chat-with-pdf-96dd4",
    storageBucket: "chat-with-pdf-96dd4.firebasestorage.app",
    messagingSenderId: "854539328924",
    appId: "1:854539328924:web:2fcd305eeb8e6c381efc59",
    measurementId: "G-9YZ9MHLDCQ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

const db = getFirestore(app)
const storage = getStorage(app)

export {db, storage};
