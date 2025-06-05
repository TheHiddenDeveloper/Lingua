
import * as admin from 'firebase-admin';

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;
let adminTimestampFn: () => admin.firestore.FieldValue;

// Check if we've already initialized to prevent re-initialization errors.
if (!admin.apps.length) {
  try {
    console.log('Firebase Admin SDK: No apps initialized. Attempting to initializeApp()...');
    // When running in a Firebase environment (like Cloud Functions or App Hosting),
    // the SDK automatically discovers credentials.
    // For local development, ensure GOOGLE_APPLICATION_CREDENTIALS environment variable
    // is set to the path of your service account key JSON file.
    admin.initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS or Firebase Hosting env
    console.log('Firebase Admin SDK initialized successfully (new instance).');
    
    // Assign services from the newly initialized default app
    adminDbInstance = admin.firestore();
    adminAuthInstance = admin.auth();
    adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;

  } catch (error: any) {
    let detailedErrorMessage = `Firebase Admin SDK initialization failed: ${error.message}. Server-side Firebase operations will not be available. `;
    if (error.message && error.message.toLowerCase().includes("cannot read properties of undefined (reading 'internal')")) {
      detailedErrorMessage += "This specific error often means the GOOGLE_APPLICATION_CREDENTIALS environment variable is missing, pointing to an invalid/inaccessible file, or the JSON file is corrupted. Please double-check this variable and the service account key file.";
    } else {
      detailedErrorMessage += "Please ensure that GOOGLE_APPLICATION_CREDENTIALS is set correctly in your environment variables if you are running this locally (e.g., in your .env or .env.local file, pointing to your service account JSON key file). If running in a deployed Firebase environment, ensure the runtime service account has the necessary IAM permissions (e.g., 'Firebase Admin SDK Administrator Service Agent' or specific roles like 'Cloud Datastore User').";
    }
    console.error('Firebase Admin SDK initialization error. This is critical for server-side operations (e.g., Genkit flows).');
    console.error(detailedErrorMessage);
    console.error('Original error stack: ', error.stack);
    // Re-throw the error to make it clear that initialization failed.
    throw new Error(detailedErrorMessage);
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
export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export const adminTimestamp = adminTimestampFn;
