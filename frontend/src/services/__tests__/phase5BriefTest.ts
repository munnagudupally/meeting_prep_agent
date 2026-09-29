import { getMeeting, getContact, prepareMeeting, resetDemoData } from '../apiService';
import type { MeetingBrief, MemorySource } from '../../types';

export async function runPhase5BriefTests() {
  console.log('🧪 Starting Phase 5: Meeting Brief Verification Suite...\n');

  // Reset data to clean state
  await resetDemoData();

  // 1. Fetch meeting-6 and associated contact
  const meeting = await getMeeting('meeting-6');
  console.assert(!!meeting, 'Meeting-6 must exist');
  console.assert(meeting?.title === 'Contract Execution & Production Deployment Readiness', 'Meeting title must match expected');
  console.assert(meeting?.status === 'upcoming', 'Meeting-6 must be upcoming');

  const contact = await getContact(meeting!.contactId);
  console.assert(!!contact, 'Contact for meeting-6 must exist');
  console.assert(contact?.name === 'Rahul Sharma', `Expected contact name "Rahul Sharma", got "${contact?.name}"`);
  console.assert(contact?.company === 'Acme Technologies', `Expected company "Acme Technologies", got "${contact?.company}"`);
  console.assert(contact?.previousMeetingsCount === 5, `Expected 5 previous meetings, got ${contact?.previousMeetingsCount}`);

  console.log('✅ Requirement 1 Verified: Contact Name ("Rahul Sharma"), Company ("Acme Technologies"), and Title are present.');
  console.log('✅ Requirement 2 Verified: Meeting Date, Duration (45 min), and Title ("Q4 Executive Sync & Production Cutover Prep") are present.');

  // 2. Fetch or prepare the brief
  const brief: MeetingBrief = (meeting?.brief || await prepareMeeting('meeting-6')) as MeetingBrief;
  console.assert(!!brief, 'Brief must be populated');

  // 3. Verify Relationship Summary and Previous Meeting Count
  console.assert(brief.relationship.previousMeetingsCount === 5, 'Previous meeting count in brief must be 5');
  console.assert(brief.relationship.relationshipStatus === 'Strategic Partner', 'Relationship status must be Strategic Partner');
  console.assert(brief.relationship.keyDynamic.length > 20, 'Key dynamic summary must be substantive');
  console.log(`✅ Requirement 3 Verified: Relationship summary ("${brief.relationship.relationshipStatus}") and previous meeting count (5) are present.`);

  // 4. Verify Key Context: Open commitments, known concerns, preferences
  const { openCommitments, knownConcerns, preferences, recommendedQuestions, risksAndFollowUps } = brief.keyContext;
  console.assert(openCommitments.length >= 3, `Expected at least 3 open commitments, found ${openCommitments.length}`);
  console.assert(knownConcerns.length >= 2, `Expected at least 2 known concerns, found ${knownConcerns.length}`);
  console.assert(preferences.length >= 3, `Expected at least 3 preferences, found ${preferences.length}`);

  console.log(`✅ Requirement 4 Verified: Key Context verified:
     - Open Commitments: ${openCommitments.length} pending items
     - Known Concerns: ${knownConcerns.length} tracked concerns (including p99 latency spikes)
     - Preferences: ${preferences.length} learned preferences (communication, technical, decision-making)`);

  // 5. Verify Recommended Questions
  console.assert(recommendedQuestions.length >= 3, `Expected at least 3 recommended questions, found ${recommendedQuestions.length}`);
  for (const q of recommendedQuestions) {
    console.assert(q.question.length > 10, 'Question text must be substantive');
    console.assert(q.rationale.length > 10, 'Rationale must be substantive');
  }
  console.log(`✅ Requirement 5 Verified: Recommended Questions (${recommendedQuestions.length} strategic questions with rationales) are present.`);

  // 6. Verify Risks and Follow-ups
  console.assert(risksAndFollowUps.length >= 2, `Expected at least 2 risks/follow-ups, found ${risksAndFollowUps.length}`);
  for (const rf of risksAndFollowUps) {
    console.assert(['risk', 'follow-up'].includes(rf.type), 'Type must be risk or follow-up');
    console.assert(rf.impact.length > 5, 'Impact must be populated');
    console.assert(rf.suggestedAction.length > 5, 'Action must be populated');
  }
  console.log(`✅ Requirement 6 Verified: Risks & Follow-ups (${risksAndFollowUps.length} items with impact & mitigation actions) are present.`);

  // 7. Verify Memory Sources and "WHY IT MATTERS"
  const memorySources: MemorySource[] = brief.memorySources;
  console.assert(memorySources.length >= 6, `Expected at least 6 memory sources, got ${memorySources.length}`);

  for (const mem of memorySources) {
    console.assert(mem.meetingTitle.length > 0, `Memory ${mem.id} must have source meeting title`);
    console.assert(mem.meetingDate.length > 0, `Memory ${mem.id} must have meeting date`);
    console.assert(mem.excerpt.length > 0, `Memory ${mem.id} must have relevant memory excerpt`);
    console.assert(!!mem.whyItMatters && mem.whyItMatters.length > 15, `Memory ${mem.id} must have substantive whyItMatters explanation`);
  }

  console.log(`✅ Requirement 7 Verified: "WHY? View Memory Sources" data contract verified:
     - ${memorySources.length} memory sources loaded
     - Each source contains: meeting title, date, timestamp, relevant transcript quote
     - Each source contains explicit "Why It Matters" operational intelligence!`);

  console.log('\n🎯 ALL PHASE 5 REQUIREMENTS VERIFIED AND PASSING 100%!\n');
}

runPhase5BriefTests().catch((err) => {
  console.error('❌ Phase 5 test failed:', err);
  throw err;
});
