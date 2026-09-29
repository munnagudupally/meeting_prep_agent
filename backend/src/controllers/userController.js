const { db, FieldValue } = require('../config/firebase');

const USERS_COLLECTION = 'users';

const DEFAULT_PREFERENCES = {
  briefingStyle: 'concise',
  defaultMeetingDuration: 30,
  emailNotifications: true
};

const ALLOWED_BRIEFING_STYLES = ['concise', 'detailed', 'bullet-points'];

/**
 * Sync user profile to Firestore upon authentication
 * POST /api/users/sync
 */
async function syncUser(req, res, next) {
  try {
    const { uid, email, displayName, photoURL } = req.user;
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      const newUser = {
        uid,
        email: email || '',
        displayName: displayName || req.body.displayName || '',
        photoURL: photoURL || req.body.photoURL || '',
        preferences: DEFAULT_PREFERENCES,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await userRef.set(newUser);
      const createdDoc = await userRef.get();

      return res.status(201).json({
        success: true,
        data: {
          id: createdDoc.id,
          ...createdDoc.data()
        },
        user: {
          id: createdDoc.id,
          ...createdDoc.data()
        }
      });
    } else {
      const existingData = doc.data();
      
      // CRITICAL: Preserve custom Firestore displayName if it was already set/customized
      const finalDisplayName = (existingData.displayName && existingData.displayName.trim())
        ? existingData.displayName
        : (displayName || req.body.displayName || '');

      const updates = {
        email: email || existingData.email || '',
        displayName: finalDisplayName,
        photoURL: photoURL || req.body.photoURL || existingData.photoURL || '',
        updatedAt: FieldValue.serverTimestamp()
      };

      // Preserve existing preferences
      await userRef.update(updates);
      const updatedDoc = await userRef.get();

      return res.status(200).json({
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        },
        user: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * GET /api/users/me
 */
async function getProfile(req, res, next) {
  try {
    const { uid, email, displayName, photoURL } = req.user;
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    let doc = await userRef.get();

    // If profile does not exist yet, auto-sync and create
    if (!doc.exists) {
      const initialUser = {
        uid,
        email: email || '',
        displayName: displayName || '',
        photoURL: photoURL || '',
        preferences: DEFAULT_PREFERENCES,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await userRef.set(initialUser);
      doc = await userRef.get();
    }

    return res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      },
      user: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile (editable display name)
 * PUT /api/users/me
 */
async function updateProfile(req, res, next) {
  try {
    const { uid, email, photoURL } = req.user;
    const { displayName } = req.body;

    if (displayName === undefined || typeof displayName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Display name is required and must be a string'
      });
    }

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        error: 'Display name cannot be empty'
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Display name must not exceed 100 characters'
      });
    }

    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      const initialUser = {
        uid,
        email: email || '',
        displayName: trimmedName,
        photoURL: photoURL || '',
        preferences: DEFAULT_PREFERENCES,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await userRef.set(initialUser);
    } else {
      await userRef.update({
        displayName: trimmedName,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    const updatedDoc = await userRef.get();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      user: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user preferences
 * PUT /api/users/preferences
 */
async function updatePreferences(req, res, next) {
  try {
    const { uid } = req.user;
    const { briefingStyle, defaultMeetingDuration, emailNotifications } = req.body;

    // Validate that at least one valid preference is provided
    if (briefingStyle === undefined && defaultMeetingDuration === undefined && emailNotifications === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No valid preference fields provided for update'
      });
    }

    const validatedUpdates = {};

    // Validate briefingStyle
    if (briefingStyle !== undefined) {
      if (typeof briefingStyle !== 'string' || !ALLOWED_BRIEFING_STYLES.includes(briefingStyle)) {
        return res.status(400).json({
          success: false,
          error: `Invalid briefingStyle. Must be one of: ${ALLOWED_BRIEFING_STYLES.join(', ')}`
        });
      }
      validatedUpdates['preferences.briefingStyle'] = briefingStyle;
    }

    // Validate defaultMeetingDuration
    if (defaultMeetingDuration !== undefined) {
      const durationNum = Number(defaultMeetingDuration);
      if (!Number.isInteger(durationNum) || durationNum <= 0 || durationNum > 480) {
        return res.status(400).json({
          success: false,
          error: 'Invalid defaultMeetingDuration. Must be a positive integer between 1 and 480 minutes'
        });
      }
      validatedUpdates['preferences.defaultMeetingDuration'] = durationNum;
    }

    // Validate emailNotifications
    if (emailNotifications !== undefined) {
      if (typeof emailNotifications !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid emailNotifications. Must be a boolean (true or false)'
        });
      }
      validatedUpdates['preferences.emailNotifications'] = emailNotifications;
    }

    validatedUpdates.updatedAt = FieldValue.serverTimestamp();

    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    let doc = await userRef.get();

    // Ensure document exists before updating preferences
    if (!doc.exists) {
      const initialUser = {
        uid,
        email: req.user.email || '',
        displayName: req.user.displayName || '',
        photoURL: req.user.photoURL || '',
        preferences: DEFAULT_PREFERENCES,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await userRef.set(initialUser);
    }

    await userRef.update(validatedUpdates);
    doc = await userRef.get();

    return res.status(200).json({
      success: true,
      data: doc.data().preferences
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  syncUser,
  getProfile,
  updateProfile,
  updatePreferences
};
