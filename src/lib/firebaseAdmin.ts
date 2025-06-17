// Removed 'use server;' as this file exports SDK instances, not just async functions.

import { initializeApp, cert, getApps, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebaseConfig';
import { loadEnvironment } from './env';

let _app: AdminApp;
let _db: Firestore;
let _authAdmin: Auth;

console.log('firebaseAdmin.ts: Module loaded. Attempting to initialize Firebase Admin SDK...');

function getServiceAccountFromEnv(): object {
  const { adminSdk } = loadEnvironment();

  try {
    const decodedJson = Buffer.from(adminSdk, 'base64').toString('utf-8');
    console.log('firebaseAdmin.ts: Successfully decoded FIREBASE_ADMIN_SDK_BASE64.');
    const serviceAccountObject = JSON.parse(decodedJson);

    // Validate the service account object
    if (!serviceAccountObject.project_id || !serviceAccountObject.private_key) {
      throw new Error('Invalid service account format');
    }

    return serviceAccountObject;
  } catch (error) {
    console.error('firebaseAdmin.ts: Failed to parse admin SDK:', error);
    throw error;
  }
}


if (!getApps().length) {
  const serviceAccount = getServiceAccountFromEnv();

  try {
    _app = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: serviceAccount.project_id, // Use project_id from service account instead
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: firebaseConfig.storageBucket,
    });
    console.log('firebaseAdmin.ts: New Firebase Admin App initialized. App Name:', _app.name);
  } catch (error: any) {
    console.error('firebaseAdmin.ts: Firebase Admin SDK initializeApp error:', error);
    throw error;
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
  if (_db) {
    console.log('firebaseAdmin.ts: Firestore instance is valid.');
  } else {
    console.error('firebaseAdmin.ts: _db (Firestore instance) is null or undefined.');
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

// Test the connection immediately
_db.collection('_test_').doc('_test_')
  .set({ timestamp: FieldValue.serverTimestamp() })
  .then(() => {
    console.log('firebaseAdmin.ts: Successfully tested Firestore write access');
    return _db.collection('_test_').doc('_test_').delete();
  })
  .catch((error) => {
    console.error('firebaseAdmin.ts: Firestore write test failed:', error);
    // Don't throw here, just log the error
  });

export const adminDb = _db;
export const adminAuth = _authAdmin;
export const adminTimestamp = FieldValue.serverTimestamp;
