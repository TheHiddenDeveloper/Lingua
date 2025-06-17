import { adminDb } from '@/lib/firebaseAdmin';

async function testAdminSDK() {
    try {
        // Test collection write
        const testRef = adminDb.collection('test').doc('admin-test');
        await testRef.set({
            test: true,
            timestamp: new Date()
        });

        // Read it back
        const doc = await testRef.get();
        console.log('Test document data:', doc.data());

        // Clean up
        await testRef.delete();
        console.log('Admin SDK test successful!');
    } catch (error) {
        console.error('Admin SDK test failed:', error);
    }
}

testAdminSDK();