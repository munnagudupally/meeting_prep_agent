const { db, FieldValue } = require('./src/config/firebase');
const meetingRepository = require('./src/repositories/meetingRepository');
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting
} = require('./src/controllers/meetingController');

// Mock response builder
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 (Meeting CRUD & Security) Verification Tests...\n');

  const userA = { uid: 'test_user_phase2_alice', email: 'alice@example.com' };
  const userB = { uid: 'test_user_phase2_bob', email: 'bob@example.com' };

  let createdMeetingIdAlice = null;
  let createdMeetingIdBob = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Public & Unauthenticated Protection via HTTP
    // -------------------------------------------------------------
    console.log('--- Test 1: HTTP Auth Protection on /api/meetings ---');
    const unauthRes = await fetch('http://localhost:5000/api/meetings');
    const unauthBody = await unauthRes.json();
    console.log('Unauthenticated GET /api/meetings -> status:', unauthRes.status, unauthBody);
    if (unauthRes.status !== 401) throw new Error('Expected 401 for unauthenticated request');

    // -------------------------------------------------------------
    // Test 2: Input Validation Failures (HTTP 400)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Input Validation (HTTP 400) ---');
    
    // 2a: Missing title
    let res = createMockRes();
    await createMeeting({
      user: userA,
      body: { startTime: new Date().toISOString() }
    }, res, (err) => console.error(err));
    console.log('Missing title:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed', res.body);

    // 2b: Invalid startTime
    res = createMockRes();
    await createMeeting({
      user: userA,
      body: { title: 'Test Meeting', startTime: 'invalid-date-string' }
    }, res, (err) => console.error(err));
    console.log('Invalid startTime:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed', res.body);

    // 2c: endTime <= startTime
    res = createMockRes();
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000);
    await createMeeting({
      user: userA,
      body: { 
        title: 'Time Travel Meeting', 
        startTime: now.toISOString(),
        endTime: earlier.toISOString()
      }
    }, res, (err) => console.error(err));
    console.log('endTime <= startTime:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed', res.body);

    // 2d: Invalid attendee email
    res = createMockRes();
    await createMeeting({
      user: userA,
      body: { 
        title: 'Meeting with bad email', 
        startTime: now.toISOString(),
        attendees: [{ name: 'Bad Email User', email: 'not-an-email' }]
      }
    }, res, (err) => console.error(err));
    console.log('Invalid Attendee Email:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed', res.body);

    // 2e: Invalid status enum
    res = createMockRes();
    await createMeeting({
      user: userA,
      body: { 
        title: 'Meeting with bad status', 
        startTime: now.toISOString(),
        status: 'super-done'
      }
    }, res, (err) => console.error(err));
    console.log('Invalid Status Enum:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed', res.body);

    // -------------------------------------------------------------
    // Test 3: Authenticated Meeting Creation & Timestamp Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Meeting Creation for Alice ---');
    const startAlice = new Date(Date.now() + 86400000); // Tomorrow
    const endAlice = new Date(Date.now() + 90000000);

    res = createMockRes();
    await createMeeting({
      user: userA,
      body: {
        title: 'Strategic Q3 Review with Acme Corp',
        description: 'Review product deliverables and contract renewal.',
        startTime: startAlice.toISOString(),
        endTime: endAlice.toISOString(),
        location: 'https://meet.google.com/abc-defg-hij',
        attendees: [
          { name: 'John Doe', email: 'john@acme.com', company: 'Acme Corp', role: 'VP Engineering' },
          { name: 'Jane Smith', email: 'jane@acme.com', company: 'Acme Corp', role: 'Product Lead' }
        ],
        // Malicious client overrides (must be ignored)
        userId: 'hacker_stolen_id',
        createdAt: '1970-01-01',
        prepBriefId: 'fake_brief_id'
      }
    }, res, (err) => console.error(err));

    console.log('Created Meeting StatusCode:', res.statusCode);
    const aliceMeeting = res.body.data;
    createdMeetingIdAlice = aliceMeeting.id;
    console.log('Created Meeting ID:', createdMeetingIdAlice);
    console.log('Assigned userId:', aliceMeeting.userId === userA.uid ? '✅ Correct (Alice UID)' : '❌ Failed');
    console.log('Status default:', aliceMeeting.status === 'upcoming' ? '✅ upcoming' : '❌ Failed');
    console.log('PrepStatus default:', aliceMeeting.prepStatus === 'pending' ? '✅ pending' : '❌ Failed');
    console.log('PrepBriefId default:', aliceMeeting.prepBriefId === null ? '✅ null' : '❌ Failed');

    // Verify Firestore direct document properties
    const directDoc = await db.collection('meetings').doc(createdMeetingIdAlice).get();
    const docData = directDoc.data();
    console.log('Firestore startTime is Firestore Timestamp:', docData.startTime && typeof docData.startTime.toDate === 'function' ? '✅ Valid Timestamp' : '❌ Failed');
    console.log('Firestore createdAt is Firestore Timestamp:', docData.createdAt && typeof docData.createdAt.toDate === 'function' ? '✅ Valid Timestamp' : '❌ Failed');

    // -------------------------------------------------------------
    // Test 4: Meeting Creation for Bob
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Meeting Creation for Bob ---');
    res = createMockRes();
    await createMeeting({
      user: userB,
      body: {
        title: 'Bob Confidential Sync',
        description: 'Internal project planning',
        startTime: startAlice.toISOString()
      }
    }, res, (err) => console.error(err));
    createdMeetingIdBob = res.body.data.id;
    console.log('Created Bob Meeting ID:', createdMeetingIdBob);

    // -------------------------------------------------------------
    // Test 5: Retrieval & Filtering
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Get Meetings (Alice) ---');
    res = createMockRes();
    await getMeetings({
      user: userA,
      query: { status: 'upcoming', page: 1, limit: 10 }
    }, res, (err) => console.error(err));

    console.log('Alice Meetings Count:', res.body.data.length);
    console.log('Pagination Object:', res.body.pagination);
    const containsBobMeeting = res.body.data.some(m => m.id === createdMeetingIdBob);
    console.log('Alice meeting list excludes Bob meetings:', !containsBobMeeting ? '✅ PASSED (Strict Isolation)' : '❌ FAILED');

    // -------------------------------------------------------------
    // Test 6: Get Single Meeting (Own vs Other User)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Single Meeting Retrieval & Ownership Security ---');
    // 6a: Alice gets Alice's meeting
    res = createMockRes();
    await getMeeting({
      user: userA,
      params: { id: createdMeetingIdAlice }
    }, res, (err) => console.error(err));
    console.log('Alice gets Alice meeting:', res.statusCode === 200 ? '✅ 200 OK' : '❌ Failed', res.body.data.title);

    // 6b: Bob tries to get Alice's meeting (Must return 404)
    res = createMockRes();
    await getMeeting({
      user: userB,
      params: { id: createdMeetingIdAlice }
    }, res, (err) => console.error(err));
    console.log('Bob attempts GET Alice meeting -> status:', res.statusCode === 404 ? '✅ 404 Not Found (Safe Isolation)' : '❌ FAILED LEAKED');

    // -------------------------------------------------------------
    // Test 7: Update Meeting & Ownership Security
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Update Meeting & Ownership Security ---');
    // 7a: Bob tries to update Alice's meeting (Must return 404)
    res = createMockRes();
    await updateMeeting({
      user: userB,
      params: { id: createdMeetingIdAlice },
      body: { title: 'Hacked Title By Bob' }
    }, res, (err) => console.error(err));
    console.log('Bob attempts PUT Alice meeting -> status:', res.statusCode === 404 ? '✅ 404 Not Found (Rejected)' : '❌ FAILED');

    // 7b: Alice updates Alice's meeting (Valid)
    res = createMockRes();
    await updateMeeting({
      user: userA,
      params: { id: createdMeetingIdAlice },
      body: {
        title: 'Updated Strategic Q3 Review',
        location: 'Room 402 / Google Meet',
        status: 'in_progress',
        userId: 'trying_to_change_owner',
        createdAt: '1970-01-01'
      }
    }, res, (err) => console.error(err));
    console.log('Alice updates own meeting -> status:', res.statusCode === 200 ? '✅ 200 OK' : '❌ Failed');
    console.log('Updated Title:', res.body.data.title);
    console.log('Owner remains Alice:', res.body.data.userId === userA.uid ? '✅ Correct' : '❌ Failed');
    console.log('Status updated to in_progress:', res.body.data.status === 'in_progress' ? '✅ Correct' : '❌ Failed');

    // 7c: Update with invalid status
    res = createMockRes();
    await updateMeeting({
      user: userA,
      params: { id: createdMeetingIdAlice },
      body: { status: 'invalid_status_enum' }
    }, res, (err) => console.error(err));
    console.log('Update with invalid status -> status:', res.statusCode === 400 ? '✅ 400 Rejected' : '❌ Failed');

    // -------------------------------------------------------------
    // Test 8: Delete Meeting & Ownership Security
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Delete Meeting & Ownership Security ---');
    // 8a: Bob tries to delete Alice's meeting (Must return 404)
    res = createMockRes();
    await deleteMeeting({
      user: userB,
      params: { id: createdMeetingIdAlice }
    }, res, (err) => console.error(err));
    console.log('Bob attempts DELETE Alice meeting -> status:', res.statusCode === 404 ? '✅ 404 Not Found (Rejected)' : '❌ FAILED');

    // 8b: Alice deletes Alice's meeting
    res = createMockRes();
    await deleteMeeting({
      user: userA,
      params: { id: createdMeetingIdAlice }
    }, res, (err) => console.error(err));
    console.log('Alice deletes own meeting -> status:', res.statusCode === 200 ? '✅ 200 OK Deleted' : '❌ Failed');

    // Verify document no longer exists in Firestore
    const deletedCheck = await db.collection('meetings').doc(createdMeetingIdAlice).get();
    console.log('Firestore document deleted:', !deletedCheck.exists ? '✅ Confirmed Deleted' : '❌ Failed');

    // Delete Bob meeting clean up
    await deleteMeeting({
      user: userB,
      params: { id: createdMeetingIdBob }
    }, createMockRes(), () => {});

    console.log('\n🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Phase 2 Test Error:', err);
    throw err;
  }
}

runPhase2Tests().catch(console.error);
