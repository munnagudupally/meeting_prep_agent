/**
 * AI Prep Service for Meeting Prep Agent
 * Synthesizes meeting goals, attendee profiles, and historical Hindsight memories
 */

/**
 * Generate comprehensive prep brief
 * @param {Object} meeting 
 * @param {Array} memories 
 * @param {Object} userPreferences 
 */
async function generateBrief(meeting, memories = [], userPreferences = {}) {
  const { title, description, attendees = [], location } = meeting;
  const style = userPreferences.briefingStyle || 'detailed';

  // Group memories by attendee email for fast context matching
  const memoriesByAttendee = {};
  memories.forEach(mem => {
    const key = (mem.attendeeEmail || '').toLowerCase();
    if (!memoriesByAttendee[key]) memoriesByAttendee[key] = [];
    memoriesByAttendee[key].push(mem);
  });

  // Synthesize attendee profiles
  const attendeeProfiles = attendees.map(attendee => {
    const emailKey = (attendee.email || '').toLowerCase();
    const relatedMemories = memoriesByAttendee[emailKey] || [];
    
    const pastTakeaways = relatedMemories.map(m => `[${m.category}] ${m.note}`).join('; ');

    return {
      name: attendee.name || 'Participant',
      email: attendee.email || '',
      company: attendee.company || 'Organization',
      role: attendee.role || 'Stakeholder',
      linkedinUrl: attendee.linkedinUrl || '',
      background: attendee.role 
        ? `${attendee.name} currently serves as ${attendee.role} at ${attendee.company || 'the client organization'}.`
        : `Key participant for ${title}.`,
      recentNews: `Active contributor in recent strategic discussions.`,
      pastInteractionsSummary: relatedMemories.length > 0
        ? `Previous interactions noted: ${pastTakeaways}`
        : `First recorded meeting or no past relationship notes found.`
    };
  });

  // Synthesize objectives
  const objectives = [
    `Establish strategic alignment on ${title}.`,
    `Review key project deliverables, expectations, and timelines.`,
    `Address open questions, unblock critical path items, and agree on next steps.`
  ];

  // Synthesize talking points
  const keyTalkingPoints = [
    `Executive recap and purpose: "${description || title}"`,
    `Current progress status, key milestones achieved, and roadmap overview.`,
    `Resource allocation, potential bottlenecks, and team bandwidth.`,
    `Immediate decision items requiring stakeholder consensus.`
  ];

  // Synthesize recommended high-impact questions
  const recommendedQuestions = [
    `What are the most critical milestones or outcomes we must guarantee from this session?`,
    `Are there any unforeseen constraints or external dependencies we should account for?`,
    `How can our team best support your immediate priorities over the next sprint?`,
    `What are the preferred criteria for sign-off on upcoming deliverables?`
  ];

  // Synthesize potential risks & mitigation strategies
  const potentialRisks = [
    `Scope creep: Maintain strict focus on agreed agenda topics and defer tangential items.`,
    `Unclear ownership: Conclude with explicit DRI (Directly Responsible Individual) assignments for each action item.`,
    `Time constraint: Allocate the last 5 minutes strictly to action item confirmation.`
  ];

  // Synthesize Hindsight insights based on historical memories
  const hindsightInsights = memories.map(mem => ({
    topic: mem.category.toUpperCase(),
    insight: mem.note,
    relevance: `Noted regarding ${mem.attendeeName || mem.attendeeEmail || 'attendee'}`
  }));

  if (hindsightInsights.length === 0) {
    hindsightInsights.push({
      topic: 'RELATIONSHIP MEMORY',
      insight: 'No previous friction or notes recorded for these attendees. Recommended to establish positive initial rapport.',
      relevance: 'First interaction'
    });
  }

  const summary = `Executive briefing for "${title}". This session involves ${attendees.length} attendee(s) with focus on ${description || 'strategic execution'}. Ensure alignment on key deliverables and confirm timeline commitments.`;

  return {
    meetingId: meeting.id,
    userId: meeting.userId,
    summary,
    objectives,
    attendeeProfiles,
    keyTalkingPoints,
    recommendedQuestions,
    potentialRisks,
    hindsightInsights,
    customNotes: '',
    briefingStyle: style,
    version: 1
  };
}

module.exports = {
  generateBrief
};
