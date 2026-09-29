export {
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
  resetDemoData,
  apiService
} from './apiService';

export {
  getApiMode,
  setApiMode,
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiConfig,
  subscribeApiConfig,
  ApiError,
  DEFAULT_API_BASE_URL
} from './apiConfig';
export type { ApiMode } from './apiConfig';

export { runApiDiagnostics } from './apiDiagnostics';
export type { EndpointTestResult, DiagnosticsSummary } from './apiDiagnostics';
