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
  contactId: string;
  owner: 'you' | 'contact' | 'team';
  ownerName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'open' | 'completed' | 'in-progress' | 'blocked';
  sourceMeetingTitle: string;
  sourceMeetingDate: string;
}

export interface MemorySource {
  id: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  excerpt: string;
  contextType: 'commitment' | 'concern' | 'preference' | 'decision' | 'relationship';
  relevanceScore: number; // e.g. 0.95
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

export interface MeetingBrief {
  meetingId: string;
  contactId: string;
  generatedAt: string;
  relationship: {
    previousMeetingsCount: number;
    relationshipStatus: 'Strategic Partner' | 'Growing Trust' | 'Needs Attention';
    cadence: string;
    keyDynamic: string;
  };
  keyContext: {
    openCommitments: Commitment[];
    completedCommitments: Commitment[];
    knownConcerns: KnownConcern[];
    preferences: ContactPreference[];
    recommendedQuestions: RecommendedQuestion[];
    risksAndFollowUps: RiskOrFollowUp[];
  };
  memorySources: MemorySource[];
}

// Alias for backwards compatibility
export type MeetingBriefData = MeetingBrief;

export interface PostMeetingInput {
  rawNotes: string;
  summary?: string;
  discussionTopics: string[];
  decisions: string[];
  followUps?: string[];
  newCommitments: Array<{
    title: string;
    owner: 'you' | 'contact' | 'team';
    ownerName: string;
    dueDate: string;
    description?: string;
  }>;
  newConcerns: Array<{
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

// Alias for backwards compatibility
export type PostMeetingInputPayload = PostMeetingInput;

export interface Meeting {
  id: string;
  contactId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingType: '1-on-1' | 'executive-sync' | 'technical-review' | 'vendor-evaluation' | 'catch-up';
  agenda: string[];
  summary?: string;
  discussionTopics?: string[];
  decisions?: string[];
  followUps?: string[];
  commitments?: Commitment[];
  notes?: string;
  postMeetingInput?: PostMeetingInput;
  brief?: MeetingBrief;
}

export interface CreateMeetingPayload {
  contactId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: '1-on-1' | 'executive-sync' | 'technical-review' | 'vendor-evaluation' | 'catch-up';
  agenda: string[];
  notes?: string;
}

export interface CreateCommitmentPayload {
  meetingId: string;
  contactId: string;
  owner: 'you' | 'contact' | 'team';
  ownerName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'open' | 'completed' | 'in-progress' | 'blocked';
  sourceMeetingTitle: string;
  sourceMeetingDate: string;
}

export type TimelineEventType = 'meeting' | 'fact' | 'concern' | 'preference' | 'commitment';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  timestamp?: string;
  title: string;
  description?: string;
  summary?: string;
  contactId: string;
  contactName: string;
  contactCompany: string;
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
  };
}

