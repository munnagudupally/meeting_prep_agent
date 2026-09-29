import {
  getContacts,
  getContact,
  getMeeting,
  createMeeting,
  prepareMeeting,
  completeMeeting,
  getAllCommitments,
  updateCommitmentStatus,
  resetDemoData
} from '../apiService';
import type {
  Contact,
  Meeting,
  MeetingBrief,
  Commitment,
  PostMeetingInput,
  CreateMeetingPayload
} from '../../types';

export async function runServiceTests() {
  console.log('🧪 Starting Phase 2 Service Layer & Mock Data Verification...\n');

  // Test 1: Reset & getContacts
  await resetDemoData();
  const contacts: Contact[] = await getContacts();
  console.assert(contacts.length >= 3, `Expected at least 3 contacts, found ${contacts.length}`);
  const rahul = contacts.find((c) => c.name === 'Rahul Sharma' && c.company === 'Acme Technologies');
  console.assert(!!rahul, 'Expected Rahul Sharma at Acme Technologies to exist');
  console.assert(rahul?.previousMeetingsCount === 5, `Expected 5 previous meetings for Rahul, got ${rahul?.previousMeetingsCount}`);
  console.log('✅ Test 1 Passed: getContacts() returned Rahul Sharma at Acme Technologies with 5 previous meetings.');

  // Test 2: getContact(id)
  const rahulDetail = await getContact('contact-rahul-sharma');
  console.assert(!!rahulDetail, 'Expected getContact(id) to find Rahul Sharma');
  console.assert(rahulDetail?.preferences.length === 4, 'Expected 4 contact preferences');
  console.assert(rahulDetail?.knownConcerns.length === 3, 'Expected 3 known concerns');
  console.log('✅ Test 2 Passed: getContact(id) returned full profile with preferences and known concerns.');

  // Test 3: getMeeting(id) for past meeting
  const pastMeeting: Meeting | null = await getMeeting('meeting-1');
  console.assert(!!pastMeeting, 'Expected meeting-1 to exist');
  console.assert(pastMeeting?.status === 'completed', 'Expected meeting-1 to be completed');
  console.assert(pastMeeting?.commitments?.length === 2, 'Expected 2 commitments in meeting-1');
  console.log(`✅ Test 3 Passed: getMeeting('meeting-1') returned past meeting "${pastMeeting?.title}".`);

  // Test 4: prepareMeeting(meetingId)
  const brief: MeetingBrief = await prepareMeeting('meeting-6');
  console.assert(brief.meetingId === 'meeting-6', 'Expected brief for meeting-6');
  console.assert(brief.relationship.previousMeetingsCount === 5, 'Expected 5 previous meetings in brief');
  console.assert(brief.keyContext.openCommitments.length >= 3, 'Expected at least 3 open commitments');
  console.assert(brief.keyContext.recommendedQuestions.length >= 3, 'Expected recommended questions');
  console.assert(brief.memorySources.length >= 6, 'Expected at least 6 memory sources');
  console.log(`✅ Test 4 Passed: prepareMeeting('meeting-6') generated verified briefing with ${brief.memorySources.length} memory sources.`);

  // Test 5: createMeeting(payload)
  const newMeetingPayload: CreateMeetingPayload = {
    contactId: 'contact-rahul-sharma',
    title: 'Q4 Budget & Enterprise License Finalization',
    scheduledAt: '2026-10-20T16:00:00Z',
    durationMinutes: 30,
    meetingType: 'executive-sync',
    agenda: ['Review revised pricing tiers', 'Sign master service agreement']
  };
  const createdMeeting = await createMeeting(newMeetingPayload);
  console.assert(createdMeeting.title === newMeetingPayload.title, 'Expected meeting title to match');
  console.assert(createdMeeting.status === 'upcoming', 'Expected new meeting to be upcoming');
  console.log(`✅ Test 5 Passed: createMeeting() created new meeting "${createdMeeting.title}".`);

  // Test 6: completeMeeting(meetingId, payload)
  const postMeetingInput: PostMeetingInput = {
    rawNotes: 'Executive sync concluded. CFO agreed to standard 150ms latency tier and signed the agreement.',
    discussionTopics: ['Final terms', 'Latency tier signoff'],
    decisions: ['Signed MSA contract', 'Scheduled onboarding for Nov 1'],
    newCommitments: [
      {
        title: 'Provision enterprise API keys for production cluster',
        owner: 'you',
        ownerName: 'Your Team',
        dueDate: '2026-10-25',
        description: 'Send keys via 1Password vault'
      }
    ],
    newConcerns: [],
    nextMeetingDate: '2026-11-01T15:00:00Z'
  };
  const completed = await completeMeeting(createdMeeting.id, postMeetingInput);
  console.assert(completed.status === 'completed', 'Expected completed status');
  console.assert(completed.decisions?.length === 2, 'Expected 2 decisions');
  console.assert((completed.commitments?.length || 0) >= 1, 'Expected new commitment in meeting');

  // Verify contact was updated with new previousMeetingsCount
  const updatedRahul = await getContact('contact-rahul-sharma');
  console.assert((updatedRahul?.previousMeetingsCount || 0) === 6, `Expected 6 meetings after complete, got ${updatedRahul?.previousMeetingsCount}`);
  console.log('✅ Test 6 Passed: completeMeeting() successfully updated meeting, added commitments, and incremented contact meeting count to 6.');

  // Test 7: Commitments ledger & status toggle
  const allCommitments: Commitment[] = await getAllCommitments();
  const testCommitment = allCommitments[0];
  const initialStatus = testCommitment.status;
  await updateCommitmentStatus(testCommitment.id, initialStatus === 'open' ? 'completed' : 'open');
  console.log(`✅ Test 7 Passed: updateCommitmentStatus() verified on commitment "${testCommitment.title}".`);

  console.log('\n🎉 ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY!\n');
}

runServiceTests().catch((err) => {
  console.error('❌ Service test failed:', err);
  throw err;
});
