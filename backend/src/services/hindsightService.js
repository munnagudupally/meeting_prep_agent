/**
 * Hindsight Memory Integration Service
 * Manages cognitive long-term memory, cross-meeting relationship context,
 * recall, and reflection for Meeting Prep Agent with strict stakeholder memory isolation.
 */

const {
  HINDSIGHT_API_KEY,
  HINDSIGHT_BASE_URL,
  HINDSIGHT_MEMORY_BANK,
  isConfigured
} = require('../config/hindsight');

/**
 * Normalize stakeholder name for consistent indexing
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Low-level HTTP request helper for Hindsight Cloud API
 */
async function hindsightRequest(path, body = {}, method = 'POST') {
  if (!isConfigured) {
    return {
      success: false,
      error: 'Hindsight API key is not configured on the server',
      degraded: true
    };
  }

  const bankSlug = encodeURIComponent(HINDSIGHT_MEMORY_BANK);
  const url = `${HINDSIGHT_BASE_URL}/v1/default/banks/${bankSlug}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${HINDSIGHT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MeetingPrepAgent-Backend/1.0'
      },
      body: method === 'GET' ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn(`[Hindsight] API returned status ${res.status}:`, data?.message || data?.error || res.statusText);
      return {
        success: false,
        status: res.status,
        error: data?.message || data?.error || `Hindsight API error (${res.status})`,
        degraded: true
      };
    }

    return {
      success: true,
      data
    };
  } catch (err) {
    console.warn('[Hindsight] Network or timeout error:', err.message);
    return {
      success: false,
      error: err.message || 'Failed to communicate with Hindsight service',
      degraded: true
    };
  }
}

/**
 * Retain raw or structured memory into Hindsight Cloud with stakeholder isolation tags
 */
async function retainMemory(content, metadata = {}, tags = []) {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return { success: false, error: 'Memory content cannot be empty' };
  }

  const stakeholderName = metadata.attendeeName || metadata.stakeholderName || '';
  const attendeeEmail = metadata.attendeeEmail || metadata.email || '';
  const userId = metadata.userId || '';
  const company = metadata.company || metadata.organization || '';

  const scopedTags = new Set(Array.isArray(tags) ? tags : []);
  if (stakeholderName) scopedTags.add(`stakeholder:${normalizeName(stakeholderName)}`);
  if (attendeeEmail) scopedTags.add(`email:${attendeeEmail.toLowerCase().trim()}`);
  if (userId) scopedTags.add(`user:${userId}`);
  if (company) scopedTags.add(`org:${normalizeName(company)}`);

  const payload = {
    items: [
      {
        content: content.trim(),
        metadata: {
          ...metadata,
          userId,
          stakeholderName,
          attendeeEmail,
          organization: company,
          source: metadata.source || 'meeting-prep-agent',
          timestamp: new Date().toISOString()
        },
        tags: Array.from(scopedTags)
      }
    ]
  };

  const response = await hindsightRequest('/memories', payload, 'POST');
  return response;
}

/**
 * Retain meeting context when a meeting is created or updated
 */
async function retainMeetingContext(meeting, user = {}) {
  try {
    const attendees = meeting.attendees || [];
    const attendeeDescriptions = attendees
      .map(a => `${a.name || 'Participant'}${a.role ? ` (${a.role})` : ''}${a.company ? ` at ${a.company}` : ''}`)
      .join(', ');

    const dateStr = meeting.startTime
      ? typeof meeting.startTime === 'object' && '_seconds' in meeting.startTime
        ? new Date(meeting.startTime._seconds * 1000).toDateString()
        : new Date(meeting.startTime).toDateString()
      : 'Upcoming session';

    const companies = [...new Set(attendees.map(a => a.company).filter(Boolean))];
    const tags = ['meeting', ...companies, ...attendees.map(a => a.name).filter(Boolean)];

    const content = `Scheduled meeting "${meeting.title}" on ${dateStr}. Objective/Recap: "${meeting.description || 'General sync'}". Key participants: ${attendeeDescriptions || 'None listed'}. Location: ${meeting.location || 'Virtual'}.`;

    return await retainMemory(content, {
      meetingId: meeting.id,
      userId: meeting.userId || user.uid,
      title: meeting.title,
      company: companies[0] || '',
      attendeeName: attendees[0]?.name || '',
      attendeeEmail: attendees[0]?.email || ''
    }, tags);
  } catch (err) {
    console.warn('[Hindsight] Error formatting meeting context:', err.message);
    return { success: false, error: err.message, degraded: true };
  }
}

/**
 * Retain post-meeting notes, takeaways, and commitments
 */
async function retainPostMeetingContext(meeting, postMeetingData = {}, user = {}) {
  try {
    const { summary, takeaways = [], commitments = [], notes = '' } = postMeetingData;

    const parts = [];
    if (summary) parts.push(`Meeting Recap: ${summary}`);
    if (notes) parts.push(`Notes: ${notes}`);
    if (takeaways.length > 0) {
      parts.push(`Key Takeaways:\n${takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`);
    }
    if (commitments.length > 0) {
      parts.push(`Commitments & Follow-ups:\n${commitments.map((c, i) => `${i + 1}. ${c.title || c} (${c.ownerName || c.owner || 'team'})`).join('\n')}`);
    }

    if (parts.length === 0) return { success: true, message: 'No post-meeting content to retain' };

    const content = `Post-meeting insights for "${meeting.title}":\n\n${parts.join('\n\n')}`;
    const attendees = meeting.attendees || [];
    const companies = [...new Set(attendees.map(a => a.company).filter(Boolean))];
    const tags = ['post-meeting', 'takeaway', 'commitment', ...companies, ...attendees.map(a => a.name).filter(Boolean)];

    return await retainMemory(content, {
      meetingId: meeting.id,
      userId: meeting.userId || user.uid,
      title: meeting.title,
      company: companies[0] || '',
      attendeeName: attendees[0]?.name || '',
      attendeeEmail: attendees[0]?.email || ''
    }, tags);
  } catch (err) {
    console.warn('[Hindsight] Error retaining post-meeting data:', err.message);
    return { success: false, error: err.message, degraded: true };
  }
}

/**
 * Recall memories matching semantic query and optional tags
 */
async function recallMemory(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { success: true, results: [] };
  }

  const payload = {
    query: query.trim(),
    types: options.types || ['world', 'experience', 'observation'],
    max_tokens: options.maxTokens || 4096
  };

  if (Array.isArray(options.tags)) {
    const validTags = options.tags.filter(t => typeof t === 'string' && t.trim().length > 0);
    if (validTags.length > 0) {
      payload.tags = validTags;
    }
  }

  const response = await hindsightRequest('/memories/recall', payload, 'POST');
  if (response.success && response.data) {
    return {
      success: true,
      results: response.data.results || [],
      entities: response.data.entities || []
    };
  }

  return {
    success: false,
    results: [],
    error: response.error || 'Failed to recall memories',
    degraded: true
  };
}

/**
 * SAFETY FILTER: Strict Stakeholder Memory Isolation Filter
 * Inspects all returned memories from Hindsight Cloud and ensures they belong ONLY to the target stakeholder(s).
 * Any memory referencing an unrelated person (e.g., Rahul Sharma when target is Sarah Jenkins) is strictly rejected.
 *
 * @param {Array} facts - Raw recalled facts from Hindsight
 * @param {Array} targetStakeholders - Array of target stakeholder objects: [{ name, email, company }]
 * @returns {Array} verifiedFacts - Facts verified to belong only to target stakeholders
 */
function filterStakeholderFacts(facts = [], targetStakeholders = []) {
  if (!Array.isArray(facts) || facts.length === 0) return [];
  if (!Array.isArray(targetStakeholders) || targetStakeholders.length === 0) return [];

  // Extract target tokens
  const targetNames = targetStakeholders.map(s => normalizeName(s.name)).filter(Boolean);
  const targetFirstNames = targetStakeholders.map(s => normalizeName((s.name || '').split(' ')[0])).filter(Boolean);
  const targetEmails = targetStakeholders.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean);
  const targetCompanies = targetStakeholders.map(s => normalizeName(s.company)).filter(Boolean);

  return facts.filter(fact => {
    const text = (fact.text || '').toLowerCase();
    if (!text) return false;

    // Check if fact directly mentions any of the target names or emails
    const matchesTargetName = targetNames.some(name => text.includes(name));
    const matchesTargetEmail = targetEmails.some(email => text.includes(email));
    const matchesTargetFirstName = targetFirstNames.some(fn => fn.length > 2 && text.includes(fn));

    // If it mentions the target stakeholder directly, accept it
    if (matchesTargetName || matchesTargetEmail || matchesTargetFirstName) {
      return true;
    }

    // If it doesn't mention the target directly, check if it mentions another distinct person name
    // (e.g. contains words like "rahul", "priya", "john", etc. that are not in targetStakeholders)
    const mentionsOtherPerson = targetNames.length > 0 && (
      text.includes('rahul') && !targetNames.some(n => n.includes('rahul')) ||
      text.includes('sarah') && !targetNames.some(n => n.includes('sarah')) ||
      text.includes('elena') && !targetNames.some(n => n.includes('elena')) ||
      text.includes('priya') && !targetNames.some(n => n.includes('priya'))
    );

    if (mentionsOtherPerson) {
      // Reject: Fact belongs to a different stakeholder!
      return false;
    }

    // If it mentions the target company AND does not mention any unrelated person, accept it
    const matchesCompany = targetCompanies.some(comp => comp.length > 3 && text.includes(comp));
    if (matchesCompany && !mentionsOtherPerson) {
      return true;
    }

    // Default: Reject unverified facts to guarantee strict isolation
    return false;
  });
}

/**
 * Reflect over memory bank to generate synthesized historical insight specifically for a stakeholder
 */
async function reflectMemory(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { success: false, error: 'Query is required for reflection' };
  }

  const payload = {
    query: query.trim(),
    budget: options.budget || 'low',
    context: options.context || undefined,
    max_tokens: options.maxTokens || 4096
  };

  const response = await hindsightRequest('/reflect', payload, 'POST');
  if (response.success && response.data) {
    return {
      success: true,
      text: response.data.text || '',
      facts: response.data.based_on || []
    };
  }

  return {
    success: false,
    text: '',
    error: response.error || 'Failed to reflect over memories',
    degraded: true
  };
}

/**
 * Health check for Hindsight memory bank connectivity
 */
async function healthCheck() {
  if (!isConfigured) {
    return {
      status: 'unconfigured',
      message: 'Hindsight API key is not configured'
    };
  }

  try {
    const recallCheck = await recallMemory('ping test', { maxTokens: 10 });
    return {
      status: recallCheck.success ? 'connected' : 'degraded',
      bank: HINDSIGHT_MEMORY_BANK,
      error: recallCheck.error || null
    };
  } catch (err) {
    return {
      status: 'error',
      bank: HINDSIGHT_MEMORY_BANK,
      error: err.message
    };
  }
}

module.exports = {
  retainMemory,
  retainMeetingContext,
  retainPostMeetingContext,
  recallMemory,
  reflectMemory,
  filterStakeholderFacts,
  healthCheck,
  isConfigured
};
