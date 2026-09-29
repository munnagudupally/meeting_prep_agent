import { getApiBaseUrl } from './apiConfig';

export interface EndpointTestResult {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  status: 'passed' | 'blocked' | 'mismatch' | 'error';
  statusCode?: number;
  latencyMs: number;
  message: string;
  requestPayload?: unknown;
  responseSnippet?: string;
}

export interface DiagnosticsSummary {
  baseUrl: string;
  timestamp: string;
  totalTested: number;
  passedCount: number;
  blockedCount: number;
  mismatchCount: number;
  results: EndpointTestResult[];
}

async function testSingleEndpoint(
  baseUrl: string,
  name: string,
  path: string,
  method: 'GET' | 'POST',
  body?: unknown,
  validator?: (data: unknown) => { valid: boolean; reason?: string }
): Promise<EndpointTestResult> {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = `${cleanBase}${path}`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(4000)
    });

    const latencyMs = Math.round(performance.now() - start);
    let parsedBody: unknown;
    let snippet = '';

    const text = await res.text();
    try {
      parsedBody = JSON.parse(text);
      snippet = JSON.stringify(parsedBody).slice(0, 300);
    } catch {
      snippet = text.slice(0, 300);
    }

    if (!res.ok) {
      return {
        name,
        endpoint: path,
        method,
        status: res.status === 404 ? 'blocked' : 'error',
        statusCode: res.status,
        latencyMs,
        message: `HTTP ${res.status} ${res.statusText}${snippet ? `: ${snippet}` : ''}`,
        requestPayload: body,
        responseSnippet: snippet
      };
    }

    // If 200 OK, run schema validation if supplied
    if (validator && parsedBody !== undefined) {
      const check = validator(parsedBody);
      if (!check.valid) {
        return {
          name,
          endpoint: path,
          method,
          status: 'mismatch',
          statusCode: res.status,
          latencyMs,
          message: `API Schema Mismatch: ${check.reason || 'Unexpected response shape'}`,
          requestPayload: body,
          responseSnippet: snippet
        };
      }
    }

    return {
      name,
      endpoint: path,
      method,
      status: 'passed',
      statusCode: res.status,
      latencyMs,
      message: `200 OK • Response valid`,
      requestPayload: body,
      responseSnippet: snippet
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const errMessage = err instanceof Error ? err.message : String(err);
    const isConnectionError =
      errMessage.includes('Failed to fetch') ||
      errMessage.includes('ECONNREFUSED') ||
      errMessage.includes('timed out') ||
      errMessage.includes('NetworkError');

    return {
      name,
      endpoint: path,
      method,
      status: 'blocked',
      latencyMs,
      message: isConnectionError
        ? `Connection Refused / Offline: Backend not listening at ${cleanBase}`
        : `Network Request Failed: ${errMessage}`,
      requestPayload: body
    };
  }
}

/**
 * Execute comprehensive live diagnostic check for all 6 required endpoints
 */
export async function runApiDiagnostics(targetBaseUrl?: string): Promise<DiagnosticsSummary> {
  const baseUrl = targetBaseUrl || getApiBaseUrl();
  const timestamp = new Date().toISOString();

  // Test 1: GET /contacts
  const t1 = await testSingleEndpoint(
    baseUrl,
    'List Contacts',
    '/contacts',
    'GET',
    undefined,
    (data) => {
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>)?.contacts)
        ? (data as Record<string, unknown>).contacts
        : Array.isArray((data as Record<string, unknown>)?.data)
        ? (data as Record<string, unknown>).data
        : null;
      if (!list) return { valid: false, reason: 'Expected JSON array of contacts' };
      return { valid: true };
    }
  );

  // Test 2: GET /contacts/:id
  const t2 = await testSingleEndpoint(
    baseUrl,
    'Get Single Contact Details',
    '/contacts/contact-rahul-sharma',
    'GET',
    undefined,
    (data) => {
      if (!data || typeof data !== 'object') return { valid: false, reason: 'Expected contact object' };
      return { valid: true };
    }
  );

  // Test 3: POST /meetings
  const sampleMeetingPayload = {
    contactId: 'contact-rahul-sharma',
    title: 'Diagnostic Test Sync',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 30,
    meetingType: 'technical-review',
    agenda: ['Verify backend meeting creation endpoint'],
    notes: 'Diagnostic health check automated test'
  };
  const t3 = await testSingleEndpoint(
    baseUrl,
    'Create Scheduled Meeting',
    '/meetings',
    'POST',
    sampleMeetingPayload,
    (data) => {
      const m = (data as Record<string, unknown>)?.meeting || data;
      if (!m || typeof m !== 'object' || !(m as Record<string, unknown>).id) {
        return { valid: false, reason: 'Expected created meeting entity with id' };
      }
      return { valid: true };
    }
  );

  // Test 4: GET /meetings/:id
  const t4 = await testSingleEndpoint(
    baseUrl,
    'Get Meeting Details',
    '/meetings/meeting-6',
    'GET',
    undefined,
    (data) => {
      const m = (data as Record<string, unknown>)?.meeting || data;
      if (!m || typeof m !== 'object' || !(m as Record<string, unknown>).id) {
        return { valid: false, reason: 'Expected meeting entity with id' };
      }
      return { valid: true };
    }
  );

  // Test 5: POST /meetings/:id/prepare
  const t5 = await testSingleEndpoint(
    baseUrl,
    'Prepare Meeting Intelligence Brief',
    '/meetings/meeting-6/prepare',
    'POST',
    {},
    (data) => {
      const b = (data as Record<string, unknown>)?.brief || data;
      if (!b || typeof b !== 'object') {
        return { valid: false, reason: 'Expected meeting brief object' };
      }
      return { valid: true };
    }
  );

  // Test 6: POST /meetings/:id/complete
  const sampleCompletePayload = {
    summary: 'Diagnostic test completion summary',
    rawNotes: 'Diagnostic test verbatim notes',
    discussionTopics: ['Integration check'],
    decisions: ['Verified endpoint contracts'],
    newCommitments: [
      {
        title: 'Verify backend integration',
        owner: 'you',
        ownerName: 'Your Team',
        dueDate: '2026-10-10'
      }
    ],
    newConcerns: []
  };
  const t6 = await testSingleEndpoint(
    baseUrl,
    'Complete Meeting & Debrief',
    '/meetings/meeting-6/complete',
    'POST',
    sampleCompletePayload,
    (data) => {
      const m = (data as Record<string, unknown>)?.meeting || data;
      if (!m || typeof m !== 'object' || !(m as Record<string, unknown>).id) {
        return { valid: false, reason: 'Expected completed meeting entity' };
      }
      return { valid: true };
    }
  );

  const results = [t1, t2, t3, t4, t5, t6];
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const blockedCount = results.filter((r) => r.status === 'blocked').length;
  const mismatchCount = results.filter((r) => r.status === 'mismatch').length;

  return {
    baseUrl,
    timestamp,
    totalTested: results.length,
    passedCount,
    blockedCount,
    mismatchCount,
    results
  };
}
