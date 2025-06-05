
import * as admin from 'firebase-admin';
import * as path from 'path'; // Keep path for potential future use or other logic

// Declare them here to ensure they are in scope for export, allow undefined if init fails.
let adminDbInstance: admin.firestore.Firestore | undefined;
let adminAuthInstance: admin.auth.Auth | undefined;
let adminTimestampFn: (() => admin.firestore.FieldValue) | undefined;

if (!admin.apps.length) {
  console.log('Firebase Admin SDK: No apps initialized. Attempting to initializeApp()...');
  
  const hardcodedCredPath = "/home/user/studio/linguaghana-umat-firebase-adminsdk-fbsvc-bd179614fc.json";
  let credentialToUse: admin.credential.Credential | undefined;
  let initializationAttemptError: any | null = null;

  console.log(`Firebase Admin SDK DEBUG: Attempting to load credentials directly from hardcoded path: '${hardcodedCredPath}'`);
  try {
    credentialToUse = admin.credential.cert(hardcodedCredPath);
    console.log(`Firebase Admin SDK: Successfully created credential object from hardcoded path: '${hardcodedCredPath}'`);
  } catch (pathError: any) {
    initializationAttemptError = pathError;
    console.warn(`Firebase Admin SDK WARNING: Could not load credentials from hardcoded path '${hardcodedCredPath}'. Error: ${pathError.message}. Falling back to applicationDefault().`);
    console.error('Firebase Admin SDK PathError Details (from hardcoded path):', pathError);
    try {
      credentialToUse = admin.credential.applicationDefault();
      console.log('Firebase Admin SDK: Using applicationDefault() as fallback after hardcoded path failure.');
    } catch (appDefaultError: any) {
      // This case means both hardcoded path and applicationDefault failed.
      initializationAttemptError = appDefaultError; // Store the latest error
      console.error('Firebase Admin SDK CRITICAL: Both hardcoded path and applicationDefault() failed to provide credentials.', appDefaultError);
    }
  }

  if (credentialToUse) {
    try {
      admin.initializeApp({
        credential: credentialToUse,
      });
      console.log('Firebase Admin SDK initialized successfully.');
      adminDbInstance = admin.firestore();
      adminAuthInstance = admin.auth();
      adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;
    } catch (initError: any) {
      initializationAttemptError = initError; // Capture init error
      console.error('Firebase Admin SDK CRITICAL: initializeApp() failed even after obtaining a credential object.', initError);
    }
  } else {
     console.error('Firebase Admin SDK CRITICAL: No credential object could be created (hardcoded path and applicationDefault failed).');
     // initializationAttemptError should already be set from previous blocks
  }

  // Handle any error that occurred during the process
  if (initializationAttemptError || !admin.apps.length) {
    let detailedErrorMessage = `Firebase Admin SDK initialization failed. Server-side Firebase operations will not be available.`;
    
    if (initializationAttemptError) {
        detailedErrorMessage += ` Last known error: ${initializationAttemptError.message}.`;
    }
    if (initializationAttemptError && initializationAttemptError.message && (initializationAttemptError.message.includes('INTERNAL') || initializationAttemptError.message.includes('Unable to detect a Project Id'))) {
      detailedErrorMessage += ` This specific error often means the service account key file is malformed, has incorrect permissions, or the Admin SDK cannot connect to Google services. Path tried: '${hardcodedCredPath}'.`;
    }
    
    console.error('Firebase Admin SDK initialization error summary:');
    console.error(detailedErrorMessage);
    if (initializationAttemptError) console.error('Error Stack (if available):', initializationAttemptError.stack);
    
    // Re-throw to halt dependent operations
    throw new Error(detailedErrorMessage);
  }

} else {
  console.log(`Firebase Admin SDK: ${admin.apps.length} app(s) already initialized. Using default app.`);
  const defaultApp = admin.app(); 
  adminDbInstance = defaultApp.firestore();
  adminAuthInstance = defaultApp.auth();
  adminTimestampFn = admin.firestore.FieldValue.serverTimestamp;
}

export const adminDb = adminDbInstance!;
export const adminAuth = adminAuthInstance!;
export const adminTimestamp = adminTimestampFn!;
