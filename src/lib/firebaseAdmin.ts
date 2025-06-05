
import * as admin from 'firebase-admin';

// Ensure this file is only processed once by checking admin.apps.length
if (!admin.apps.length) {
  try {
    // When running in a Firebase environment (like Cloud Functions or App Hosting),
    // the SDK automatically discovers credentials.
    // For local development, ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account key file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error: ', error.stack);
    // Optionally, throw the error or handle it as per your application's needs
    // throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth(); // Export auth if needed for other admin tasks
export const adminTimestamp = admin.firestore.FieldValue.serverTimestamp;
