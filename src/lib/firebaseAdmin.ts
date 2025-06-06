import * as admin from 'firebase-admin';
import { firebaseConfig } from './firebaseConfig';
import { cert, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    const serviceAccount = require('../config/adminSDK.json');

    admin.initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminTimestamp = admin.firestore.FieldValue.serverTimestamp;
