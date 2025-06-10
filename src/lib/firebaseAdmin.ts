
// Removed 'use server;' as this file exports SDK instances, not just async functions.

import { initializeApp, cert, getApps, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebaseConfig'; // For projectId, storageBucket

let _app: AdminApp;
let _db: Firestore;
let _authAdmin: Auth;

console.log('firebaseAdmin.ts: Module loaded. Attempting to initialize Firebase Admin SDK...');

function getServiceAccountFromEnv() {
  const base64Sdk = process.env.FIREBASE_ADMIN_SDK_BASE64;
  if (!base64Sdk) {
    console.error('firebaseAdmin.ts: CRITICAL ERROR - FIREBASE_ADMIN_SDK_BASE64 environment variable is not set.');
    throw new Error('FIREBASE_ADMIN_SDK_BASE64 environment variable is required for Admin SDK initialization and is not set.');
  }

  try {
    const decodedJson = Buffer.from(base64Sdk, 'base64').toString('utf-8');
    console.log('firebaseAdmin.ts: Successfully decoded FIREBASE_ADMIN_SDK_BASE64.');
    return JSON.parse(decodedJson);
  } catch (error) {
    console.error('firebaseAdmin.ts: CRITICAL ERROR - Failed to parse FIREBASE_ADMIN_SDK_BASE64. Ensure it is a valid Base64 encoded JSON string.', error);
    throw new Error('Failed to parse FIREBASE_ADMIN_SDK_BASE64. Admin SDK initialization failed.');
  }
}

if (!getApps().length) {
  console.log('firebaseAdmin.ts: No existing Firebase Admin apps found. Initializing a new app.');
  const serviceAccount = getServiceAccountFromEnv(); // Now directly calls the function that throws if env var is missing/invalid

  // The serviceAccount object is now guaranteed to be non-null if we reach here,
  // or an error would have been thrown by getServiceAccountFromEnv().

  console.log('firebaseAdmin.ts: Using projectId from firebaseConfig for initialization:', firebaseConfig.projectId);
  if (!firebaseConfig.projectId) {
    console.warn('firebaseAdmin.ts: firebaseConfig.projectId is undefined or empty. This is highly likely to lead to initialization issues if not overridden by service account.');
  }

  try {
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId, // This can be overridden by projectId in serviceAccount if present and different
      storageBucket: firebaseConfig.storageBucket,
    });
    console.log('firebaseAdmin.ts: New Firebase Admin App initialized. App Name:', _app.name);
  } catch (error: any) {
    console.error('firebaseAdmin.ts: Firebase Admin SDK initializeApp error:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message || 'Unknown error'}`);
  }
} else {
  _app = getApps()[0];
  console.log('firebaseAdmin.ts: Existing Firebase Admin App retrieved. App Name:', _app.name);
}

if (!_app) {
    // This state should ideally not be reached.
    console.error("firebaseAdmin.ts: Firebase Admin App (_app) is null or undefined after initialization attempts.");
    throw new Error("Firebase Admin App was not initialized. Cannot get Firestore/Auth instances.");
}

try {
  _db = getFirestore(_app);
  console.log('firebaseAdmin.ts: Firestore instance obtained.');
  if (_db && _db.projectId) {
    console.log('firebaseAdmin.ts: Firestore Project ID from _db.projectId:', _db.projectId);
  } else {
    console.error('firebaseAdmin.ts: _db (Firestore instance) is null, undefined, or has no projectId property.');
  }
} catch (error: any) {
  console.error('firebaseAdmin.ts: Error getting Firestore instance:', error);
  throw new Error(`Failed to get Firestore instance: ${error.message || 'Unknown error'}`);
}

try {
  _authAdmin = getAuth(_app);
  console.log('firebaseAdmin.ts: Auth instance obtained.');
} catch (error: any) {
  console.error('firebaseAdmin.ts: Error getting Auth instance:', error);
  throw new Error(`Failed to get Auth instance: ${error.message || 'Unknown error'}`);
}


export const adminDb = _db;
export const adminAuth = _authAdmin;
export const adminTimestamp = FieldValue.serverTimestamp;
    