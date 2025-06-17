import * as dotenv from 'dotenv';

export function loadEnvironment() {
    dotenv.config({ path: '.env.local' });

    const adminSdk = process.env.FIREBASE_ADMIN_SDK_BASE64;
    if (!adminSdk) {
        throw new Error('FIREBASE_ADMIN_SDK_BASE64 must be defined in .env.local');
    }

    return {
        adminSdk
    };
}