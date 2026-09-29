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
    let serviceAccount = null;

    // 1. Check if direct JSON or base64 string is provided in environment variables (for Render/Vercel/Cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      try {
        if (rawKey.startsWith('{')) {
          serviceAccount = JSON.parse(rawKey);
        } else {
          // Attempt base64 decode
          const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        }
      } catch (err) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${err.message}`);
      }
    } else {
      // 2. Fall back to file path (local development or Render Secret File)
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
        ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : path.resolve(__dirname, '../../meeting-prep-agent-6b26d-firebase-adminsdk-fbsvc-d10844948c.json');

      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
          `Service account credentials not found! On Render, please set the 'FIREBASE_SERVICE_ACCOUNT_KEY' environment variable with your Firebase service account JSON content (or upload the file via Render 'Secret Files'). Looked for file at: ${serviceAccountPath}`
        );
      }

      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    if (serviceAccount.project_id && EXPECTED_PROJECT_ID && serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
      console.warn(`[Firebase] Notice: Project ID '${serviceAccount.project_id}' differs from EXPECTED_PROJECT_ID '${EXPECTED_PROJECT_ID}'`);
    }

    const projectId = serviceAccount.project_id || EXPECTED_PROJECT_ID;

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId
    });

    console.log(`🔥 Firebase Admin SDK initialized successfully for project: ${projectId}`);
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
