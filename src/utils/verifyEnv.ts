console.log('FIREBASE_ADMIN_SDK_BASE64 exists:', !!process.env.FIREBASE_ADMIN_SDK_BASE64);
if (process.env.FIREBASE_ADMIN_SDK_BASE64) {
    console.log('First 50 characters:', process.env.FIREBASE_ADMIN_SDK_BASE64.substring(0, 50));
}