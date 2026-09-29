export interface UserPreferences {
  briefingStyle: 'concise' | 'detailed' | 'bullet-points';
  defaultMeetingDuration: number;
  emailNotifications: boolean;
}

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: UserPreferences;
  createdAt?: any;
  updatedAt?: any;
}

export interface MeetingAttendee {
  name: string;
  email: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
}

export interface ContactPreference {
  id: string;
  category: 'communication' | 'decision-making' | 'technical' | 'scheduling';
  text: string;
  context: string;
}

export interface KnownConcern {
  id: string;
  topic: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedInMeetingId: string;
  detectedDate: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  department: string;
  email: string;
  avatarUrl?: string;
  previousMeetingsCount: number;
  relationshipHealth: 'strong' | 'neutral' | 'at-risk';
  tags: string[];
  lastMeetingDate: string;
  nextMeetingDate?: string;
  preferences: ContactPreference[];
  knownConcerns: KnownConcern[];
  openCommitmentsCount: number;
  bio?: string;
}

export interface Commitment {
  id: string;
  meetingId: string;
  contactId?: string;
  owner: 'you' | 'contact' | 'team';
  ownerName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'open' | 'completed' | 'in-progress' | 'blocked';
  sourceMeetingTitle?: string;
  sourceMeetingDate?: string;
}

export interface MemorySource {
  id: string;
  meetingId?: string;
  meetingTitle: string;
  meetingDate: string;
  excerpt: string;
  contextType?: 'commitment' | 'concern' | 'preference' | 'decision' | 'relationship';
  relevanceScore?: number;
  timestampInMeeting?: string;
  tag: string;
  whyItMatters?: string;
}

export interface RecommendedQuestion {
  id: string;
  question: string;
  rationale: string;
  linkedMemorySourceId?: string;
}

export interface RiskOrFollowUp {
  id: string;
  type: 'risk' | 'follow-up';
  title: string;
  impact: string;
  sourceSnippet: string;
  suggestedAction: string;
}

export interface AttendeeProfile {
  name: string;
  email: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
  background?: string;
  recentNews?: string;
  pastInteractionsSummary?: string;
}

export interface HindsightInsight {
  topic: string;
  insight: string;
  relevance: string;
}

export interface MeetingBrief {
  id?: string;
  meetingId: string;
  userId?: string;
  summary: string;
  objectives?: string[];
  attendeeProfiles?: AttendeeProfile[];
  keyTalkingPoints?: string[];
  recommendedQuestions?: any;
  potentialRisks?: string[];
  hindsightInsights?: HindsightInsight[];
  customNotes?: string;
  briefingStyle?: string;
  version?: number;
  createdAt?: any;
  updatedAt?: any;

  // Mock / backward compatibility fields
  contactId?: string;
  generatedAt?: string;
  relationship?: any;
  keyContext?: any;
  memorySources?: any;
}

export type MeetingBriefData = MeetingBrief;

export interface PostMeetingInput {
  rawNotes?: string;
  summary?: string;
  discussionTopics?: string[];
  decisions?: string[];
  followUps?: string[];
  newCommitments?: Array<{
    title: string;
    owner: 'you' | 'contact' | 'team';
    ownerName: string;
    dueDate: string;
    description?: string;
  }>;
  newConcerns?: Array<{
    topic: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  newPreferences?: Array<{
    category: 'communication' | 'decision-making' | 'technical' | 'scheduling';
    text: string;
    context: string;
  }>;
  newFacts?: Array<{
    tag: string;
    excerpt: string;
    whyItMatters: string;
  }>;
  nextMeetingDate?: string;
}

export type PostMeetingInputPayload = PostMeetingInput;

export interface Meeting {
  id: string;
  userId?: string;
  contactId?: string;
  title: string;
  description?: string;
  startTime?: any;
  endTime?: any;
  scheduledAt?: string;
  durationMinutes?: number;
  location?: string;
  attendees?: MeetingAttendee[];
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  prepStatus?: 'pending' | 'generating' | 'ready' | 'failed';
  prepBriefId?: string | null;
  meetingType?: '1-on-1' | 'executive-sync' | 'technical-review' | 'vendor-evaluation' | 'catch-up';
  agenda?: string[];
  summary?: string;
  discussionTopics?: string[];
  decisions?: string[];
  followUps?: string[];
  commitments?: Commitment[];
  notes?: string;
  postMeetingInput?: PostMeetingInput;
  brief?: MeetingBrief;
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string | null;
  location?: string;
  attendees?: MeetingAttendee[];
  status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  // Mock compatibility
  contactId?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingType?: '1-on-1' | 'executive-sync' | 'technical-review' | 'vendor-evaluation' | 'catch-up';
  agenda?: string[];
  notes?: string;
}

export interface CreateCommitmentPayload {
  meetingId: string;
  contactId?: string;
  owner: 'you' | 'contact' | 'team';
  ownerName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'open' | 'completed' | 'in-progress' | 'blocked';
  sourceMeetingTitle?: string;
  sourceMeetingDate?: string;
}

export interface Memory {
  id: string;
  userId?: string;
  attendeeEmail: string;
  attendeeName: string;
  meetingId?: string;
  category: string;
  note: string;
  sentiment: 'positive' | 'neutral' | 'cautious';
  tags: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CreateMemoryPayload {
  attendeeEmail?: string;
  attendeeName?: string;
  meetingId?: string;
  category?: string;
  note: string;
  sentiment?: 'positive' | 'neutral' | 'cautious';
  tags?: string[];
}

export type TimelineEventType = 'meeting' | 'fact' | 'concern' | 'preference' | 'commitment' | 'memory';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  timestamp?: string;
  title: string;
  description?: string;
  summary?: string;
  contactId?: string;
  contactName?: string;
  contactCompany?: string;
  meetingId?: string;
  meetingTitle?: string;
  badgeText: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'outline';
  details?: {
    decisions?: string[];
    discussionTopics?: string[];
    agenda?: string[];
    severity?: 'low' | 'medium' | 'high';
    category?: string;
    owner?: string;
    dueDate?: string;
    status?: 'open' | 'completed' | 'in-progress' | 'blocked';
    whyItMatters?: string;
    excerpt?: string;
    relevanceScore?: number;
    context?: string;
    commitmentId?: string;
    sentiment?: string;
    note?: string;
  };
}
