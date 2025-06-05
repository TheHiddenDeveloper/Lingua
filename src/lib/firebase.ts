
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, serverTimestamp, Timestamp } from 'firebase/firestore'; // Added getFirestore, serverTimestamp, Timestamp
import { firebaseConfig } from './firebaseConfig'; 

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof getFirestore>; // Added db

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app); // Initialize Firestore
  } catch (error) {
    console.error("Error initializing Firebase. Ensure firebaseConfig.ts is correctly set up.", error);
    throw new Error("Firebase initialization failed. Please check your firebaseConfig.ts.");
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app); // Get Firestore instance
}

export { app, auth, db, serverTimestamp as appTimestamp, Timestamp }; // Export db and serverTimestamp as appTimestamp, and Timestamp
