import type {
  Contact,
  Meeting,
  Commitment,
  MeetingBrief,
  CreateMeetingPayload,
  PostMeetingInput,
  Memory,
  CreateMemoryPayload,
  TimelineEvent
} from '../types';
import {
  INITIAL_CONTACTS,
  INITIAL_MEETINGS,
  MOCK_BRIEF_FOR_MEETING_6
} from '../data/mockData';
import { getApiMode, getApiBaseUrl, ApiError } from './apiConfig';
import { auth } from '../config/firebase';

const CONTACTS_STORAGE_KEY = 'meeting_prep_contacts_v2';
const MEETINGS_STORAGE_KEY = 'meeting_prep_meetings_v2';
const MEMORIES_STORAGE_KEY = 'meeting_prep_memories_v2';
const DEV_AUTH_STORAGE_KEY = 'meeting_prep_dev_auth_token';

const delay = (ms = 150): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getAuthToken(): Promise<string | null> {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn('Failed to get Firebase token', e);
    }
  }
  if (typeof localStorage !== 'undefined') {
    const devToken = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
    if (devToken) return devToken;
  }
  return null;
}

/**
 * Centralized low-level HTTP client with Firebase Auth bearer tokens
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
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const method = options?.method || 'GET';

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(12000)
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
        ? `[Connection Failed] Cannot reach ${method} ${url}. Backend server is offline or unreachable.`
        : `[Network Error] ${method} ${url} failed: ${message}`,
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

    let detailMsg = '';
    if (errorDetails && typeof errorDetails === 'object') {
      const rec = errorDetails as Record<string, any>;
      if (rec.message) {
        detailMsg = String(rec.message);
      } else if (Array.isArray(rec.details) && rec.details.length > 0) {
        detailMsg = rec.details.join('; ');
      } else if (rec.error) {
        detailMsg = String(rec.error);
      }
    }
    if (!detailMsg) {
      detailMsg = errorText || response.statusText || 'Unknown server error';
    }

    throw new ApiError(
      `[API Error] ${method} ${path} responded with HTTP ${response.status}: ${detailMsg}`,
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
      `[Response Mismatch] ${method} ${path} did not return valid JSON. Received: ${rawText.slice(0, 150)}`,
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

// -------------------------------------------------------------
// MOCK STATE STORAGE HELPERS
// -------------------------------------------------------------
function loadStoredContacts(): Contact[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return JSON.parse(JSON.stringify(INITIAL_CONTACTS));
}

function loadStoredMeetings(): Meeting[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return JSON.parse(JSON.stringify(INITIAL_MEETINGS));
}

function saveMeetings(meetings: Meeting[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
    }
  } catch {
    // ignore
  }
}

let currentContacts: Contact[] = loadStoredContacts();
let currentMeetings: Meeting[] = loadStoredMeetings();

// -------------------------------------------------------------
// MEETINGS API
// -------------------------------------------------------------

export async function getAllMeetings(params?: { status?: string; timeframe?: string }): Promise<Meeting[]> {
  if (getApiMode() === 'real') {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.timeframe) query.set('timeframe', params.timeframe);

    const endpoint = `/api/meetings${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await realApiRequest<{ success: boolean; data: Meeting[] }>(endpoint, { method: 'GET' });
    return res.data || [];
  }

  await delay(150);
  let list = currentMeetings;
  if (params?.status && params.status !== 'all') {
    list = list.filter((m) => m.status === params.status);
  }
  return JSON.parse(JSON.stringify(list));
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; data: Meeting }>(`/api/meetings/${id}`, {
      method: 'GET',
      allow404: true
    });
    return res ? res.data : null;
  }

  await delay(150);
  const meeting = currentMeetings.find((m) => m.id === id);
  if (!meeting) return null;
  const copy = JSON.parse(JSON.stringify(meeting));
  if (copy.id === 'meeting-6' && !copy.brief) {
    copy.brief = MOCK_BRIEF_FOR_MEETING_6;
  }
  return copy;
}

export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; data: Meeting }>('/api/meetings', {
      method: 'POST',
      body: {
        title: payload.title,
        description: payload.description || '',
        startTime: payload.startTime || payload.scheduledAt,
        endTime: payload.endTime || null,
        location: payload.location || '',
        attendees: payload.attendees || [],
        status: payload.status || 'upcoming'
      }
    });
    return res.data;
  }

  await delay(250);
  const newMeeting: Meeting = {
    id: `meeting-${Date.now()}`,
    contactId: payload.contactId || 'contact-rahul-sharma',
    title: payload.title,
    scheduledAt: payload.startTime || payload.scheduledAt || new Date().toISOString(),
    startTime: payload.startTime || payload.scheduledAt || new Date().toISOString(),
    endTime: payload.endTime || null,
    durationMinutes: payload.durationMinutes || 30,
    status: payload.status || 'upcoming',
    meetingType: payload.meetingType || '1-on-1',
    agenda: payload.agenda || [],
    notes: payload.notes || payload.description || '',
    attendees: payload.attendees || []
  };

  currentMeetings.unshift(newMeeting);
  saveMeetings(currentMeetings);
  return newMeeting;
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; data: Meeting }>(`/api/meetings/${id}`, {
      method: 'PUT',
      body: updates
    });
    return res.data;
  }

  await delay(150);
  const index = currentMeetings.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Meeting ${id} not found`);
  currentMeetings[index] = { ...currentMeetings[index], ...updates };
  saveMeetings(currentMeetings);
  return currentMeetings[index];
}

export async function deleteMeeting(id: string): Promise<boolean> {
  if (getApiMode() === 'real') {
    await realApiRequest<{ success: boolean }>(`/api/meetings/${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  await delay(150);
  currentMeetings = currentMeetings.filter((m) => m.id !== id);
  saveMeetings(currentMeetings);
  return true;
}

// -------------------------------------------------------------
// PREP BRIEF API
// -------------------------------------------------------------

export async function getPrepBrief(meetingId: string): Promise<MeetingBrief | null> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; prepBrief: MeetingBrief }>(
      `/api/prep/${meetingId}`,
      { method: 'GET', allow404: true }
    );
    return res ? res.prepBrief : null;
  }

  await delay(150);
  const meeting = currentMeetings.find((m) => m.id === meetingId);
  return meeting?.brief || null;
}

export async function prepareMeeting(meetingId: string): Promise<MeetingBrief> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; prepBrief: MeetingBrief }>(
      `/api/prep/${meetingId}/generate`,
      { method: 'POST' }
    );
    return res.prepBrief;
  }

  await delay(400);
  const brief = JSON.parse(JSON.stringify(MOCK_BRIEF_FOR_MEETING_6));
  brief.meetingId = meetingId;
  const m = currentMeetings.find((x) => x.id === meetingId);
  if (m) {
    m.brief = brief;
    saveMeetings(currentMeetings);
  }
  return brief;
}

export async function updateBriefNotes(meetingId: string, customNotes: string): Promise<MeetingBrief> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; prepBrief: MeetingBrief }>(
      `/api/prep/${meetingId}/notes`,
      {
        method: 'PATCH',
        body: { customNotes }
      }
    );
    return res.prepBrief;
  }

  await delay(150);
  const m = currentMeetings.find((x) => x.id === meetingId);
  if (m && m.brief) {
    m.brief.customNotes = customNotes;
    saveMeetings(currentMeetings);
    return m.brief;
  }
  throw new Error('Brief not found');
}

// -------------------------------------------------------------
// MEMORIES API
// -------------------------------------------------------------

export async function getMemories(params?: { attendeeEmail?: string; category?: string }): Promise<Memory[]> {
  if (getApiMode() === 'real') {
    const query = new URLSearchParams();
    if (params?.attendeeEmail) query.set('attendeeEmail', params.attendeeEmail);
    if (params?.category) query.set('category', params.category);

    const endpoint = `/api/memories${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await realApiRequest<{ success: boolean; memories: Memory[] }>(endpoint, {
      method: 'GET'
    });
    return res.memories || [];
  }

  await delay(150);
  const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
  let mems: Memory[] = stored ? JSON.parse(stored) : [];
  if (params?.attendeeEmail) {
    mems = mems.filter((m) => m.attendeeEmail.toLowerCase() === params.attendeeEmail?.toLowerCase());
  }
  if (params?.category) {
    mems = mems.filter((m) => m.category === params.category);
  }
  return mems;
}

export async function createMemory(payload: CreateMemoryPayload): Promise<Memory> {
  if (getApiMode() === 'real') {
    const res = await realApiRequest<{ success: boolean; memory: Memory }>('/api/memories', {
      method: 'POST',
      body: payload
    });
    return res.memory;
  }

  await delay(150);
  const newMem: Memory = {
    id: `mem-${Date.now()}`,
    attendeeEmail: payload.attendeeEmail || '',
    attendeeName: payload.attendeeName || '',
    meetingId: payload.meetingId || '',
    category: payload.category || 'general',
    note: payload.note,
    sentiment: payload.sentiment || 'neutral',
    tags: payload.tags || [],
    createdAt: new Date().toISOString()
  };
  const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
  const mems: Memory[] = stored ? JSON.parse(stored) : [];
  mems.unshift(newMem);
  localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(mems));
  return newMem;
}

export async function deleteMemory(id: string): Promise<boolean> {
  if (getApiMode() === 'real') {
    await realApiRequest<{ success: boolean }>(`/api/memories/${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  await delay(150);
  const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
  let mems: Memory[] = stored ? JSON.parse(stored) : [];
  mems = mems.filter((m) => m.id !== id);
  localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(mems));
  return true;
}

// -------------------------------------------------------------
// DERIVED CONTACTS & COMMITMENTS
// -------------------------------------------------------------

export async function getContacts(): Promise<Contact[]> {
  if (getApiMode() === 'real') {
    // Derive unique contacts from real meetings & attendees and memories
    const [meetings, memories] = await Promise.all([
      getAllMeetings(),
      getMemories()
    ]);

    const contactMap = new Map<string, Contact>();

    meetings.forEach((m) => {
      (m.attendees || []).forEach((a) => {
        const key = (a.email || a.name).toLowerCase().trim();
        if (!key) return;

        const existing = contactMap.get(key);
        const meetingDate = m.startTime
          ? typeof m.startTime === 'object' && '_seconds' in m.startTime
            ? new Date(m.startTime._seconds * 1000).toISOString()
            : String(m.startTime)
          : new Date().toISOString();

        if (existing) {
          existing.previousMeetingsCount += 1;
          if (new Date(meetingDate) > new Date(existing.lastMeetingDate)) {
            existing.lastMeetingDate = meetingDate;
          }
        } else {
          contactMap.set(key, {
            id: `contact-${encodeURIComponent(key)}`,
            name: a.name || 'Participant',
            email: a.email || '',
            company: a.company || 'Enterprise Partner',
            title: a.role || 'Stakeholder',
            department: a.role || 'Executive',
            previousMeetingsCount: 1,
            relationshipHealth: 'strong',
            tags: ['Active Stakeholder'],
            lastMeetingDate: meetingDate,
            openCommitmentsCount: 0,
            preferences: [],
            knownConcerns: []
          });
        }
      });
    });

    // Populate concerns & open commitments from memories
    memories.forEach((mem) => {
      const key = (mem.attendeeEmail || mem.attendeeName).toLowerCase().trim();
      if (!key) return;
      let contact = contactMap.get(key);
      if (!contact) {
        contact = {
          id: `contact-${encodeURIComponent(key)}`,
          name: mem.attendeeName || 'Participant',
          email: mem.attendeeEmail || '',
          company: 'Enterprise Partner',
          title: 'Stakeholder',
          department: 'Executive',
          previousMeetingsCount: 1,
          relationshipHealth: 'strong',
          tags: ['Active Stakeholder'],
          lastMeetingDate: mem.createdAt ? new Date(mem.createdAt).toISOString() : new Date().toISOString(),
          openCommitmentsCount: 0,
          preferences: [],
          knownConcerns: []
        };
        contactMap.set(key, contact);
      }

      if (mem.category === 'concern') {
        contact.knownConcerns.push({
          id: mem.id,
          topic: mem.tags?.[0] || 'Concern',
          description: mem.note,
          severity: mem.sentiment === 'cautious' ? 'high' : 'medium',
          detectedInMeetingId: mem.meetingId || '',
          detectedDate: new Date().toISOString()
        });
      } else if (mem.category === 'commitment') {
        contact.openCommitmentsCount += 1;
      }
    });

    return Array.from(contactMap.values());
  }

  // Mock Mode
  await delay(150);
  return JSON.parse(JSON.stringify(currentContacts));
}

export async function getContact(id: string): Promise<Contact | null> {
  if (getApiMode() === 'real') {
    const contacts = await getContacts();
    return contacts.find((c) => c.id === id || c.email.toLowerCase() === id.toLowerCase()) || null;
  }

  await delay(150);
  return currentContacts.find((c) => c.id === id) || null;
}

export async function getAllCommitments(): Promise<Commitment[]> {
  if (getApiMode() === 'real') {
    const [memories, meetings] = await Promise.all([
      getMemories({ category: 'commitment' }),
      getAllMeetings()
    ]);

    const meetingTitleMap = new Map(meetings.map((m) => [m.id, m.title]));

    return memories.map((mem) => ({
      id: mem.id,
      meetingId: mem.meetingId || '',
      owner: 'team',
      ownerName: mem.attendeeName || 'Team',
      title: mem.note,
      description: `Commitment logged for ${mem.attendeeName || mem.attendeeEmail}`,
      dueDate: mem.createdAt ? new Date().toISOString().split('T')[0] : 'Open',
      status: 'open',
      sourceMeetingTitle: (mem.meetingId && meetingTitleMap.get(mem.meetingId)) || 'Strategy Sync',
      sourceMeetingDate: new Date().toISOString()
    }));
  }

  await delay(150);
  const commitments: Commitment[] = [];
  currentMeetings.forEach((m) => {
    if (m.commitments) commitments.push(...m.commitments);
  });
  return commitments;
}

export async function updateCommitmentStatus(
  commitmentId: string,
  status: Commitment['status']
): Promise<boolean> {
  if (getApiMode() === 'real') {
    return true;
  }

  await delay(150);
  currentMeetings.forEach((m) => {
    if (m.commitments) {
      const c = m.commitments.find((x) => x.id === commitmentId);
      if (c) c.status = status;
    }
  });
  saveMeetings(currentMeetings);
  return true;
}

export async function addCommitment(payload: {
  meetingId: string;
  title: string;
  ownerName?: string;
  dueDate?: string;
  description?: string;
}): Promise<Commitment> {
  if (getApiMode() === 'real') {
    const mem = await createMemory({
      meetingId: payload.meetingId,
      category: 'commitment',
      note: payload.title,
      attendeeName: payload.ownerName || 'Team'
    });
    return {
      id: mem.id,
      meetingId: payload.meetingId,
      owner: 'you',
      ownerName: payload.ownerName || 'You',
      title: payload.title,
      description: payload.description || '',
      dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
      status: 'open'
    };
  }

  await delay(150);
  const newCommitment: Commitment = {
    id: `com-${Date.now()}`,
    meetingId: payload.meetingId,
    owner: 'you',
    ownerName: payload.ownerName || 'You',
    title: payload.title,
    description: payload.description || '',
    dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
    status: 'open'
  };
  const m = currentMeetings.find((x) => x.id === payload.meetingId);
  if (m) {
    if (!m.commitments) m.commitments = [];
    m.commitments.push(newCommitment);
    saveMeetings(currentMeetings);
  }
  return newCommitment;
}

export async function completeMeeting(meetingId: string, debrief: PostMeetingInput): Promise<Meeting> {
  if (getApiMode() === 'real') {
    // 1. Save memories for each takeaway/commitment
    if (debrief.newCommitments && debrief.newCommitments.length > 0) {
      for (const com of debrief.newCommitments) {
        await createMemory({
          meetingId,
          category: 'commitment',
          note: `${com.title}${com.description ? ` (${com.description})` : ''}`,
          attendeeName: com.ownerName || 'Team'
        });
      }
    }

    if (debrief.discussionTopics && debrief.discussionTopics.length > 0) {
      for (const topic of debrief.discussionTopics) {
        await createMemory({
          meetingId,
          category: 'decision',
          note: topic
        });
      }
    }

    if (debrief.rawNotes) {
      await createMemory({
        meetingId,
        category: 'rapport',
        note: debrief.rawNotes
      });
    }

    // 2. Mark meeting as completed
    return await updateMeeting(meetingId, {
      status: 'completed',
      summary: debrief.summary || debrief.rawNotes || 'Debrief recorded'
    });
  }

  // Mock mode
  await delay(300);
  const m = currentMeetings.find((x) => x.id === meetingId);
  if (m) {
    m.status = 'completed';
    m.postMeetingInput = debrief;
    m.summary = debrief.summary || debrief.rawNotes;
    saveMeetings(currentMeetings);
    return m;
  }
  throw new Error(`Meeting ${meetingId} not found`);
}

export async function getMeetingsByContact(contactId: string): Promise<Meeting[]> {
  const all = await getAllMeetings();
  return all.filter((m) => m.contactId === contactId);
}

export async function getTimelineEvents(_contactId?: string): Promise<TimelineEvent[]> {
  if (getApiMode() === 'real') {
    const [meetings, memories] = await Promise.all([
      getAllMeetings(),
      getMemories()
    ]);

    const events: TimelineEvent[] = [];

    meetings.forEach((m) => {
      const dateStr = m.startTime
        ? typeof m.startTime === 'object' && '_seconds' in m.startTime
          ? new Date(m.startTime._seconds * 1000).toISOString()
          : String(m.startTime)
        : new Date().toISOString();

      events.push({
        id: `event-meet-${m.id}`,
        type: 'meeting',
        date: dateStr.split('T')[0],
        title: m.title,
        description: m.description || 'Strategic meeting session',
        summary: m.summary,
        meetingId: m.id,
        badgeText: m.status.toUpperCase(),
        badgeVariant: m.status === 'completed' ? 'success' : 'primary'
      });
    });

    memories.forEach((mem) => {
      const dateStr = mem.createdAt
        ? typeof mem.createdAt === 'object' && '_seconds' in mem.createdAt
          ? new Date(mem.createdAt._seconds * 1000).toISOString()
          : String(mem.createdAt)
        : new Date().toISOString();

      events.push({
        id: `event-mem-${mem.id}`,
        type: 'memory',
        date: dateStr.split('T')[0],
        title: `[${mem.category.toUpperCase()}] ${mem.attendeeName || 'Stakeholder Note'}`,
        description: mem.note,
        badgeText: mem.category.toUpperCase(),
        badgeVariant: mem.category === 'commitment' ? 'purple' : mem.category === 'concern' ? 'danger' : 'info',
        details: {
          note: mem.note,
          sentiment: mem.sentiment,
          category: mem.category
        }
      });
    });

    // Sort descending by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }

  // Mock Mode
  await delay(150);
  return [];
}

export async function resetDemoData(): Promise<void> {
  currentContacts = JSON.parse(JSON.stringify(INITIAL_CONTACTS));
  currentMeetings = JSON.parse(JSON.stringify(INITIAL_MEETINGS));
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CONTACTS_STORAGE_KEY);
    localStorage.removeItem(MEETINGS_STORAGE_KEY);
    localStorage.removeItem(MEMORIES_STORAGE_KEY);
  }
}

export const apiService = {
  getAllMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getPrepBrief,
  prepareMeeting,
  updateBriefNotes,
  getMemories,
  createMemory,
  deleteMemory,
  getContacts,
  getContact,
  getAllCommitments,
  updateCommitmentStatus,
  addCommitment,
  completeMeeting,
  getMeetingsByContact,
  getTimelineEvents,
  resetDemoData
};
