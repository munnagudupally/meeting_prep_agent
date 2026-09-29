const { auth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID Token from Authorization header
 */
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing Authorization header'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Malformed Authorization header. Expected Bearer <token>'
      });
    }

    const idToken = parts[1].trim();

    // In development / testing, support test tokens
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('test-token:')) {
      try {
        const payloadJson = Buffer.from(idToken.replace('test-token:', ''), 'base64').toString('utf8');
        const testUser = JSON.parse(payloadJson);
        if (testUser && testUser.uid) {
          req.user = {
            uid: testUser.uid,
            email: testUser.email || '',
            displayName: testUser.displayName || testUser.name || '',
            photoURL: testUser.photoURL || testUser.picture || ''
          };
          return next();
        }
      } catch (e) {
        // Fall through to real token verification
      }
    }

    // Verify token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);

    // Attach verified user identity
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || decodedToken.displayName || '',
      photoURL: decodedToken.picture || decodedToken.photo_url || ''
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token'
    });
  }
}

module.exports = {
  verifyAuth
};
