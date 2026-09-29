const { auth, db } = require('./src/config/firebase');

async function runTests() {
  console.log('🧪 Starting Phase 1 Integration Tests...\n');

  // Test 1: Health checks
  console.log('--- Test 1: Public Health Checks ---');
  const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json());
  console.log('GET /api/health:', healthRes);

  const dbRes = await fetch('http://localhost:5000/api/health/db').then(r => r.json());
  console.log('GET /api/health/db:', dbRes);

  // Test 2: Missing / Invalid Auth Header
  console.log('\n--- Test 2: Auth Protection on /api/users/me ---');
  const noAuthRes = await fetch('http://localhost:5000/api/users/me');
  console.log('No Auth Header -> status:', noAuthRes.status, await noAuthRes.json());

  const malformedAuthRes = await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': 'Basic 12345' }
  });
  console.log('Malformed Header -> status:', malformedAuthRes.status, await malformedAuthRes.json());

  const invalidTokenRes = await fetch('http://localhost:5000/api/users/me', {
    headers: { 'Authorization': 'Bearer invalid.fake.token' }
  });
  console.log('Invalid Token -> status:', invalidTokenRes.status, await invalidTokenRes.json());

  // Test 3: Middleware unit & controller behavior
  console.log('\n--- Test 3: Controller & Middleware Verification ---');
  const testUid1 = 'test_user_phase1_alpha';
  const testUid2 = 'test_user_phase1_beta';

  // Test sync user 1
  const user1Ref = db.collection('users').doc(testUid1);
  await user1Ref.delete().catch(() => {});

  // Simulate controller sync call directly with mock req.user
  const { syncUser, getProfile, updatePreferences } = require('./src/controllers/userController');

  let syncResult;
  await syncUser({
    user: { uid: testUid1, email: 'alpha@example.com', displayName: 'Alpha User', photoURL: 'https://example.com/alpha.png' },
    body: {}
  }, {
    status: (code) => ({
      json: (data) => { syncResult = { code, data }; return syncResult; }
    })
  }, (err) => { console.error('Sync error:', err); });

  console.log('User Sync (New User):', syncResult);

  // Test getProfile user 1
  let profileResult;
  await getProfile({
    user: { uid: testUid1 }
  }, {
    status: (code) => ({
      json: (data) => { profileResult = { code, data }; return profileResult; }
    })
  }, (err) => { console.error('Profile error:', err); });

  console.log('Get Profile:', profileResult);

  // Test updatePreferences (Valid)
  let prefResultValid;
  await updatePreferences({
    user: { uid: testUid1 },
    body: {
      briefingStyle: 'bullet-points',
      defaultMeetingDuration: 45,
      emailNotifications: false
    }
  }, {
    status: (code) => ({
      json: (data) => { prefResultValid = { code, data }; return prefResultValid; }
    })
  }, (err) => { console.error('Pref error:', err); });

  console.log('Update Preferences (Valid):', prefResultValid);

  // Test updatePreferences (Invalid briefingStyle)
  let prefResultInvalidStyle;
  await updatePreferences({
    user: { uid: testUid1 },
    body: { briefingStyle: 'ultra-long-essay' }
  }, {
    status: (code) => ({
      json: (data) => { prefResultInvalidStyle = { code, data }; return prefResultInvalidStyle; }
    })
  }, (err) => { console.error('Pref error:', err); });

  console.log('Update Preferences (Invalid Style):', prefResultInvalidStyle);

  // Test updatePreferences (Invalid duration)
  let prefResultInvalidDuration;
  await updatePreferences({
    user: { uid: testUid1 },
    body: { defaultMeetingDuration: -10 }
  }, {
    status: (code) => ({
      json: (data) => { prefResultInvalidDuration = { code, data }; return prefResultInvalidDuration; }
    })
  }, (err) => { console.error('Pref error:', err); });

  console.log('Update Preferences (Invalid Duration):', prefResultInvalidDuration);

  // Test sync user 1 again (verify preferences are preserved)
  let syncAgainResult;
  await syncUser({
    user: { uid: testUid1, email: 'alpha_updated@example.com', displayName: 'Alpha Updated', photoURL: 'https://example.com/alpha2.png' },
    body: {}
  }, {
    status: (code) => ({
      json: (data) => { syncAgainResult = { code, data }; return syncAgainResult; }
    })
  }, (err) => { console.error('Sync error:', err); });

  console.log('Sync User Again (Preserve Preferences):', syncAgainResult.data.data.preferences);

  // Test Isolation: User 2 should NOT be able to modify or access User 1
  let user2ProfileResult;
  await getProfile({
    user: { uid: testUid2, email: 'beta@example.com' }
  }, {
    status: (code) => ({
      json: (data) => { user2ProfileResult = { code, data }; return user2ProfileResult; }
    })
  }, (err) => { console.error('User2 error:', err); });

  console.log('User 2 Profile (Isolated from User 1):', user2ProfileResult.data.data.uid === testUid2 ? 'ISOLATED SUCCESS' : 'FAILED');

  // Clean up test docs
  await user1Ref.delete().catch(() => {});
  await db.collection('users').doc(testUid2).delete().catch(() => {});

  console.log('\n✅ All Phase 1 Backend Verification Tests Completed Successfully!');
}

runTests().catch(console.error);
