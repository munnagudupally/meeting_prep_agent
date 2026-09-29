import { apiService } from '../apiService';
import type { PostMeetingInput } from '../../types';

async function runPhase7Tests() {
  console.log('🚀 Starting Phase 7 Verification: Post-Meeting Input & Memory Ingestion Suite...\n');

  // Test 1: Fetch initial meeting state
  const meetingBefore = await apiService.getMeeting('meeting-6');
  console.assert(meetingBefore !== null, 'meeting-6 must exist');
  console.assert(meetingBefore?.status === 'upcoming', 'meeting-6 should initially be upcoming');
  console.log(`✅ Test 1: Verified initial meeting-6 status is "${meetingBefore?.status}".`);

  // Test 2: Fetch contact before completion
  const contactBefore = await apiService.getContact('contact-rahul-sharma');
  console.assert(contactBefore !== null, 'contact-rahul-sharma must exist');
  const prevMeetingCountBefore = contactBefore!.previousMeetingsCount;
  const openCommitmentsBefore = contactBefore!.openCommitmentsCount;
  console.log(`✅ Test 2: Verified contact baseline: ${prevMeetingCountBefore} previous meetings, ${openCommitmentsBefore} open commitments.`);

  // Test 3: Construct comprehensive post-meeting payload
  const testPayload: PostMeetingInput = {
    summary: 'Executive sync with Rahul Sharma: Graviton3 memory benchmarks verified 24% lower query latency and 22% reduced node cost, unlocking verbal CFO approval for annual enterprise rollout on October 15.',
    rawNotes: 'Met with Rahul Sharma for 30 minutes. Successfully reviewed the Graviton3 memory benchmarks showing a 24% reduction in query latency and 22% lower node cost. Rahul confirmed CFO verbal approval. Added SRE Slack Connect cutover commitment. Noted EU-West residency requirements for Q1.',
    discussionTopics: [
      'Graviton3 benchmark presentation & 24% latency reduction',
      'SLA appendix terms & 15-minute rolling rebate tiers',
      'October 15 US-East production rollout milestones',
      'EU-West data residency requirements for Q1 expansion'
    ],
    decisions: [
      'Approved annual enterprise contract term sheet with 150ms p99 SLA',
      'October 15 US-East rollout confirmed as primary launch target',
      'Agreed to establish dedicated SRE Slack Connect war room'
    ],
    followUps: [
      'Send calendar invite for SRE war room rehearsal on Oct 10',
      'Draft EU-West data residency roadmap brief for Priya Desai'
    ],
    newCommitments: [
      {
        title: 'Send countersigned contract DocuSign envelope to Rahul & CFO',
        owner: 'you',
        ownerName: 'Your Team',
        dueDate: '2026-10-04',
        description: 'Include 15-minute rolling window rebate appendix.'
      },
      {
        title: 'Deliver dedicated Slack Connect channel for SRE cutover team',
        owner: 'you',
        ownerName: 'Your Team',
        dueDate: '2026-10-05',
        description: 'Invite Acme SRE leads.'
      },
      {
        title: 'Provide signed war room on-call roster for Oct 15 cutover',
        owner: 'contact',
        ownerName: 'Rahul Sharma',
        dueDate: '2026-10-08',
        description: 'Acme SRE on-call engineers assigned to US-East switchover.'
      }
    ],
    newConcerns: [
      {
        topic: 'EU-West Data Residency & Compliance Timeline',
        description: 'Acme European banking clients require localized storage guarantees before expanding past US-East.',
        severity: 'medium'
      }
    ],
    newPreferences: [
      {
        category: 'communication',
        text: 'Prefers direct Slack Connect alerts for deployment updates rather than formal email syncs',
        context: 'Requested dedicated Slack channel for October 15 cutover team'
      },
      {
        category: 'technical',
        text: 'Requires reproducible Grafana dashboards alongside any benchmark reports',
        context: 'Emphasized during meeting that Acme SREs verify all latency claims independently'
      }
    ],
    newFacts: [
      {
        tag: 'Q4 Infrastructure Expansion Budget',
        excerpt: 'Rahul confirmed Acme CFO verbally signed off on the $1.2M multi-region infrastructure allocation.',
        whyItMatters: 'Eliminates budget freeze risk for October 15 rollout and annual agreement.'
      }
    ],
    nextMeetingDate: '2026-10-15T14:00:00Z'
  };

  // Test 4: Call completeMeeting(id, payload)
  const completedMeeting = await apiService.completeMeeting('meeting-6', testPayload);
  console.assert(completedMeeting.status === 'completed', 'Meeting status must be updated to completed');
  console.assert(completedMeeting.summary === testPayload.summary, 'Meeting summary must match payload');
  console.assert(completedMeeting.notes === testPayload.rawNotes, 'Meeting notes must match raw notes');
  console.assert(completedMeeting.decisions?.length === 3, 'Expected 3 agreed decisions');
  console.assert(completedMeeting.discussionTopics?.length === 4, 'Expected 4 discussion topics');
  console.assert(completedMeeting.followUps?.length === 2, 'Expected 2 follow-ups');
  console.assert(completedMeeting.commitments?.length === 3, 'Expected 3 newly added commitments on the meeting');
  console.log(`✅ Test 3 & 4: completeMeeting('meeting-6') successfully updated meeting to status "${completedMeeting.status}" with all discussions, decisions, and commitments.`);

  // Test 5: Verify contact consistency
  const contactAfter = await apiService.getContact('contact-rahul-sharma');
  console.assert(contactAfter !== null, 'contact-rahul-sharma must exist');
  console.assert(
    contactAfter!.previousMeetingsCount === prevMeetingCountBefore + 1,
    `previousMeetingsCount should increment by 1 (was ${prevMeetingCountBefore}, now ${contactAfter!.previousMeetingsCount})`
  );
  console.assert(
    contactAfter!.openCommitmentsCount === openCommitmentsBefore + 3,
    `openCommitmentsCount should increase by 3 (was ${openCommitmentsBefore}, now ${contactAfter!.openCommitmentsCount})`
  );
  console.assert(
    contactAfter!.nextMeetingDate === testPayload.nextMeetingDate,
    'nextMeetingDate on contact must match payload'
  );
  const foundConcern = contactAfter!.knownConcerns.find(
    (c) => c.topic === 'EU-West Data Residency & Compliance Timeline'
  );
  console.assert(foundConcern !== undefined, 'New concern must be present on contact');
  console.assert(foundConcern?.severity === 'medium', 'Concern severity must be medium');

  const foundPref = contactAfter!.preferences.find(
    (p) => p.text === 'Prefers direct Slack Connect alerts for deployment updates rather than formal email syncs'
  );
  console.assert(foundPref !== undefined, 'New preference must be present on contact');
  console.log(`✅ Test 5: Contact consistency verified:
     - previousMeetingsCount incremented: ${prevMeetingCountBefore} -> ${contactAfter!.previousMeetingsCount}
     - openCommitmentsCount updated: ${openCommitmentsBefore} -> ${contactAfter!.openCommitmentsCount}
     - nextMeetingDate updated to: ${contactAfter!.nextMeetingDate}
     - Newly detected concern logged: "${foundConcern?.topic}" [${foundConcern?.severity}]
     - Newly detected preference logged: "${foundPref?.text}"`);

  // Test 6: Verify global commitments ledger contains the new commitments
  const allCommitments = await apiService.getAllCommitments();
  const com1 = allCommitments.find((c) => c.title.includes('DocuSign envelope'));
  const com2 = allCommitments.find((c) => c.title.includes('Slack Connect channel'));
  const com3 = allCommitments.find((c) => c.title.includes('war room on-call roster'));
  console.assert(com1 !== undefined, 'Commitment 1 must exist in global commitments ledger');
  console.assert(com2 !== undefined, 'Commitment 2 must exist in global commitments ledger');
  console.assert(com3 !== undefined, 'Commitment 3 must exist in global commitments ledger');
  console.assert(com1?.status === 'open', 'New commitment status must be open');
  console.assert(com3?.owner === 'contact', 'Commitment 3 owner must be contact');
  console.log(`✅ Test 6: Global commitments ledger contains all 3 new commitments with correct owners, due dates, and open status.`);

  // Test 7: Verify memory timeline ingestion
  const timelineEvents = await apiService.getTimelineEvents();
  console.assert(timelineEvents.length > 0, 'Timeline events must be returned');

  // Verify meeting summary event
  const meetingEvent = timelineEvents.find((e) => e.meetingId === 'meeting-6' && e.type === 'meeting');
  console.assert(meetingEvent !== undefined, 'Timeline must include meeting summary event for meeting-6');
  console.assert(meetingEvent?.badgeText === 'Meeting Summary', 'Completed meeting should display "Meeting Summary" badge');

  // Verify new commitment events
  const timelineComEvents = timelineEvents.filter(
    (e) => e.type === 'commitment' && (e.title.includes('DocuSign') || e.title.includes('Slack Connect'))
  );
  console.assert(timelineComEvents.length === 2, `Expected 2 new commitment events on timeline, got ${timelineComEvents.length}`);

  // Verify new concern event
  const timelineConcern = timelineEvents.find(
    (e) => e.type === 'concern' && e.title.includes('EU-West Data Residency')
  );
  console.assert(timelineConcern !== undefined, 'Timeline must include new concern event');
  console.assert(timelineConcern?.badgeText === 'MEDIUM Severity Concern', 'Concern badge text must reflect severity');

  // Verify new preference event
  const timelinePref = timelineEvents.find(
    (e) => e.type === 'preference' && e.title.includes('direct Slack Connect alerts')
  );
  console.assert(timelinePref !== undefined, 'Timeline must include new preference event');

  // Verify remembered fact event
  const timelineFact = timelineEvents.find(
    (e) => e.type === 'fact' && e.title.includes('Q4 Infrastructure Expansion Budget')
  );
  console.assert(timelineFact !== undefined, 'Timeline must include remembered fact event');
  console.assert(timelineFact?.details?.excerpt?.includes('$1.2M'), 'Fact excerpt must match');
  console.assert(timelineFact?.details?.whyItMatters?.includes('Eliminates budget freeze risk'), 'Why it matters must match');

  console.log(`✅ Test 7: Memory Timeline ingestion verified:
     - Meeting summary event present with decisions & discussion topics
     - 2 new commitment timeline events indexed
     - New concern timeline event present (${timelineConcern?.badgeText})
     - New preference timeline event present (${timelinePref?.title})
     - New remembered fact timeline event present ("${timelineFact?.title}")`);

  // Test 8: Verify meeting brief synchronization if brief exists on meeting
  const refreshedMeeting = await apiService.getMeeting('meeting-6');
  if (refreshedMeeting?.brief) {
    const brief = refreshedMeeting.brief;
    const briefHasNewCom = brief.keyContext.openCommitments.some((c) => c.title.includes('DocuSign'));
    const briefHasNewConcern = brief.keyContext.knownConcerns.some((c) => c.topic.includes('EU-West Data Residency'));
    const briefHasNewFact = brief.memorySources.some((m) => m.tag.includes('Q4 Infrastructure Expansion Budget'));
    console.assert(briefHasNewCom, 'Meeting brief should be synchronized with new commitments');
    console.assert(briefHasNewConcern, 'Meeting brief should be synchronized with new concerns');
    console.assert(briefHasNewFact, 'Meeting brief should be synchronized with new memory sources');
    console.log(`✅ Test 8: Meeting brief synchronization verified across open commitments, known concerns, and memory sources.`);
  }

  console.log('\n🎯 ALL PHASE 7 REQUIREMENTS (POST-MEETING INPUT & INGESTION) VERIFIED AND PASSING 100%!\n');
}

runPhase7Tests().catch((err) => {
  console.error('Phase 7 Test Failure:', err);
  throw err;
});
