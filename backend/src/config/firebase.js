const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'meeting-prep-agent-6b26d';

let app;

// Singleton initialization
if (!getApps().length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
      ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : path.resolve(__dirname, '../../meeting-prep-agent-6b26d-firebase-adminsdk-fbsvc-d10844948c.json');

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }

    const serviceAccount = require(serviceAccountPath);

    if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
      throw new Error(`Project ID mismatch. Expected '${EXPECTED_PROJECT_ID}', but found '${serviceAccount.project_id}'`);
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: EXPECTED_PROJECT_ID
    });

    console.log(`🔥 Firebase Admin SDK initialized successfully for project: ${EXPECTED_PROJECT_ID}`);
  } catch (error) {
    console.error(`❌ Failed to initialize Firebase Admin SDK: ${error.message}`);
    throw error;
  }
} else {
  app = getApp();
}

// Firestore instance connected to the existing (default) database
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Safe connectivity check for Firestore without exposing sensitive credentials
 */
async function testFirestoreConnection() {
  try {
    const testDocRef = db.collection('_health_check').doc('connectivity_test');
    await testDocRef.set({
      lastChecked: FieldValue.serverTimestamp(),
      status: 'active'
    });
    const snapshot = await testDocRef.get();
    return {
      connected: true,
      projectId: EXPECTED_PROJECT_ID,
      database: '(default)',
      docExists: snapshot.exists
    };
  } catch (error) {
    console.error('Firestore connection test failed:', error.message);
    return {
      connected: false,
      projectId: EXPECTED_PROJECT_ID,
      error: error.message
    };
  }
}

module.exports = {
  app,
  db,
  auth,
  FieldValue,
  testFirestoreConnection
};
