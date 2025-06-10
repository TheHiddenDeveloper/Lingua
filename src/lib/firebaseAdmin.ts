
'use server'; // This directive can be problematic for files exporting non-async objects.
// Removed 'use server;' as this file exports SDK instances, not just async functions.

import { initializeApp, cert, getApps, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebaseConfig'; // For projectId, storageBucket

let _app: AdminApp;
let _db: Firestore;
let _authAdmin: Auth;

console.log('firebaseAdmin.ts: Module loaded. Attempting to initialize Firebase Admin SDK...');

function getServiceAccount() {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;
  if (base64Sdk) {
    try {
      const decodedJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
      console.log('firebaseAdmin.ts: Successfully decoded FIREBASE_ADMIN_SDK_BASE64.');
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error('firebaseAdmin.ts: Failed to parse FIREBASE_ADMIN_SDK_BASE64. Ensure it is a valid Base64 encoded JSON.', error);
      // Fall through to try the file method if parsing fails
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccountFile = require('../config/adminSDK.json');
    console.log('firebaseAdmin.ts: Successfully loaded service account from ../config/adminSDK.json.');
    return serviceAccountFile;
  } catch (error) {
    console.error('firebaseAdmin.ts: Failed to load service account from ../config/adminSDK.json.', error);
    return null;
  }
}

if (!getApps().length) {
  console.log('firebaseAdmin.ts: No existing Firebase Admin apps found. Initializing a new app.');
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    const errorMessage = 'firebaseAdmin.ts: Firebase Admin SDK service account credentials not found or failed to load. Check FIREBASE_ADMIN_SDK_BASE64 environment variable or src/config/adminSDK.json.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log('firebaseAdmin.ts: Using projectId from firebaseConfig:', firebaseConfig.projectId);
  if (!firebaseConfig.projectId) {
    console.warn('firebaseAdmin.ts: firebaseConfig.projectId is undefined or empty. This may lead to initialization issues.');
  }

  try {
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      // databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com` // Optional, usually inferred
    });
    console.log('firebaseAdmin.ts: New Firebase Admin App initialized. Type:', typeof _app, 'Instance:', _app ? 'Exists' : 'null/undefined');
  } catch (error: any) {
    console.error('firebaseAdmin.ts: Firebase Admin SDK initialization error:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message || 'Unknown error'}`);
  }
} else {
  _app = getApps()[0];
  console.log('firebaseAdmin.ts: Existing Firebase Admin App retrieved. Type:', typeof _app, 'Instance:', _app ? 'Exists' : 'null/undefined');
}

if (!_app) {
    // This state should ideally not be reached if the above logic is correct.
    console.error("firebaseAdmin.ts: Firebase Admin App (_app) is null or undefined after initialization attempts.");
    throw new Error("Firebase Admin App was not initialized. Cannot get Firestore/Auth instances.");
}

try {
  _db = getFirestore(_app);
  console.log('firebaseAdmin.ts: Firestore instance created. Type:', typeof _db, 'Instance:', _db ? 'Exists' : 'null/undefined');
  if (_db) {
    console.log('firebaseAdmin.ts: Firestore projectId from _db.projectId:', _db.projectId);
  } else {
    console.error('firebaseAdmin.ts: _db (Firestore instance) is null or undefined.');
  }
} catch (error: any) {
  console.error('firebaseAdmin.ts: Error getting Firestore instance:', error);
  throw new Error(`Failed to get Firestore instance: ${error.message || 'Unknown error'}`);
}

try {
  _authAdmin = getAuth(_app);
  console.log('firebaseAdmin.ts: Auth instance created. Type:', typeof _authAdmin, 'Instance:', _authAdmin ? 'Exists' : 'null/undefined');
} catch (error: any) {
  console.error('firebaseAdmin.ts: Error getting Auth instance:', error);
  throw new Error(`Failed to get Auth instance: ${error.message || 'Unknown error'}`);
}


export const adminDb = _db;
export const adminAuth = _authAdmin;
export const adminTimestamp = FieldValue.serverTimestamp;
