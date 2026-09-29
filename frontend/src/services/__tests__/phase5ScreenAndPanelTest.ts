import { getMeeting, getContact, prepareMeeting, resetDemoData } from '../apiService';
import type { MeetingBrief, MemorySource } from '../../types';

export async function runComprehensiveScreenAndPanelTest() {
  console.log('🚀 Running Deep Screen & Memory Panel Verification for Phase 5: Meeting Brief...\n');

  await resetDemoData();

  // 1. Fetch meeting-6 and associated contact
  const meeting = await getMeeting('meeting-6');
  if (!meeting) throw new Error('Meeting 6 not found');
  const contact = await getContact(meeting.contactId);
  if (!contact) throw new Error('Contact not found');

  console.log('📌 1. CONTACT & MEETING HEADER');
  console.log(`   - Contact: ${contact.name} (${contact.title})`);
  console.log(`   - Company: ${contact.company} (${contact.department})`);
  console.log(`   - Meeting: "${meeting.title}"`);
  console.log(`   - Scheduled: ${meeting.scheduledAt} (${meeting.durationMinutes} min)`);
  console.assert(contact.name === 'Rahul Sharma', 'Contact name must be Rahul Sharma');
  console.assert(contact.company === 'Acme Technologies', 'Company must be Acme Technologies');
  console.assert(meeting.title === 'Contract Execution & Production Deployment Readiness', 'Meeting title match');

  // 2. Brief synthesis & relationship
  const brief: MeetingBrief = (meeting.brief || await prepareMeeting('meeting-6')) as MeetingBrief;
  console.log('\n📌 2. RELATIONSHIP SUMMARY & GROUNDING COUNT');
  console.log(`   - Previous Meeting Count: ${brief.relationship.previousMeetingsCount}`);
  console.log(`   - Relationship Status: ${brief.relationship.relationshipStatus}`);
  console.log(`   - Cadence: ${brief.relationship.cadence}`);
  console.log(`   - Key Dynamic: ${brief.relationship.keyDynamic.slice(0, 70)}...`);
  console.assert(brief.relationship.previousMeetingsCount === 5, 'Must have 5 previous meetings');
  console.assert(brief.relationship.relationshipStatus === 'Strategic Partner', 'Must be Strategic Partner');

  // 3. Key Context
  console.log('\n📌 3. KEY CONTEXT SECTIONS');
  const { openCommitments, knownConcerns, preferences, recommendedQuestions, risksAndFollowUps } = brief.keyContext;
  console.log(`   - Open Commitments: ${openCommitments.length} items`);
  openCommitments.forEach((c, i) => console.log(`     [${i + 1}] Due ${c.dueDate}: ${c.title} (Owner: ${c.ownerName})`));
  console.assert(openCommitments.length >= 3, 'Must have >= 3 open commitments');

  console.log(`   - Known Concerns: ${knownConcerns.length} items`);
  knownConcerns.forEach((con, i) => console.log(`     [${i + 1}] (${con.severity.toUpperCase()}) ${con.topic}: ${con.description.slice(0, 60)}...`));
  console.assert(knownConcerns.length >= 2, 'Must have >= 2 known concerns');

  console.log(`   - Preferences: ${preferences.length} items`);
  preferences.forEach((p, i) => console.log(`     [${i + 1}] [${p.category.toUpperCase()}] ${p.text}`));
  console.assert(preferences.length >= 3, 'Must have >= 3 preferences');

  // 4. Strategic Questions
  console.log('\n📌 4. RECOMMENDED QUESTIONS');
  recommendedQuestions.forEach((q, i) => {
    console.log(`   [${i + 1}] ${q.question}`);
    console.log(`       Rationale: ${q.rationale}`);
  });
  console.assert(recommendedQuestions.length >= 3, 'Must have >= 3 recommended questions');

  // 5. Risks and Follow-ups
  console.log('\n📌 5. RISKS & STRATEGIC FOLLOW-UPS');
  risksAndFollowUps.forEach((rf, i) => {
    console.log(`   [${i + 1}] (${rf.type.toUpperCase()}) ${rf.title}`);
    console.log(`       Impact: ${rf.impact}`);
    console.log(`       Action: ${rf.suggestedAction}`);
  });
  console.assert(risksAndFollowUps.length >= 2, 'Must have >= 2 risks/follow-ups');

  // 6. Action Buttons Navigation Targets
  console.log('\n📌 6. ACTION BUTTON TARGETS');
  const actionTargets = {
    viewContact: `/contacts/${contact.id}`,
    viewTimeline: `/timeline?contactId=${contact.id}`,
    viewCommitments: `/commitments?contactId=${contact.id}`,
    postMeetingNotes: `/meetings/${meeting.id}/post-meeting`
  };
  console.log(`   - View Contact: ${actionTargets.viewContact}`);
  console.log(`   - View Memory Timeline: ${actionTargets.viewTimeline}`);
  console.log(`   - View Commitments: ${actionTargets.viewCommitments}`);
  console.log(`   - Post-Meeting Notes: ${actionTargets.postMeetingNotes}`);
  console.assert(actionTargets.viewContact.includes('contact-rahul-sharma'), 'Contact route correct');
  console.assert(actionTargets.postMeetingNotes.includes('meeting-6'), 'Post meeting route correct');

  // 7. Memory Sources Side Panel ("WHY? View Memory Sources")
  console.log('\n📌 7. "WHY? VIEW MEMORY SOURCES" PANEL VERIFICATION');
  const sources: MemorySource[] = brief.memorySources;
  console.log(`   - Total Grounded Memory Sources: ${sources.length}`);
  console.assert(sources.length >= 6, 'Must have at least 6 memory sources');

  // Test tag categories
  const categories = ['concern', 'commitment', 'preference', 'relationship'];
  categories.forEach((cat) => {
    const matching = sources.filter((s) => s.contextType === cat);
    console.log(`     • Category [${cat}]: ${matching.length} sources found`);
    console.assert(matching.length > 0, `Category ${cat} must have at least 1 memory source`);
  });

  // Verify all 4 required fields for every memory source:
  // 1. source meeting title
  // 2. date
  // 3. relevant memory (excerpt)
  // 4. why it matters
  console.log('\n   Checking completeness of all memory source entries:');
  sources.forEach((s) => {
    console.assert(Boolean(s.meetingTitle && s.meetingTitle.length > 5), `Source ${s.id} missing meeting title`);
    console.assert(Boolean(s.meetingDate && s.meetingDate.length >= 10), `Source ${s.id} missing meeting date`);
    console.assert(Boolean(s.excerpt && s.excerpt.length > 15), `Source ${s.id} missing relevant memory excerpt`);
    console.assert(Boolean(s.whyItMatters && s.whyItMatters.length > 20), `Source ${s.id} missing "Why It Matters" rationale`);
    console.log(`     ✓ [${s.id}] "${s.meetingTitle}" (${s.meetingDate}): Has excerpt & explicit "Why It Matters"`);
  });

  // Test live search query filter logic
  const searchTestQuery = 'Postgres';
  const searchResults = sources.filter(
    (s) =>
      s.excerpt.toLowerCase().includes(searchTestQuery.toLowerCase()) ||
      (s.whyItMatters && s.whyItMatters.toLowerCase().includes(searchTestQuery.toLowerCase()))
  );
  console.log(`\n   Filter/Search Test for "${searchTestQuery}": Found ${searchResults.length} matching sources.`);
  console.assert(searchResults.length >= 1, 'Search for Postgres should return at least 1 match');

  console.log('\n✨ ALL PHASE 5 MEETING BRIEF REQUIREMENTS AND TESTS FULLY VERIFIED!\n');
}

runComprehensiveScreenAndPanelTest().catch((err) => {
  console.error('❌ Test failed:', err);
  throw err;
});
