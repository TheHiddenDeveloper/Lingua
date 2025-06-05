
import * as admin from 'firebase-admin';

// Ensure this file is only processed once by checking admin.apps.length
if (!admin.apps.length) {
  try {
    // When running in a Firebase environment (like Cloud Functions or App Hosting),
    // the SDK automatically discovers credentials.
    // For local development, ensure GOOGLE_APPLICATION_CREDENTIALS environment variable
    // is set to the path of your service account key JSON file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error. This is critical for server-side operations (e.g., Genkit flows).');
    console.error('Please ensure that GOOGLE_APPLICATION_CREDENTIALS is set correctly in your environment variables if you are running this locally (e.g., in your .env or .env.local file, pointing to your service account JSON key file).');
    console.error('If running in a deployed Firebase environment, ensure the runtime service account has the necessary IAM permissions (e.g., "Firebase Admin SDK Administrator Service Agent" or specific roles like "Cloud Datastore User").');
    console.error('Error details: ', error.message, error.stack);
    // Re-throw the error to make it clear that initialization failed and dependent services will not work.
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}. Server-side Firebase operations will not be available. Please check your environment configuration and service account credentials/permissions.`);
  }
}

// If initializeApp failed and threw an error, these lines won't be reached.
// If it succeeded, or if an app was already initialized, these will work.
export const adminDb = admin.firestore();
export const adminAuth = admin.auth(); // Export auth if needed for other admin tasks
export const adminTimestamp = admin.firestore.FieldValue.serverTimestamp;

