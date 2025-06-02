import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// Import firebaseConfig from firebaseConfig.ts. 
// Make sure you have created this file and filled in your Firebase project details.
// You can copy firebaseConfigExample.ts to firebaseConfig.ts as a template.
import { firebaseConfig } from './firebaseConfig'; 

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error("Error initializing Firebase. Ensure firebaseConfig.ts is correctly set up.", error);
    // Fallback or rethrow, depending on how critical Firebase is at this point.
    // For this app, Firebase auth is critical.
    throw new Error("Firebase initialization failed. Please check your firebaseConfig.ts.");
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth };
