
import { initializeApp, cert, getApps, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebaseConfig'; // For projectId, storageBucket

let _app: AdminApp;
let _db: Firestore;
let _authAdmin: Auth;

function getServiceAccount() {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;
  if (base64Sdk) {
    try {
      const decodedJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error('Failed to parse FIREBASE_ADMIN_SDK_BASE64. Ensure it is a valid Base64 encoded JSON.', error);
      // Fall through to try the file method if parsing fails
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccountFile = require('../config/adminSDK.json');
    return serviceAccountFile;
  } catch (error) {
    console.error('Failed to load service account from ../config/adminSDK.json.', error);
    return null;
  }
}

if (!getApps().length) {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    const errorMessage = 'Firebase Admin SDK service account credentials not found or failed to load. Check FIREBASE_ADMIN_SDK_BASE64 environment variable or src/config/adminSDK.json.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message || 'Unknown error'}`);
  }
} else {
  _app = getApps()[0];
}

if (!_app) {
    throw new Error("Firebase Admin App was not initialized. Cannot get Firestore/Auth instances.");
}

_db = getFirestore(_app);
_authAdmin = getAuth(_app);

export const adminDb = _db;
export const adminAuth = _authAdmin;
export const adminTimestamp = FieldValue.serverTimestamp;
