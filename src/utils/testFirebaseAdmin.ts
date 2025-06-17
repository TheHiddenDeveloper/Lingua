import { loadEnvironment } from '../lib/env';
import { adminDb } from '../lib/firebaseAdmin';

async function testFirebaseAdmin() {
    try {
        // First verify environment
        const env = loadEnvironment();
        console.log('Environment loaded successfully');

        // Test Firestore write
        const testDoc = adminDb.collection('_test_').doc('test');
        await testDoc.set({
            timestamp: new Date(),
            test: true
        });
        console.log('Successfully wrote to Firestore');

        // Clean up
        await testDoc.delete();
        console.log('Test successful - document written and deleted');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testFirebaseAdmin();