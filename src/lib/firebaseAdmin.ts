
import * as admin from 'firebase-admin';
import * as path from 'path'; // Import path module

// Declare them here to ensure they are in scope for export, allow undefined if init fails.
let adminDbInstance: admin.firestore.Firestore | undefined;
let adminAuthInstance: admin.auth.Auth | undefined;
let adminTimestampFn: (() => admin.firestore.FieldValue) | undefined;

if (!admin.apps.length) {
  let initializationAttemptError: any | null = null; // Store error from credential.cert attempt
  let resolvedCredPathForError: string | null = null;

  try {
    console.log('Firebase Admin SDK: No apps initialized. Attempting to initializeApp()...');
    const credPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`Firebase Admin SDK DEBUG: GOOGLE_APPLICATION_CREDENTIALS value from env: '${credPathFromEnv}'`);
    const currentWorkingDirectory = process.cwd();
    console.log(`Firebase Admin SDK DEBUG: Current working directory (process.cwd()): '${currentWorkingDirectory}'`);

    let credentialToUse: admin.credential.Credential;

    if (credPathFromEnv) {
      // Resolve the path. If credPathFromEnv is already absolute, resolve does nothing.
      // If it's relative, it's resolved against currentWorkingDirectory.
      const absolutePath = path.resolve(currentWorkingDirectory, credPathFromEnv);
      resolvedCredPathForError = absolutePath; // Store for potential error message
      console.log(`Firebase Admin SDK: Attempting to use credentials from resolved path: '${absolutePath}'`);
      try {
        credentialToUse = admin.credential.cert(absolutePath);
        console.log(`Firebase Admin SDK: Successfully created credential object from path: '${absolutePath}'`);
      } catch (pathError: any) {
        initializationAttemptError = pathError; // Capture this specific error
        console.warn(`Firebase Admin SDK WARNING: Could not load credentials from path '${absolutePath}'. Error: ${pathError.message}. Falling back to applicationDefault().`);
        console.error('Firebase Admin SDK PathError Details:', pathError);
        credentialToUse = admin.credential.applicationDefault();
        console.log('Firebase Admin SDK: Using applicationDefault() as fallback due to path error.');
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

  } catch (error: any) { // This is the outer catch for initializeApp or other issues
    let detailedErrorMessage = `Firebase Admin SDK initialization failed: ${error.message}. Server-side Firebase operations will not be available. `;
    
    if (initializationAttemptError) {
      detailedErrorMessage += `\nDETAILS FROM CREDENTIAL LOADING ATTEMPT: Failed to load credentials using admin.credential.cert() from path specified by GOOGLE_APPLICATION_CREDENTIALS (env value: '${process.env.GOOGLE_APPLICATION_CREDENTIALS}', resolved to: '${resolvedCredPathForError}'). Specific error: ${initializationAttemptError.message}. `;
    }

    if (error.message && error.message.toLowerCase().includes("cannot read properties of undefined (reading 'internal')")) {
      detailedErrorMessage += "This specific 'INTERNAL' error often means the GOOGLE_APPLICATION_CREDENTIALS environment variable is missing, pointing to an invalid/inaccessible file, the JSON file is corrupted, or the Admin SDK is in a broken state due to credential issues. ";
    } else if (error.message && error.message.toLowerCase().includes("google_application_credentials environment variable is not set")) {
      detailedErrorMessage += "The GOOGLE_APPLICATION_CREDENTIALS environment variable was not detected by the Admin SDK. Ensure it's set correctly. ";
    } else if (error.message && (error.message.toLowerCase().includes("econnrefused") || error.message.toLowerCase().includes("metadata service"))) {
      detailedErrorMessage += "This might indicate an issue with network access to Google's metadata service, or that applicationDefault() is being used in an environment where it can't find credentials (like local dev without GOOGLE_APPLICATION_CREDENTIALS set). ";
    }
    
    detailedErrorMessage += "Please double-check the GOOGLE_APPLICATION_CREDENTIALS path, file integrity, and its read permissions within the Firebase Studio environment. Also verify the Genkit process's current working directory via logs if using relative paths.";

    console.error('Firebase Admin SDK initialization error. This is critical for server-side operations (e.g., Genkit flows).');
    console.error(detailedErrorMessage);
    if (initializationAttemptError) console.error('PathError Stack (if available):', initializationAttemptError.stack);
    console.error('Original error stack (from initializeApp or broader scope): ', error.stack);
    throw new Error(detailedErrorMessage);
  }
} else {
  console.log(`Firebase Admin SDK: ${admin.apps.length} app(s) already initialized. Using default app.`);
  const defaultApp = admin.app(); 
  adminDbInstance = defaultApp.firestore();
  adminAuthInstance = defaultApp.auth();
  adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;
}

// Use non-null assertion operator carefully, or handle potential undefined state if preferred.
// Throwing an error on init failure (as done above) makes these less likely to be undefined when accessed.
export const adminDb = adminDbInstance!;
export const adminAuth = adminAuthInstance!;
export const adminTimestamp = adminTimestampFn!;
