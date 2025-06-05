
import * as admin from 'firebase-admin';
import * as path from 'path'; // Import path module

let adminDbInstance: admin.firestore.Firestore;
let adminAuthInstance: admin.auth.Auth;
let adminTimestampFn: () => admin.firestore.FieldValue;

if (!admin.apps.length) {
  try {
    console.log('Firebase Admin SDK: No apps initialized. Attempting to initializeApp()...');
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`DEBUG: GOOGLE_APPLICATION_CREDENTIALS value is: '${credPath}'`);

    let credentialToUse: admin.credential.Credential;

    if (credPath) {
      try {
        // Resolve path if it's relative (e.g., starting with ./)
        // This assumes the current working directory is the project root.
        const absolutePath = path.resolve(credPath);
        console.log(`Firebase Admin SDK: Attempting to use credentials from resolved path: '${absolutePath}'`);
        credentialToUse = admin.credential.cert(absolutePath);
      } catch (pathError: any) {
        console.warn(`Firebase Admin SDK: Could not load credentials directly from path specified in GOOGLE_APPLICATION_CREDENTIALS ('${credPath}'). Error: ${pathError.message}. Falling back to applicationDefault().`);
        console.error('PathError Details:', pathError);
        credentialToUse = admin.credential.applicationDefault();
      }
    } else {
      console.log('Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS not set. Using applicationDefault(). This is expected in some Firebase-hosted environments.');
      credentialToUse = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential: credentialToUse,
    });
    
    console.log('Firebase Admin SDK initialized successfully.');
    
    adminDbInstance = admin.firestore();
    adminAuthInstance = admin.auth();
    adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;

  } catch (error: any) {
    let detailedErrorMessage = `Firebase Admin SDK initialization failed: ${error.message}. Server-side Firebase operations will not be available. `;
    if (error.message && error.message.toLowerCase().includes("cannot read properties of undefined (reading 'internal')")) {
      detailedErrorMessage += "This specific error often means the GOOGLE_APPLICATION_CREDENTIALS environment variable is missing, pointing to an invalid/inaccessible file, or the JSON file is corrupted. Please double-check this variable and the service account key file.";
    } else if (error.message && error.message.toLowerCase().includes("google_application_credentials environment variable is not set")) {
      detailedErrorMessage += "The GOOGLE_APPLICATION_CREDENTIALS environment variable was not detected by the Admin SDK. Ensure it's set correctly in your .env or .env.local file and that your server process has been restarted.";
    } else if (error.message && (error.message.toLowerCase().includes("econnrefused") || error.message.toLowerCase().includes("metadata service"))) {
      detailedErrorMessage += "This might indicate an issue with network access to Google's metadata service, or that applicationDefault() is being used in an environment where it can't find credentials (like local dev without GOOGLE_APPLICATION_CREDENTIALS set).";
    } else {
      detailedErrorMessage += "Please ensure that GOOGLE_APPLICATION_CREDENTIALS is set correctly in your environment variables if you are running this locally (e.g., in your .env or .env.local file, pointing to your service account JSON key file). If running in a deployed Firebase environment, ensure the runtime service account has the necessary IAM permissions (e.g., 'Firebase Admin SDK Administrator Service Agent' or specific roles like 'Cloud Datastore User').";
    }
    console.error('Firebase Admin SDK initialization error. This is critical for server-side operations (e.g., Genkit flows).');
    console.error(detailedErrorMessage);
    console.error('Original error stack: ', error.stack);
    throw new Error(detailedErrorMessage);
  }
} else {
  console.log(`Firebase Admin SDK: ${admin.apps.length} app(s) already initialized. Using default app.`);
  const defaultApp = admin.app(); 
  adminDbInstance = defaultApp.firestore();
  adminAuthInstance = defaultApp.auth();
  adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;
}

export const adminDb = adminDbInstance;
export const adminAuth = adminAuthInstance;
export const adminTimestamp = adminTimestampFn;
