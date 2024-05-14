import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// Follow this pattern to import other Firebase services
// import { } from 'firebase/<service>';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPgOCF9xA4TvfivSRlmems9wdtlf1PNiQ",
  authDomain: "chatetelecom-e278d.firebaseapp.com",
  projectId: "chatetelecom-e278d",
  storageBucket: "chatetelecom-e278d.appspot.com",
  messagingSenderId: "940100739273",
  appId: "1:940100739273:web:2be3f42367d59e17842d18"
};

const fireBaseApp = initializeApp(firebaseConfig);

const fireBaseDB = getDatabase(fireBaseApp);

const fireBaseAuth = getAuth(fireBaseApp);

export {fireBaseDB, fireBaseAuth}