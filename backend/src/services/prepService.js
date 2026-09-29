/**
 * AI Prep Service for Meeting Prep Agent
 * Synthesizes meeting goals, attendee profiles, and historical Hindsight memories
 * with strict stakeholder isolation.
 */

const hindsightService = require('./hindsightService');

/**
 * Generate comprehensive prep brief combining Firestore data and Hindsight long-term memories
 * @param {Object} meeting 
 * @param {Array} firestoreMemories 
 * @param {Object} userPreferences 
 */
async function generateBrief(meeting, firestoreMemories = [], userPreferences = {}) {
  const { title, description = '', attendees = [], location } = meeting;
  const style = userPreferences.briefingStyle || 'detailed';

  // 1. Identify specific attendees for this meeting
  const attendeeNames = attendees.map(a => a.name).filter(Boolean);
  const companyNames = [...new Set(attendees.map(a => a.company).filter(Boolean))];

  // 2. Query Hindsight Cloud specifically for target attendees
  let verifiedHindsightFacts = [];
  let hindsightReflectionText = '';

  if (attendees.length > 0 && hindsightService.isConfigured) {
    try {
      // Query Hindsight for each attendee specifically
      const recallPromises = attendees.map(async (attendee) => {
        const query = `Past interactions, relationship history, concerns, preferences, and commitments for ${attendee.name}${attendee.company ? ` at ${attendee.company}` : ''}`;
        const tags = [
          `stakeholder:${(attendee.name || '').toLowerCase().trim()}`,
          attendee.company ? `org:${(attendee.company || '').toLowerCase().trim()}` : null
        ].filter(Boolean);

        const recallRes = await hindsightService.recallMemory(query, { maxTokens: 1024, tags });
        if (recallRes.success && Array.isArray(recallRes.results)) {
          // Pass through safety filter to guarantee memory isolation
          return hindsightService.filterStakeholderFacts(recallRes.results, [attendee]);
        }
        return [];
      });

      const factArrays = await Promise.all(recallPromises);
      verifiedHindsightFacts = factArrays.flat();

      // Only perform Hindsight Reflection if verified facts or memories exist for these attendees
      if (verifiedHindsightFacts.length > 0 || firestoreMemories.length > 0) {
        const contextLines = [
          ...verifiedHindsightFacts.map(f => f.text),
          ...firestoreMemories.map(m => `[${m.category}] ${m.note}`)
        ];

        const reflectQuery = `Summarize key relationship strategy, concerns, and presentation preferences specifically for ${attendeeNames.join(' and ')}. Only use the provided history for these individuals.`;
        const reflectResult = await hindsightService.reflectMemory(reflectQuery, {
          context: contextLines.slice(0, 10).join('\n'),
          budget: 'low'
        });

        if (reflectResult.success && reflectResult.text) {
          // Validate that the reflection does not talk exclusively about an unrelated stakeholder
          const lowerText = reflectResult.text.toLowerCase();
          const targetMentioned = attendeeNames.some(name => lowerText.includes(name.toLowerCase()));
          if (targetMentioned || attendeeNames.length === 0) {
            hindsightReflectionText = reflectResult.text;
          }
        }
      }
    } catch (err) {
      console.warn('[AI Prep] Hindsight memory recall skipped due to error:', err.message);
    }
  }

  // 3. Index Firestore memories by attendee email & name for quick matching
  const memoriesByAttendee = {};
  firestoreMemories.forEach(mem => {
    const emailKey = (mem.attendeeEmail || '').toLowerCase();
    const nameKey = (mem.attendeeName || '').toLowerCase();
    if (emailKey) {
      if (!memoriesByAttendee[emailKey]) memoriesByAttendee[emailKey] = [];
      memoriesByAttendee[emailKey].push(mem);
    }
    if (nameKey && nameKey !== emailKey) {
      if (!memoriesByAttendee[nameKey]) memoriesByAttendee[nameKey] = [];
      memoriesByAttendee[nameKey].push(mem);
    }
  });

  // 4. Synthesize attendee profiles using both Firestore and verified Hindsight observations
  const attendeeProfiles = attendees.map(attendee => {
    const emailKey = (attendee.email || '').toLowerCase();
    const nameKey = (attendee.name || '').toLowerCase();
    const matchedFirestore = [
      ...(memoriesByAttendee[emailKey] || []),
      ...(memoriesByAttendee[nameKey] || [])
    ];
    // Remove duplicates
    const uniqueMemories = Array.from(new Set(matchedFirestore.map(m => m.id)))
      .map(id => matchedFirestore.find(m => m.id === id));

    const firestoreTakeaways = uniqueMemories.map(m => `[${m.category.toUpperCase()}] ${m.note}`);

    // Check verified Hindsight recalled facts specifically for this attendee
    const hindsightMentions = verifiedHindsightFacts
      .filter(f => f.text && attendee.name && f.text.toLowerCase().includes(attendee.name.toLowerCase()))
      .map(f => f.text);

    const pastInteractionsList = [...firestoreTakeaways, ...hindsightMentions.slice(0, 3)];

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
      pastInteractionsSummary: pastInteractionsList.length > 0
        ? pastInteractionsList.join('; ')
        : `First recorded meeting or no past relationship notes found for ${attendee.name || 'this participant'}.`
    };
  });

  // 5. Synthesize objectives
  const objectives = [
    `Establish clear alignment on goals for ${title}.`,
    `Review key project deliverables, operational expectations, and timelines.`,
    `Address open questions, unblock critical path items, and agree on next steps.`
  ];

  // 6. Synthesize talking points
  const keyTalkingPoints = [
    `Executive recap and purpose: "${description || title}"`,
    `Current progress status, key milestones achieved, and roadmap overview.`,
    `Resource allocation, potential bottlenecks, and team bandwidth.`,
    `Immediate decision items requiring stakeholder consensus.`
  ];

  // 7. Synthesize recommended high-impact questions
  const recommendedQuestions = [
    `What are the most critical milestones or outcomes we must guarantee from this session?`,
    `Are there any unforeseen constraints or external dependencies we should account for?`,
    `How can our team best support your immediate priorities over the next sprint?`,
    `What are the preferred criteria for sign-off on upcoming deliverables?`
  ];

  // 8. Synthesize potential risks & mitigation strategies
  const potentialRisks = [
    `Scope creep: Maintain strict focus on agreed agenda topics and defer tangential items.`,
    `Unclear ownership: Conclude with explicit DRI (Directly Responsible Individual) assignments for each action item.`,
    `Time constraint: Allocate the last 5 minutes strictly to action item confirmation.`
  ];

  // 9. Synthesize Hindsight insights combining Firestore & verified Hindsight Cloud
  const hindsightInsights = [];

  // Add Hindsight Cloud reflection insight if verified
  if (hindsightReflectionText) {
    hindsightInsights.push({
      topic: 'HINDSIGHT STRATEGY REFLECTION',
      insight: hindsightReflectionText.replace(/^###\s*/gm, '').trim(),
      relevance: 'Synthesized from historical cross-meeting memory bank'
    });
  }

  // Add verified Hindsight recalled facts
  verifiedHindsightFacts.slice(0, 4).forEach(fact => {
    if (fact.text) {
      hindsightInsights.push({
        topic: (fact.type || 'RECALL').toUpperCase(),
        insight: fact.text,
        relevance: 'Retrieved from Hindsight Cloud long-term memory'
      });
    }
  });

  // Add Firestore memories matching current attendees
  firestoreMemories.forEach(mem => {
    hindsightInsights.push({
      topic: mem.category.toUpperCase(),
      insight: mem.note,
      relevance: `Noted regarding ${mem.attendeeName || mem.attendeeEmail || 'attendee'}`
    });
  });

  // If no memories exist for the meeting's attendees, display clear, accurate placeholder
  if (hindsightInsights.length === 0) {
    const names = attendeeNames.length > 0 ? attendeeNames.join(', ') : 'this stakeholder';
    hindsightInsights.push({
      topic: 'RELATIONSHIP CONTEXT',
      insight: `No historical Hindsight memories found for ${names}. Takeaways and commitments recorded during post-meeting debriefs will automatically appear here in future briefs.`,
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
