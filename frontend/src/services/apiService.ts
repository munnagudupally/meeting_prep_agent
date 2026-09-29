import type {
  Contact,
  Meeting,
  Commitment,
  MeetingBrief,
  CreateMeetingPayload,
  PostMeetingInput,
  CreateCommitmentPayload,
  TimelineEvent,
  KnownConcern,
  ContactPreference,
  MemorySource
} from '../types';
import {
  INITIAL_CONTACTS,
  INITIAL_MEETINGS,
  MOCK_BRIEF_FOR_MEETING_6,
  MOCK_MEMORY_SOURCES
} from '../data/mockData';
import { getApiMode, getApiBaseUrl, ApiError } from './apiConfig';

// Storage keys for interactive demo state persistence
const CONTACTS_STORAGE_KEY = 'hindsight_contacts_v1';
const MEETINGS_STORAGE_KEY = 'hindsight_meetings_v1';

const delay = (ms = 300): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function loadStoredContacts(): Contact[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load contacts from localStorage, falling back to initial data', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_CONTACTS));
}

function saveContacts(contacts: Contact[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    }
  } catch (e) {
    console.warn('Failed to save contacts to localStorage', e);
  }
}

function loadStoredMeetings(): Meeting[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load meetings from localStorage, falling back to initial data', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_MEETINGS));
}

function saveMeetings(meetings: Meeting[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
    }
  } catch (e) {
    console.warn('Failed to save meetings to localStorage', e);
  }
}

// In-memory runtime state for Mock Mode
let currentContacts: Contact[] = loadStoredContacts();
let currentMeetings: Meeting[] = loadStoredMeetings();

function ensureBriefAndCommitmentSync(): void {
  const m6 = currentMeetings.find((m) => m.id === 'meeting-6');
  if (m6 && (!m6.brief || !m6.brief.memorySources[0]?.whyItMatters)) {
    m6.brief = JSON.parse(JSON.stringify(MOCK_BRIEF_FOR_MEETING_6));
  }

  currentContacts.forEach((contact) => {
    const allContactMeetings = currentMeetings.filter((x) => x.contactId === contact.id);
    let openCount = 0;
    allContactMeetings.forEach((cm) => {
      if (cm.commitments) {
        openCount += cm.commitments.filter((c) => c.status === 'open').length;
      }
    });
    contact.openCommitmentsCount = openCount;
  });
}

ensureBriefAndCommitmentSync();

/**
 * Low-level HTTP client for Real API Mode.
 * NEVER silently falls back to mock data if a real API request fails.
 */
async function realApiRequest<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    allow404?: boolean;
  }
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}${path}`;
  const method = options?.method || 'GET';

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(8000)
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isConnRefused =
      message.includes('Failed to fetch') ||
      message.includes('ECONNREFUSED') ||
      message.includes('NetworkError') ||
      message.includes('timed out');

    throw new ApiError(
      isConnRefused
        ? `[Real API Connection Failed] Cannot reach ${method} ${url}. Backend server is offline or unreachable.`
        : `[Real API Network Error] ${method} ${url} failed: ${message}`,
      {
        endpoint: path,
        method,
        isNetworkError: true,
        details: err
      }
    );
  }

  if (options?.allow404 && response.status === 404) {
    return null as unknown as T;
  }

  if (!response.ok) {
    let errorDetails: unknown;
    let errorText = '';
    try {
      errorText = await response.text();
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    const detailMsg =
      (errorDetails as Record<string, unknown>)?.message ||
      (errorDetails as Record<string, unknown>)?.error ||
      errorText ||
      response.statusText;

    throw new ApiError(
      `[Real API Error] ${method} ${path} responded with HTTP ${response.status} (${response.statusText}): ${detailMsg}`,
      {
        status: response.status,
        endpoint: path,
        method,
        details: errorDetails
      }
    );
  }

  const rawText = await response.text();
  if (!rawText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (parseErr) {
    throw new ApiError(
      `[Real API Response Mismatch] ${method} ${path} did not return valid JSON. Received: ${rawText.slice(0, 150)}`,
      {
        status: response.status,
        endpoint: path,
        method,
        isResponseMismatch: true,
        details: rawText
      }
    );
  }
}

/**
 * GET /contacts
 * Returns list of all contacts
 */
export async function getContacts(): Promise<Contact[]> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>('/contacts', { method: 'GET' });
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as Record<string, unknown>)?.contacts)
      ? (res as Record<string, unknown>).contacts
      : Array.isArray((res as Record<string, unknown>)?.data)
      ? (res as Record<string, unknown>).data
      : null;

    if (!list) {
      throw new ApiError(
        `[Real API Response Mismatch] GET /contacts expected an array of contacts or { contacts: [] }, received: ${JSON.stringify(res).slice(0, 150)}`,
        { endpoint: '/contacts', method: 'GET', isResponseMismatch: true, details: res }
      );
    }

    // Validate elements
    for (const item of list as Record<string, unknown>[]) {
      if (!item || typeof item !== 'object' || !item.id || !item.name) {
        throw new ApiError(
          `[Real API Response Mismatch] Contact items must have 'id' and 'name' fields. Received: ${JSON.stringify(item)}`,
          { endpoint: '/contacts', method: 'GET', isResponseMismatch: true, details: item }
        );
      }
    }
    return list as Contact[];
  }

  // Mock Mode
  await delay(200);
  return JSON.parse(JSON.stringify(currentContacts));
}

/**
 * GET /contacts/:id
 * Returns single contact by ID
 */
export async function getContact(id: string): Promise<Contact | null> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>(`/contacts/${id}`, { method: 'GET', allow404: true });
    if (!res) return null;
    const contact =
      (res as Record<string, unknown>)?.contact ||
      (res as Record<string, unknown>)?.data ||
      res;

    if (!contact || typeof contact !== 'object' || !(contact as Record<string, unknown>).id) {
      throw new ApiError(
        `[Real API Response Mismatch] GET /contacts/${id} did not return a valid Contact object`,
        { endpoint: `/contacts/${id}`, method: 'GET', isResponseMismatch: true, details: res }
      );
    }
    return contact as Contact;
  }

  // Mock Mode
  await delay(150);
  const contact = currentContacts.find((c) => c.id === id);
  return contact ? JSON.parse(JSON.stringify(contact)) : null;
}

/**
 * GET /meetings/:id
 * Returns a single meeting by ID with populated brief and commitments
 */
export async function getMeeting(id: string): Promise<Meeting | null> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>(`/meetings/${id}`, { method: 'GET', allow404: true });
    if (!res) return null;
    const meeting =
      (res as Record<string, unknown>)?.meeting ||
      (res as Record<string, unknown>)?.data ||
      res;

    if (!meeting || typeof meeting !== 'object' || !(meeting as Record<string, unknown>).id) {
      throw new ApiError(
        `[Real API Response Mismatch] GET /meetings/${id} did not return a valid Meeting entity`,
        { endpoint: `/meetings/${id}`, method: 'GET', isResponseMismatch: true, details: res }
      );
    }
    return meeting as Meeting;
  }

  // Mock Mode
  await delay(200);
  const meeting = currentMeetings.find((m) => m.id === id);
  if (!meeting) return null;

  const copy = JSON.parse(JSON.stringify(meeting)) as Meeting;

  // Attach mock brief for meeting-6 if not present or missing whyItMatters
  if (copy.id === 'meeting-6' && (!copy.brief || !copy.brief.memorySources[0]?.whyItMatters)) {
    copy.brief = MOCK_BRIEF_FOR_MEETING_6;
    meeting.brief = MOCK_BRIEF_FOR_MEETING_6;
    saveMeetings(currentMeetings);
  }

  return copy;
}

/**
 * POST /meetings
 * Creates a new scheduled meeting
 */
export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>('/meetings', { method: 'POST', body: payload });
    const meeting =
      (res as Record<string, unknown>)?.meeting ||
      (res as Record<string, unknown>)?.data ||
      res;

    if (!meeting || typeof meeting !== 'object' || !(meeting as Record<string, unknown>).id) {
      throw new ApiError(
        `[Real API Response Mismatch] POST /meetings did not return a valid Meeting entity with 'id'`,
        { endpoint: '/meetings', method: 'POST', isResponseMismatch: true, details: res }
      );
    }
    return meeting as Meeting;
  }

  // Mock Mode
  await delay(300);
  const newMeetingId = `meeting-${Date.now()}`;
  const newMeeting: Meeting = {
    id: newMeetingId,
    contactId: payload.contactId,
    title: payload.title,
    scheduledAt: payload.scheduledAt,
    durationMinutes: payload.durationMinutes,
    meetingType: payload.meetingType,
    status: 'upcoming',
    agenda: payload.agenda,
    discussionTopics: [...payload.agenda],
    decisions: [],
    followUps: [],
    commitments: [],
    notes: payload.notes || ''
  };

  currentMeetings.unshift(newMeeting);
  saveMeetings(currentMeetings);

  // Update contact's nextMeetingDate
  const contactIndex = currentContacts.findIndex((c) => c.id === payload.contactId);
  if (contactIndex !== -1) {
    currentContacts[contactIndex].nextMeetingDate = payload.scheduledAt;
    saveContacts(currentContacts);
  }

  return JSON.parse(JSON.stringify(newMeeting));
}

/**
 * POST /meetings/:id/prepare
 * Generates or retrieves the AI intelligence briefing
 */
export async function prepareMeeting(meetingId: string): Promise<MeetingBrief> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>(`/meetings/${meetingId}/prepare`, {
      method: 'POST',
      body: { meetingId }
    });
    const brief =
      (res as Record<string, unknown>)?.brief ||
      (res as Record<string, unknown>)?.data ||
      res;

    if (
      !brief ||
      typeof brief !== 'object' ||
      !(brief as Record<string, unknown>).relationship ||
      !(brief as Record<string, unknown>).keyContext
    ) {
      throw new ApiError(
        `[Real API Response Mismatch] POST /meetings/${meetingId}/prepare missing required 'relationship' or 'keyContext'`,
        {
          endpoint: `/meetings/${meetingId}/prepare`,
          method: 'POST',
          isResponseMismatch: true,
          details: res
        }
      );
    }
    return brief as MeetingBrief;
  }

  // Mock Mode
  await delay(400);

  if (meetingId === 'meeting-6') {
    const m6 = currentMeetings.find((m) => m.id === 'meeting-6');
    if (m6) {
      m6.brief = JSON.parse(JSON.stringify(MOCK_BRIEF_FOR_MEETING_6));
      saveMeetings(currentMeetings);
    }
    return JSON.parse(JSON.stringify(MOCK_BRIEF_FOR_MEETING_6));
  }

  const meeting = currentMeetings.find((m) => m.id === meetingId);
  if (!meeting) {
    throw new Error(`Meeting with ID "${meetingId}" not found`);
  }

  if (meeting.brief && meeting.brief.memorySources[0]?.whyItMatters) {
    return JSON.parse(JSON.stringify(meeting.brief));
  }

  const contact = currentContacts.find((c) => c.id === meeting.contactId);

  const generatedBrief: MeetingBrief = {
    meetingId: meeting.id,
    contactId: meeting.contactId,
    generatedAt: new Date().toISOString(),
    relationship: {
      previousMeetingsCount: contact?.previousMeetingsCount || 1,
      relationshipStatus: contact?.relationshipHealth === 'strong' ? 'Strategic Partner' : 'Growing Trust',
      cadence: 'Bi-weekly cadenced synchronization',
      keyDynamic:
        contact?.bio ||
        'Direct, technically rigorous engineering relationship. Prioritizes concrete benchmarks and milestone deliverables.'
    },
    keyContext: {
      openCommitments: [
        {
          id: `com-auto-${Date.now()}`,
          meetingId: meeting.id,
          contactId: meeting.contactId,
          owner: 'you',
          ownerName: 'Your Team',
          title: `Review architectural requirements for ${meeting.title}`,
          description: 'Ensure system latency models align with customer expectations.',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          status: 'open',
          sourceMeetingTitle: meeting.title,
          sourceMeetingDate: new Date().toISOString().split('T')[0]
        }
      ],
      completedCommitments: [],
      knownConcerns: contact?.knownConcerns || [],
      preferences: contact?.preferences || [],
      recommendedQuestions: [
        {
          id: `rq-1-${Date.now()}`,
          question: `“${contact?.name ? contact.name.split(' ')[0] : 'Partner'}, what is your highest priority outcome for today’s discussion on ${meeting.title}?”`,
          rationale: 'Quickly aligns expectations and focuses time on high-impact items.'
        },
        {
          id: `rq-2-${Date.now()}`,
          question: '“Are there any immediate blockers from your infrastructure team we need to resolve today?”',
          rationale: 'Surfaces hidden operational frictions early in the conversation.'
        }
      ],
      risksAndFollowUps: [
        {
          id: `rf-1-${Date.now()}`,
          type: 'risk',
          title: 'Scope Creep on Deployment Timelines',
          impact: 'Ensure requirements are tightly bounded to avoid pushout of production targets.',
          sourceSnippet: 'Generated from historical meeting cadence and deliverable review.',
          suggestedAction: 'Confirm strict milestone signoffs before end of meeting.'
        }
      ]
    },
    memorySources: MOCK_MEMORY_SOURCES
  };

  meeting.brief = generatedBrief;
  saveMeetings(currentMeetings);
  return JSON.parse(JSON.stringify(generatedBrief));
}

/**
 * POST /meetings/:id/complete
 * Records post-meeting debrief, notes, decisions, and updates commitments
 */
export async function completeMeeting(
  meetingId: string,
  payload: PostMeetingInput
): Promise<Meeting> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>(`/meetings/${meetingId}/complete`, {
      method: 'POST',
      body: payload
    });
    const meeting =
      (res as Record<string, unknown>)?.meeting ||
      (res as Record<string, unknown>)?.data ||
      res;

    if (!meeting || typeof meeting !== 'object' || !(meeting as Record<string, unknown>).id) {
      throw new ApiError(
        `[Real API Response Mismatch] POST /meetings/${meetingId}/complete did not return updated Meeting entity`,
        {
          endpoint: `/meetings/${meetingId}/complete`,
          method: 'POST',
          isResponseMismatch: true,
          details: res
        }
      );
    }
    return meeting as Meeting;
  }

  // Mock Mode
  await delay(350);
  const meetingIndex = currentMeetings.findIndex((m) => m.id === meetingId);
  if (meetingIndex === -1) {
    throw new Error(`Meeting ${meetingId} not found`);
  }

  const meeting = currentMeetings[meetingIndex];
  meeting.status = 'completed';
  meeting.notes = payload.rawNotes;
  if (payload.summary) {
    meeting.summary = payload.summary;
  } else if (!meeting.summary && payload.rawNotes) {
    meeting.summary = payload.rawNotes.slice(0, 180);
  }
  meeting.discussionTopics = payload.discussionTopics.length
    ? payload.discussionTopics
    : meeting.discussionTopics;
  meeting.decisions = payload.decisions;
  if (payload.followUps) {
    meeting.followUps = payload.followUps;
  }
  meeting.postMeetingInput = payload;

  // Convert new commitments into full commitment entities
  const createdCommitments: Commitment[] = payload.newCommitments.map(
    (nc, index) => ({
      id: `com-post-${Date.now()}-${index}`,
      meetingId: meeting.id,
      contactId: meeting.contactId,
      owner: nc.owner,
      ownerName: nc.ownerName,
      title: nc.title,
      description: nc.description || '',
      dueDate: nc.dueDate,
      status: 'open',
      sourceMeetingTitle: meeting.title,
      sourceMeetingDate: new Date().toISOString().split('T')[0]
    })
  );

  meeting.commitments = [...(meeting.commitments || []), ...createdCommitments];

  // Update contact metadata
  const contactIndex = currentContacts.findIndex((c) => c.id === meeting.contactId);
  if (contactIndex !== -1) {
    const contact = currentContacts[contactIndex];
    contact.previousMeetingsCount += 1;
    contact.lastMeetingDate = new Date().toISOString();
    if (payload.nextMeetingDate) {
      contact.nextMeetingDate = payload.nextMeetingDate;
    }
    contact.openCommitmentsCount += createdCommitments.length;

    // Add newly detected concerns
    const concernsToAdd: KnownConcern[] = [];
    if (payload.newConcerns && payload.newConcerns.length > 0) {
      payload.newConcerns.forEach((nc, idx) => {
        concernsToAdd.push({
          id: `concern-post-${Date.now()}-${idx}`,
          topic: nc.topic,
          description: nc.description,
          severity: nc.severity,
          detectedInMeetingId: meeting.id,
          detectedDate: new Date().toISOString().split('T')[0]
        });
      });
      contact.knownConcerns = [...contact.knownConcerns, ...concernsToAdd];
    }

    // Add newly detected preferences
    const prefsToAdd: ContactPreference[] = [];
    if (payload.newPreferences && payload.newPreferences.length > 0) {
      payload.newPreferences.forEach((np, idx) => {
        prefsToAdd.push({
          id: `pref-post-${Date.now()}-${idx}`,
          category: np.category,
          text: np.text,
          context: np.context
        });
      });
      contact.preferences = [...contact.preferences, ...prefsToAdd];
    }

    // Keep brief in sync if attached to this meeting
    if (meeting.brief?.keyContext) {
      if (createdCommitments.length > 0) {
        meeting.brief.keyContext.openCommitments.unshift(...createdCommitments);
      }
      if (concernsToAdd.length > 0) {
        meeting.brief.keyContext.knownConcerns.unshift(...concernsToAdd);
      }
      if (prefsToAdd.length > 0) {
        meeting.brief.keyContext.preferences.unshift(...prefsToAdd);
      }
    }

    saveContacts(currentContacts);
  }

  // Add newly remembered facts to MOCK_MEMORY_SOURCES and brief if present
  if (payload.newFacts && payload.newFacts.length > 0) {
    const memoryFacts: MemorySource[] = payload.newFacts.map((nf, idx) => ({
      id: `mem-post-${Date.now()}-${idx}`,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDate: new Date().toISOString().split('T')[0],
      excerpt: nf.excerpt,
      contextType: 'decision',
      relevanceScore: 0.95,
      tag: nf.tag,
      whyItMatters: nf.whyItMatters
    }));

    MOCK_MEMORY_SOURCES.unshift(...memoryFacts);
    if (meeting.brief?.memorySources) {
      meeting.brief.memorySources.unshift(...memoryFacts);
    }
  }

  saveMeetings(currentMeetings);
  return JSON.parse(JSON.stringify(meeting));
}

export async function getMeetingsByContact(contactId: string): Promise<Meeting[]> {
  if (getApiMode() === 'real') {
    const all = await getAllMeetings();
    return all.filter((m) => m.contactId === contactId);
  }

  await delay(150);
  const filtered = currentMeetings.filter((m) => m.contactId === contactId);
  return JSON.parse(JSON.stringify(filtered));
}

export async function getAllMeetings(): Promise<Meeting[]> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<unknown>('/meetings', { method: 'GET' });
    const list = Array.isArray(res)
      ? res
      : Array.isArray((res as Record<string, unknown>)?.meetings)
      ? (res as Record<string, unknown>).meetings
      : Array.isArray((res as Record<string, unknown>)?.data)
      ? (res as Record<string, unknown>).data
      : null;

    if (!list) {
      throw new ApiError(
        `[Real API Response Mismatch] GET /meetings expected array of meetings`,
        { endpoint: '/meetings', method: 'GET', isResponseMismatch: true, details: res }
      );
    }
    return list as Meeting[];
  }

  await delay(150);
  return JSON.parse(JSON.stringify(currentMeetings));
}

export async function getAllCommitments(): Promise<Commitment[]> {
  if (getApiMode() === 'real') {
    const meetings = await getAllMeetings();
    const all: Commitment[] = [];
    meetings.forEach((m) => {
      if (m.commitments && m.commitments.length) {
        all.push(...m.commitments);
      }
    });
    return all;
  }

  await delay(150);
  const all: Commitment[] = [];
  currentMeetings.forEach((m) => {
    if (m.commitments && m.commitments.length) {
      all.push(...m.commitments);
    }
  });
  return JSON.parse(JSON.stringify(all));
}

export async function addCommitment(payload: CreateCommitmentPayload): Promise<Commitment> {
  await delay(150);
  const newCommitment: Commitment = {
    id: `com-custom-${Date.now()}`,
    meetingId: payload.meetingId,
    contactId: payload.contactId,
    owner: payload.owner,
    ownerName: payload.ownerName,
    title: payload.title,
    description: payload.description,
    dueDate: payload.dueDate,
    status: payload.status,
    sourceMeetingTitle: payload.sourceMeetingTitle,
    sourceMeetingDate: payload.sourceMeetingDate
  };

  const meeting = currentMeetings.find((m) => m.id === payload.meetingId);
  if (meeting) {
    if (!meeting.commitments) meeting.commitments = [];
    meeting.commitments.unshift(newCommitment);

    // Keep brief in sync if present
    if (meeting.brief?.keyContext) {
      if (newCommitment.status === 'completed') {
        meeting.brief.keyContext.completedCommitments.unshift(newCommitment);
      } else {
        meeting.brief.keyContext.openCommitments.unshift(newCommitment);
      }
    }
  }

  // Update contact count
  const contact = currentContacts.find((c) => c.id === payload.contactId);
  if (contact && newCommitment.status === 'open') {
    contact.openCommitmentsCount += 1;
    saveContacts(currentContacts);
  }

  saveMeetings(currentMeetings);
  return JSON.parse(JSON.stringify(newCommitment));
}

export async function updateCommitmentStatus(
  commitmentId: string,
  newStatus: Commitment['status']
): Promise<void> {
  await delay(100);
  for (const m of currentMeetings) {
    if (m.commitments) {
      const found = m.commitments.find((c) => c.id === commitmentId);
      if (found) {
        found.status = newStatus;

        // Keep brief in this meeting in sync if present
        if (m.brief?.keyContext) {
          if (newStatus === 'completed') {
            const idx = m.brief.keyContext.openCommitments.findIndex((c) => c.id === commitmentId);
            if (idx !== -1) {
              const [removed] = m.brief.keyContext.openCommitments.splice(idx, 1);
              removed.status = 'completed';
              m.brief.keyContext.completedCommitments.push(removed);
            }
          } else if (newStatus === 'open') {
            const idx = m.brief.keyContext.completedCommitments.findIndex((c) => c.id === commitmentId);
            if (idx !== -1) {
              const [removed] = m.brief.keyContext.completedCommitments.splice(idx, 1);
              removed.status = 'open';
              m.brief.keyContext.openCommitments.push(removed);
            }
          }
        }

        // Also synchronize meeting-6's brief if it references this commitment
        const meeting6 = currentMeetings.find((x) => x.id === 'meeting-6');
        if (meeting6?.brief?.keyContext) {
          if (newStatus === 'completed') {
            const idx = meeting6.brief.keyContext.openCommitments.findIndex((c) => c.id === commitmentId);
            if (idx !== -1) {
              const [removed] = meeting6.brief.keyContext.openCommitments.splice(idx, 1);
              removed.status = 'completed';
              meeting6.brief.keyContext.completedCommitments.push(removed);
            }
          } else if (newStatus === 'open') {
            const idx = meeting6.brief.keyContext.completedCommitments.findIndex((c) => c.id === commitmentId);
            if (idx !== -1) {
              const [removed] = meeting6.brief.keyContext.completedCommitments.splice(idx, 1);
              removed.status = 'open';
              meeting6.brief.keyContext.openCommitments.push(removed);
            }
          }
        }

        // Update contact open count
        const contact = currentContacts.find((c) => c.id === m.contactId);
        if (contact) {
          let count = 0;
          currentMeetings
            .filter((x) => x.contactId === contact.id)
            .forEach((cm) => {
              if (cm.commitments) {
                count += cm.commitments.filter((c) => c.status === 'open').length;
              }
            });
          contact.openCommitmentsCount = count;
          saveContacts(currentContacts);
        }

        saveMeetings(currentMeetings);
        return;
      }
    }
  }
}

/**
 * Generates aggregated chronological timeline events.
 */
export async function getTimelineEvents(filterContactId?: string): Promise<TimelineEvent[]> {
  if (getApiMode() === 'real') {
    const [contacts, meetings] = await Promise.all([getContacts(), getAllMeetings()]);
    const events: TimelineEvent[] = [];
    const targetContacts = filterContactId
      ? contacts.filter((c) => c.id === filterContactId)
      : contacts;
    const targetContactIds = new Set(targetContacts.map((c) => c.id));

    meetings.forEach((m) => {
      if (!targetContactIds.has(m.contactId)) return;
      const contact = contacts.find((c) => c.id === m.contactId);
      events.push({
        id: `timeline-meeting-${m.id}`,
        type: 'meeting',
        date: m.scheduledAt.split('T')[0],
        timestamp: new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: m.title,
        summary: m.summary || m.notes || 'Meeting completed with stakeholder.',
        contactId: m.contactId,
        contactName: contact?.name || 'Contact',
        contactCompany: contact?.company || 'Company',
        meetingId: m.id,
        meetingTitle: m.title,
        badgeText: m.status === 'upcoming' ? 'Scheduled Sync' : 'Meeting Summary',
        badgeVariant: m.status === 'upcoming' ? 'info' : 'primary',
        details: {
          agenda: m.agenda,
          decisions: m.decisions,
          discussionTopics: m.discussionTopics
        }
      });

      if (m.commitments) {
        m.commitments.forEach((c) => {
          events.push({
            id: `timeline-com-${c.id}`,
            type: 'commitment',
            date: c.sourceMeetingDate || m.scheduledAt.split('T')[0],
            title: c.title,
            description: c.description,
            contactId: c.contactId,
            contactName: contact?.name || 'Contact',
            contactCompany: contact?.company || 'Company',
            meetingId: m.id,
            meetingTitle: m.title,
            badgeText: c.status === 'completed' ? 'Commitment Fulfilled' : 'Commitment Promised',
            badgeVariant: c.status === 'completed' ? 'success' : 'warning',
            details: {
              owner: c.ownerName,
              dueDate: c.dueDate,
              status: c.status,
              commitmentId: c.id
            }
          });
        });
      }
    });

    targetContacts.forEach((contact) => {
      if (contact.knownConcerns) {
        contact.knownConcerns.forEach((con) => {
          events.push({
            id: `timeline-concern-${con.id}`,
            type: 'concern',
            date: con.detectedDate,
            title: con.topic,
            description: con.description,
            contactId: contact.id,
            contactName: contact.name,
            contactCompany: contact.company,
            badgeText: `${con.severity.toUpperCase()} Severity Concern`,
            badgeVariant: con.severity === 'high' ? 'danger' : 'warning',
            details: { severity: con.severity }
          });
        });
      }

      if (contact.preferences) {
        contact.preferences.forEach((pref) => {
          events.push({
            id: `timeline-pref-${pref.id}`,
            type: 'preference',
            date: new Date().toISOString().split('T')[0],
            title: pref.text,
            description: `Grounding Observation: ${pref.context}`,
            contactId: contact.id,
            contactName: contact.name,
            contactCompany: contact.company,
            badgeText: `${pref.category.toUpperCase()} Preference`,
            badgeVariant: 'info',
            details: { category: pref.category, context: pref.context }
          });
        });
      }
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Mock Mode
  await delay(250);
  const events: TimelineEvent[] = [];
  const targetContacts = filterContactId
    ? currentContacts.filter((c) => c.id === filterContactId)
    : currentContacts;

  const targetContactIds = new Set(targetContacts.map((c) => c.id));

  // 1. Meeting Summaries
  currentMeetings.forEach((m) => {
    if (!targetContactIds.has(m.contactId)) return;
    const contact = currentContacts.find((c) => c.id === m.contactId);
    events.push({
      id: `timeline-meeting-${m.id}`,
      type: 'meeting',
      date: m.scheduledAt.split('T')[0],
      timestamp: new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: m.title,
      summary: m.summary || m.notes || 'Meeting completed with stakeholder.',
      contactId: m.contactId,
      contactName: contact?.name || 'Contact',
      contactCompany: contact?.company || 'Company',
      meetingId: m.id,
      meetingTitle: m.title,
      badgeText: m.status === 'upcoming' ? 'Scheduled Sync' : 'Meeting Summary',
      badgeVariant: m.status === 'upcoming' ? 'info' : 'primary',
      details: {
        agenda: m.agenda,
        decisions: m.decisions,
        discussionTopics: m.discussionTopics
      }
    });

    // 2. Commitment Changes from this meeting
    if (m.commitments) {
      m.commitments.forEach((c) => {
        events.push({
          id: `timeline-com-${c.id}`,
          type: 'commitment',
          date: c.sourceMeetingDate || m.scheduledAt.split('T')[0],
          title: c.title,
          description: c.description,
          contactId: c.contactId,
          contactName: contact?.name || 'Contact',
          contactCompany: contact?.company || 'Company',
          meetingId: m.id,
          meetingTitle: m.title,
          badgeText: c.status === 'completed' ? 'Commitment Fulfilled' : 'Commitment Promised',
          badgeVariant: c.status === 'completed' ? 'success' : 'warning',
          details: {
            owner: c.ownerName,
            dueDate: c.dueDate,
            status: c.status,
            commitmentId: c.id
          }
        });
      });
    }
  });

  // 3. Concerns and Preferences from Contacts
  targetContacts.forEach((contact) => {
    contact.knownConcerns.forEach((con) => {
      const sourceMeeting = currentMeetings.find((m) => m.id === con.detectedInMeetingId);
      events.push({
        id: `timeline-concern-${con.id}`,
        type: 'concern',
        date: con.detectedDate,
        title: con.topic,
        description: con.description,
        contactId: contact.id,
        contactName: contact.name,
        contactCompany: contact.company,
        meetingId: con.detectedInMeetingId,
        meetingTitle: sourceMeeting?.title || 'Architecture & Planning Review',
        badgeText: `${con.severity.toUpperCase()} Severity Concern`,
        badgeVariant: con.severity === 'high' ? 'danger' : 'warning',
        details: {
          severity: con.severity,
          whyItMatters: 'Requires proactive verification to prevent deal stalling or operational regression.'
        }
      });
    });

    contact.preferences.forEach((pref, idx) => {
      const approximateDates = ['2026-05-15', '2026-06-20', '2026-07-28', '2026-08-30'];
      const date = pref.id.startsWith('pref-post-')
        ? new Date().toISOString().split('T')[0]
        : approximateDates[idx % approximateDates.length];
      events.push({
        id: `timeline-pref-${pref.id}`,
        type: 'preference',
        date,
        title: pref.text,
        description: `Grounding Observation: ${pref.context}`,
        contactId: contact.id,
        contactName: contact.name,
        contactCompany: contact.company,
        badgeText: `${pref.category.toUpperCase()} Preference`,
        badgeVariant: 'info',
        details: {
          category: pref.category,
          context: pref.context
        }
      });
    });
  });

  // 4. Remembered Facts from Memory Sources
  MOCK_MEMORY_SOURCES.forEach((mem) => {
    const meeting = currentMeetings.find((m) => m.id === mem.meetingId);
    const resolvedContactId = meeting ? meeting.contactId : 'contact-rahul-sharma';
    if (!targetContactIds.has(resolvedContactId)) return;
    const contact = currentContacts.find((c) => c.id === resolvedContactId);
    events.push({
      id: `timeline-fact-${mem.id}`,
      type: 'fact',
      date: mem.meetingDate,
      timestamp: mem.timestampInMeeting,
      title: mem.tag,
      description: `"${mem.excerpt}"`,
      contactId: resolvedContactId,
      contactName: contact?.name || 'Stakeholder',
      contactCompany: contact?.company || 'Organization',
      meetingId: mem.meetingId,
      meetingTitle: mem.meetingTitle,
      badgeText: 'Remembered Fact / Quote',
      badgeVariant: 'purple',
      details: {
        excerpt: mem.excerpt,
        whyItMatters: mem.whyItMatters,
        relevanceScore: mem.relevanceScore,
        category: mem.contextType
      }
    });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return JSON.parse(JSON.stringify(events));
}

export function resetDemoData(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CONTACTS_STORAGE_KEY);
      localStorage.removeItem(MEETINGS_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to clear localStorage keys', e);
  }
  currentContacts = JSON.parse(JSON.stringify(INITIAL_CONTACTS));
  currentMeetings = JSON.parse(JSON.stringify(INITIAL_MEETINGS));
  ensureBriefAndCommitmentSync();
}

export const apiService = {
  getContacts,
  getContact,
  getMeeting,
  createMeeting,
  prepareMeeting,
  completeMeeting,
  getMeetingsByContact,
  getAllMeetings,
  getAllCommitments,
  addCommitment,
  updateCommitmentStatus,
  getTimelineEvents,
  resetDemoData
};
