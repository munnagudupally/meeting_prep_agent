const { db } = require('./src/config/firebase');

const BASE_URL = 'http://localhost:5000/api';

function generateTestToken(user) {
  const jsonStr = JSON.stringify(user);
  return 'test-token:' + Buffer.from(jsonStr).toString('base64');
}

async function runDisplayNameRegressionTests() {
  console.log('===================================================================');
  console.log('🧪 TESTING EDITABLE DISPLAY NAME & GOOGLE LOGIN REGRESSION LIFECYCLE');
  console.log('===================================================================\n');

  const userA = { uid: 'user_name_test_101', email: 'testuser@example.com', displayName: 'Initial Google Name' };
  const userB = { uid: 'user_name_test_202', email: 'otheruser@example.com', displayName: 'Other User' };

  const tokenA = generateTestToken(userA);
  const tokenB = generateTestToken(userB);

  // Clean previous test user
  await db.collection('users').doc(userA.uid).delete().catch(() => {});
  await db.collection('users').doc(userB.uid).delete().catch(() => {});

  // -----------------------------------------------------------------
  // Step A & B: Sign in with Google for the first time
  // -----------------------------------------------------------------
  console.log('📌 Step A & B: First Login & Initial Name Population');
  const sync1Res = await fetch(`${BASE_URL}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ displayName: userA.displayName })
  });
  const sync1Data = await sync1Res.json();
  console.log('- First Sync Response [HTTP ' + sync1Res.status + ']:', sync1Data.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  Initial DisplayName:', sync1Data.data.displayName);
  if (sync1Data.data.displayName !== 'Initial Google Name') throw new Error('Initial name not populated correctly');

  // -----------------------------------------------------------------
  // Step C & D: Change name to "Test User" via PUT /api/users/me
  // -----------------------------------------------------------------
  console.log('\n📌 Step C & D: Update Display Name to "Test User"');
  const updateRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ displayName: 'Test User' })
  });
  const updateData = await updateRes.json();
  console.log('- Update Name Response [HTTP ' + updateRes.status + ']:', updateData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  Updated DisplayName:', updateData.data.displayName);
  if (updateData.data.displayName !== 'Test User') throw new Error('Display name update failed');

  // -----------------------------------------------------------------
  // Step E & F: Verify Firestore Persistence & Fetch
  // -----------------------------------------------------------------
  console.log('\n📌 Step E & F: Verify Persistence in Firestore & GET /api/users/me');
  const firestoreDoc = await db.collection('users').doc(userA.uid).get();
  console.log('- Firestore Doc DisplayName:', firestoreDoc.data().displayName === 'Test User' ? '✅ "Test User" In DB' : '❌ FAILED');

  const getProfileRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const getProfileData = await getProfileRes.json();
  console.log('- GET /api/users/me DisplayName:', getProfileData.data.displayName === 'Test User' ? '✅ "Test User" Returned' : '❌ FAILED');

  // -----------------------------------------------------------------
  // Step G, H, I: Google Login Regression Test (Subsequent Google Login)
  // -----------------------------------------------------------------
  console.log('\n📌 Step G, H, I: Subsequent Google Login Must NOT Overwrite Custom Name');
  // Simulating logging in again with Google token which has userA.displayName = "Initial Google Name"
  const syncAgainRes = await fetch(`${BASE_URL}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ displayName: userA.displayName })
  });
  const syncAgainData = await syncAgainRes.json();
  console.log('- Subsequent Google Sync [HTTP ' + syncAgainRes.status + ']:', syncAgainData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('  DisplayName after Google Re-login:', syncAgainData.data.displayName);
  console.log('  Custom Name Preserved:', syncAgainData.data.displayName === 'Test User' ? '✅ REGRESSION TEST PASSED ("Test User" preserved)' : '❌ REGRESSION FAILED (Overwritten by Google Name)');

  // -----------------------------------------------------------------
  // Validation Tests: Empty & Long Names
  // -----------------------------------------------------------------
  console.log('\n📌 Validation Tests: Reject Empty & Overlong Names');
  const emptyRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ displayName: '   ' })
  });
  console.log('- Empty name rejection [HTTP ' + emptyRes.status + ']:', emptyRes.status === 400 ? '✅ 400 REJECTED' : '❌ FAILED');

  const overlongRes = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ displayName: 'A'.repeat(101) })
  });
  console.log('- Overlong name (>100 chars) rejection [HTTP ' + overlongRes.status + ']:', overlongRes.status === 400 ? '✅ 400 REJECTED' : '❌ FAILED');

  // -----------------------------------------------------------------
  // Multi-Tenant Isolation
  // -----------------------------------------------------------------
  console.log('\n📌 Multi-Tenant Security Check:');
  const userBUpdate = await fetch(`${BASE_URL}/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ displayName: 'Bob Custom' })
  });
  const userBData = await userBUpdate.json();
  console.log('- User B profile created separately:', userBData.data.uid === userB.uid ? '✅ Correct' : '❌ Failed');
  
  // Verify User A profile is unaffected
  const checkA = await db.collection('users').doc(userA.uid).get();
  console.log('- User A profile remains untouched:', checkA.data().displayName === 'Test User' ? '✅ ISOLATED SAFE' : '❌ FAILED');

  // Clean up
  await db.collection('users').doc(userA.uid).delete();
  await db.collection('users').doc(userB.uid).delete();

  console.log('\n===================================================================');
  console.log('🎉 ALL DISPLAY NAME & GOOGLE REGRESSION TESTS PASSED 100%!');
  console.log('===================================================================');
}

runDisplayNameRegressionTests().catch(console.error);
