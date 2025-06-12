import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCrbWychHflPOdcNN7twbZ_lhvWzFtgzBI",
    authDomain: "ics4u-de9c4.firebaseapp.com",
    projectId: "ics4u-de9c4",
    storageBucket: "ics4u-de9c4.appspot.com", // Fix this line
    messagingSenderId: "366551867028",
    appId: "1:366551867028:web:ca99dcab989beb77819e81"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };