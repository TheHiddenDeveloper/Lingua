
import * as admin from 'firebase-admin';

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;
// admin.firestore.FieldValue is a static type, but we assign serverTimestamp for consistent export.
let adminTimestampFn: () => admin.firestore.FieldValue;


if (!admin.apps.length) {
  try {
    // When running in a Firebase environment (like Cloud Functions or App Hosting),
    // the SDK automatically discovers credentials.
    // For local development, ensure GOOGLE_APPLICATION_CREDENTIALS environment variable
    // is set to the path of your service account key JSON file.
    console.log('Firebase Admin SDK: No apps initialized. Attempting to initializeApp()...');
    admin.initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS or Firebase Hosting env
    console.log('Firebase Admin SDK initialized successfully (new instance).');
    
    // Assign services from the newly initialized default app
    adminDbInstance = admin.firestore();
    adminAuthInstance = admin.auth();
    adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;

  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error. This is critical for server-side operations (e.g., Genkit flows).');
    console.error('Please ensure that GOOGLE_APPLICATION_CREDENTIALS is set correctly in your environment variables if you are running this locally (e.g., in your .env or .env.local file, pointing to your service account JSON key file).');
    console.error('If running in a deployed Firebase environment, ensure the runtime service account has the necessary IAM permissions (e.g., "Firebase Admin SDK Administrator Service Agent" or specific roles like "Cloud Datastore User").');
    console.error('Error details: ', error.message, error.stack);
    // Re-throw the error to make it clear that initialization failed and dependent services will not work.
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}. Server-side Firebase operations will not be available. Please check your environment configuration and service account credentials/permissions.`);
  }
} else {
  // App already initialized, get the default app and assign services
  console.log(`Firebase Admin SDK: ${admin.apps.length} app(s) already initialized. Using default app.`);
  const defaultApp = admin.app(); // Gets the default app
  adminDbInstance = defaultApp.firestore();
  adminAuthInstance = defaultApp.auth();
  adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;
}

// Export the initialized instances.
// If initialization failed, the throw above would have prevented reaching here for the !admin.apps.length case.
// If it was already initialized, these would be set.
export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance; // Export auth if needed for other admin tasks
export const adminTimestamp = adminTimestampFn;
