
import { initializeApp, cert, getApps, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebaseConfig'; // For projectId, storageBucket

let _app: AdminApp;
let _db: Firestore;
let _authAdmin: Auth;

if (!getApps().length) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require('../config/adminSDK.json');
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Rethrow to make it clear that admin features will not work
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message || 'Unknown error'}`);
  }
} else {
  _app = getApps()[0];
}

// Ensure _app is initialized before attempting to get other services
if (!_app) {
    // This should theoretically not be reached if initialization throws an error,
    // but it's a defensive check.
    throw new Error("Firebase Admin App was not initialized. Cannot get Firestore/Auth instances.");
}

_db = getFirestore(_app);
_authAdmin = getAuth(_app);

export const adminDb = _db;
export const adminAuth = _authAdmin;
export const adminTimestamp = FieldValue.serverTimestamp; // This is a sentinel value, not a function call
