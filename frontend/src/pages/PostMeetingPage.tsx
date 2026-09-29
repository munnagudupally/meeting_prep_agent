import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileCheck2,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  AlertTriangle,
  Bookmark,
  ChevronRight,
  RotateCcw,
  History,
  ListTodo,
  BrainCircuit,
  MessageSquare,
  CheckSquare,
  FileText,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { apiService } from '../services/apiService';
import type { Meeting, Contact, PostMeetingInput } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PostMeetingPage: React.FC = () => {
  const { id = 'meeting-6' } = useParams<{ id: string }>();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [nextUpcomingMeeting, setNextUpcomingMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  // Form states initialized cleanly
  const [summary, setSummary] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [discussionTopics, setDiscussionTopics] = useState<string[]>([]);
  const [newTopicText, setNewTopicText] = useState('');

  const [decisions, setDecisions] = useState<string[]>([]);
  const [newDecisionText, setNewDecisionText] = useState('');

  const [newCommitments, setNewCommitments] = useState<
    NonNullable<PostMeetingInput['newCommitments']>
  >([]);

  const [newConcerns, setNewConcerns] = useState<
    NonNullable<PostMeetingInput['newConcerns']>
  >([]);

  const [newPreferences, setNewPreferences] = useState<
    NonNullable<PostMeetingInput['newPreferences']>
  >([]);

  const [newFacts, setNewFacts] = useState<
    NonNullable<PostMeetingInput['newFacts']>
  >([
    {
      tag: 'Q4 Infrastructure Expansion Budget',
      excerpt: 'Rahul confirmed Acme CFO verbally signed off on the $1.2M multi-region infrastructure allocation.',
      whyItMatters: 'Eliminates budget freeze risk for October 15 rollout and annual agreement.'
    }
  ]);

  const [followUps, setFollowUps] = useState<string[]>([
    'Send calendar invite for SRE war room rehearsal on Oct 10',
    'Draft EU-West data residency roadmap brief for Priya Desai'
  ]);
  const [newFollowUpText, setNewFollowUpText] = useState('');

  const [nextMeetingDate, setNextMeetingDate] = useState('2026-10-15T14:00');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const m = await apiService.getMeeting(id);
        if (m) {
          setMeeting(m);
          const stakeholderNames = (m.attendees || []).map((a) => a.name).filter(Boolean).join(', ');
          setSummary(`Executive debrief for "${m.title}" with ${stakeholderNames || 'stakeholders'}.`);
          setRawNotes(`Key takeaways, decisions, and action items agreed upon during "${m.title}".`);
          if (m.contactId) {
            const c = await apiService.getContact(m.contactId);
            setContact(c);
          }
        }

        const all = await apiService.getAllMeetings();

        // Find next upcoming meeting after this one
        const upcoming = all.find((item) => item.id !== id && item.status === 'upcoming');
        if (upcoming) {
          setNextUpcomingMeeting(upcoming);
        }
      } catch (err) {
        console.error('Failed to load meeting context for post-meeting input', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Topic Handlers
  const handleAddTopic = () => {
    if (newTopicText.trim()) {
      setDiscussionTopics([...discussionTopics, newTopicText.trim()]);
      setNewTopicText('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setDiscussionTopics(discussionTopics.filter((_, i) => i !== index));
  };

  // Decision Handlers
  const handleAddDecision = () => {
    if (newDecisionText.trim()) {
      setDecisions([...decisions, newDecisionText.trim()]);
      setNewDecisionText('');
    }
  };

  const handleRemoveDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  // Follow-up Handlers
  const handleAddFollowUp = () => {
    if (newFollowUpText.trim()) {
      setFollowUps([...followUps, newFollowUpText.trim()]);
      setNewFollowUpText('');
    }
  };

  const handleRemoveFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index));
  };

  // Commitment Handlers
  const handleAddCommitment = () => {
    setNewCommitments([
      ...newCommitments,
      {
        title: '',
        owner: 'you',
        ownerName: 'Your Team',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        description: ''
      }
    ]);
  };

  const handleRemoveCommitment = (index: number) => {
    setNewCommitments(newCommitments.filter((_, i) => i !== index));
  };

  const handleUpdateCommitment = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...newCommitments];
    if (field === 'owner') {
      const ownerVal = value as 'you' | 'contact' | 'team';
      updated[index].owner = ownerVal;
      if (ownerVal === 'you') {
        updated[index].ownerName = 'Your Team';
      } else if (ownerVal === 'contact') {
        updated[index].ownerName = contact?.name || 'Stakeholder';
      } else {
        updated[index].ownerName = 'Joint / Team';
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setNewCommitments(updated);
  };

  // Concern Handlers
  const handleAddConcern = () => {
    setNewConcerns([
      ...newConcerns,
      {
        topic: '',
        description: '',
        severity: 'medium'
      }
    ]);
  };

  const handleRemoveConcern = (index: number) => {
    setNewConcerns(newConcerns.filter((_, i) => i !== index));
  };

  const handleUpdateConcern = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...newConcerns];
    (updated[index] as any)[field] = value;
    setNewConcerns(updated);
  };

  // Preference Handlers
  const handleAddPreference = () => {
    setNewPreferences([
      ...newPreferences,
      {
        category: 'communication',
        text: '',
        context: ''
      }
    ]);
  };

  const handleRemovePreference = (index: number) => {
    setNewPreferences(newPreferences.filter((_, i) => i !== index));
  };

  const handleUpdatePreference = (
    index: number,
    field: keyof NonNullable<PostMeetingInput['newPreferences']>[0],
    value: string
  ) => {
    const updated = [...newPreferences];
    (updated[index] as Record<string, unknown>)[field] = value;
    setNewPreferences(updated);
  };

  // Fact Handlers
  const handleAddFact = () => {
    setNewFacts([
      ...newFacts,
      {
        tag: '',
        excerpt: '',
        whyItMatters: ''
      }
    ]);
  };

  const handleRemoveFact = (index: number) => {
    setNewFacts(newFacts.filter((_, i) => i !== index));
  };

  const handleUpdateFact = (
    index: number,
    field: keyof NonNullable<PostMeetingInput['newFacts']>[0],
    value: string
  ) => {
    const updated = [...newFacts];
    (updated[index] as Record<string, unknown>)[field] = value;
    setNewFacts(updated);
  };

  // Reset to clear or refill demo data
  const handlePreloadDemoData = () => {
    setSummary(
      'Executive sync with Rahul Sharma: Graviton3 memory benchmarks verified 24% lower query latency and 22% reduced node cost, unlocking verbal CFO approval for the annual enterprise rollout on October 15.'
    );
    setRawNotes(
      'Met with Rahul Sharma for 30 minutes. Successfully reviewed the Graviton3 memory benchmarks showing a 24% reduction in query latency and 22% lower node cost. Rahul was impressed and confirmed his CFO gave verbal approval for the annual tier. He requested that our SRE leads join a shared Slack Connect channel ahead of the October 15 rollout. Also noted that their security team requires EU-West data residency guarantees before Q1.'
    );
    setDiscussionTopics([
      'Graviton3 benchmark presentation & 24% latency reduction',
      'SLA appendix terms & 15-minute rolling rebate tiers',
      'October 15 US-East production rollout milestones',
      'EU-West data residency requirements for Q1 expansion'
    ]);
    setDecisions([
      'Approved annual enterprise contract term sheet with 150ms p99 SLA',
      'October 15 US-East rollout confirmed as primary launch target',
      'Agreed to establish dedicated SRE Slack Connect war room'
    ]);
    setNewCommitments([
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
        description: 'Invite Acme SRE leads (Priya Desai & infrastructure leads).'
      },
      {
        title: 'Provide signed war room on-call roster for Oct 15 cutover',
        owner: 'contact',
        ownerName: contact?.name || 'Rahul Sharma',
        dueDate: '2026-10-08',
        description: 'Acme SRE on-call engineers assigned to US-East switchover.'
      }
    ]);
    setNewConcerns([
      {
        topic: 'EU-West Data Residency & Compliance Timeline',
        description:
          'Acme European banking clients require localized storage guarantees before expanding past US-East.',
        severity: 'medium'
      }
    ]);
    setNewPreferences([
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
    ]);
    setNewFacts([
      {
        tag: 'Q4 Infrastructure Expansion Budget',
        excerpt: 'Rahul confirmed Acme CFO verbally signed off on the $1.2M multi-region infrastructure allocation.',
        whyItMatters: 'Eliminates budget freeze risk for October 15 rollout and annual agreement.'
      }
    ]);
    setFollowUps([
      'Send calendar invite for SRE war room rehearsal on Oct 10',
      'Draft EU-West data residency roadmap brief for Priya Desai'
    ]);
    setNextMeetingDate('2026-10-15T14:00');
  };

  const handleClearForm = () => {
    setSummary('');
    setRawNotes('');
    setDiscussionTopics([]);
    setDecisions([]);
    setNewCommitments([]);
    setNewConcerns([]);
    setNewPreferences([]);
    setNewFacts([]);
    setFollowUps([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim() && !summary.trim()) {
      alert('Please provide at least a summary or meeting notes before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // Filter out empty items
      const validCommitments = newCommitments.filter((c) => c.title.trim().length > 0);
      const validConcerns = newConcerns.filter((c) => c.topic.trim().length > 0);
      const validPreferences = newPreferences.filter((p) => p.text.trim().length > 0);
      const validFacts = newFacts.filter((f) => f.tag.trim().length > 0);

      const payload: PostMeetingInput = {
        summary: summary.trim(),
        rawNotes: rawNotes.trim(),
        discussionTopics: discussionTopics.filter((t) => t.trim().length > 0),
        decisions: decisions.filter((d) => d.trim().length > 0),
        followUps: followUps.filter((f) => f.trim().length > 0),
        newCommitments: validCommitments,
        newConcerns: validConcerns,
        newPreferences: validPreferences,
        newFacts: validFacts,
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate).toISOString() : undefined
      };

      await apiService.completeMeeting(id, payload);
      setCompletedSuccess(true);
    } catch (err) {
      console.error('Failed to complete meeting', err);
      alert('Error saving meeting debrief. Please check console.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading meeting debrief context..." fullHeight />;
  }

  // Success Completion Screen
  if (completedSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in zoom-in duration-300">
        {/* Success Banner */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <Badge variant="success" size="md">
              Debrief Ingestion Complete
            </Badge>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Meeting Logged & Memory Synchronized!
            </h1>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Hindsight has marked <span className="text-white font-medium">{meeting?.title}</span> as completed,
              updated <span className="text-white font-medium">{contact?.name}</span>'s relationship intelligence,
              and indexed new commitments into the global ledger.
            </p>
          </div>
        </div>

        {/* Sync Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <div className="text-2xl font-bold text-emerald-400">
              {newCommitments.filter((c) => c.title.trim()).length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              Commitments
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <div className="text-2xl font-bold text-amber-400">
              {newConcerns.filter((c) => c.topic.trim()).length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Concerns Logged
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <div className="text-2xl font-bold text-sky-400">
              {newPreferences.filter((p) => p.text.trim()).length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Preferences
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
            <div className="text-2xl font-bold text-purple-400">
              {newFacts.filter((f) => f.tag.trim()).length}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              Facts Remembered
            </div>
          </div>
        </div>

        {/* Action Navigation Options */}
        <Card
          title="Where would you like to go next?"
          subtitle="Explore the updated state across Hindsight's intelligence workspace"
          icon={<CompassIcon className="w-5 h-5 text-indigo-400" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Primary Action: View Meeting History */}
            <Link
              to="/meetings"
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/70 transition-all group flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  Meeting History
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  See all completed meetings, notes, and past debriefs
                </p>
              </div>
            </Link>

            {/* Next Meeting Action */}
            {nextUpcomingMeeting ? (
              <Link
                to={`/meetings/${nextUpcomingMeeting.id}/brief`}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all group flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-300 flex items-center gap-1.5 truncate">
                    Next: {nextUpcomingMeeting.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Jump to the upcoming brief for your next scheduled sync
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                to="/meetings/new"
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all group flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                    Schedule Next Meeting
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plan your next sync and let Hindsight prepare research
                  </p>
                </div>
              </Link>
            )}

            {/* View Memory Timeline */}
            <Link
              to={contact ? `/timeline?contactId=${contact.id}` : '/timeline'}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900/70 transition-all group flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                  Memory Timeline
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify chronologically ordered events, quotes, and decisions
                </p>
              </div>
            </Link>

            {/* View Commitments Ledger */}
            <Link
              to={contact ? `/commitments?contactId=${contact.id}` : '/commitments'}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/70 transition-all group flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                <ListTodo className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                  Commitments Ledger
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage newly indexed deliverables, owners, and due dates
                </p>
              </div>
            </Link>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
            <Link
              to={`/meetings/${id}/brief`}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Inspect Updated Meeting Brief for this meeting
            </Link>
            {contact && (
              <Link
                to={`/contacts/${contact.id}`}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
              >
                View {contact.name}'s Full Dossier
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/meetings" className="hover:text-slate-200">
              Meetings
            </Link>
            <span>/</span>
            <Link to={`/meetings/${id}/brief`} className="hover:text-slate-200">
              {meeting?.title || 'Meeting'}
            </Link>
            <span>/</span>
            <span className="text-indigo-400 font-medium">Post-Meeting Input</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-indigo-400" />
            Post-Meeting Input & Debrief
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Capture discussion notes, record commitments, track blockers, and ingest new preferences and
            facts into Hindsight's relational memory graph.
          </p>
        </div>

        {/* Demo Data Helpers */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="xs"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleClearForm}
            title="Clear all fields to enter fresh notes"
          >
            Clear Form
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={handlePreloadDemoData}
            title="Preload realistic sync notes for testing"
          >
            Fill Demo Data
          </Button>
        </div>
      </div>

      {/* Section 1: Meeting & Contact Dossier */}
      {meeting && contact && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Contact Snapshot */}
            <div className="flex items-center gap-3.5">
              <img
                src={contact.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{contact.name}</h3>
                  <Badge variant="outline" size="sm">
                    {contact.title}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {contact.company} • {contact.department}
                </p>
              </div>
            </div>

            {/* Meeting Meta */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {meeting.scheduledAt || meeting.startTime
                    ? new Date(
                        typeof meeting.startTime === 'object' && meeting.startTime?._seconds
                          ? meeting.startTime._seconds * 1000
                          : meeting.scheduledAt || meeting.startTime
                      ).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Session'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{meeting.durationMinutes} mins</span>
              </div>
              <Badge variant={meeting.status === 'completed' ? 'success' : 'primary'}>
                {meeting.status === 'completed' ? 'Completed' : 'Debrief in Progress'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Meeting Subject:{' '}
              <span className="text-slate-200 font-medium">{meeting.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/meetings/${id}/brief`}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Inspect Meeting Brief
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 2: Meeting Summary and Notes */}
        <Card
          title="Meeting Summary & Notes"
          subtitle="Record verbatim notes and high-level executive summary"
          icon={<FileText className="w-5 h-5 text-indigo-400" />}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Executive Summary <span className="text-indigo-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">
                High-level synthesis displayed in meeting cards, memory timeline, and executive rollups.
              </p>
              <textarea
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief executive synopsis of the meeting outcome and primary conclusion..."
                className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Raw Discussion Notes & Verbatim Context <span className="text-indigo-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Full discussion transcript or notes used by Hindsight to index relational context and facts.
              </p>
              <textarea
                rows={5}
                required
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="Detailed meeting notes, verbatim quotes, and technical context..."
                className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed font-sans"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Discussion Points & Agreed Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discussion Topics */}
          <Card
            title="Discussion Points Addressed"
            subtitle={`${discussionTopics.length} topics covered in this sync`}
            icon={<MessageSquare className="w-5 h-5 text-sky-400" />}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add discussion topic..."
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddTopic}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {discussionTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <span className="flex-1 leading-snug">{topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(i)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="Remove topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {discussionTopics.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No discussion topics added yet.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Agreed Decisions */}
          <Card
            title="Consensus Decisions Reached"
            subtitle={`${decisions.length} agreed decisions recorded`}
            icon={<CheckSquare className="w-5 h-5 text-emerald-400" />}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add agreed decision..."
                  value={newDecisionText}
                  onChange={(e) => setNewDecisionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDecision();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddDecision}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {decisions.map((dec, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-start gap-2 flex-1 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{dec}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDecision(i)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="Remove decision"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {decisions.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No agreed decisions added yet.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Section 4: New Commitments, Owners, and Due Dates */}
        <Card
          title="New Commitments & Deliverables"
          subtitle="Tracked action items indexed into the global commitment ledger"
          icon={<ListTodo className="w-5 h-5 text-indigo-400" />}
          action={
            <Button
              type="button"
              size="xs"
              variant="secondary"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddCommitment}
            >
              Add Commitment
            </Button>
          }
        >
          <div className="space-y-3.5">
            {newCommitments.map((com, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition-colors space-y-3"
              >
                {/* Title and Remove */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Action Item Title <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={com.title}
                      onChange={(e) => handleUpdateCommitment(idx, 'title', e.target.value)}
                      placeholder="e.g. Deliver benchmark comparison spreadsheet..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCommitment(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 mt-4 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete commitment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Owner, Due Date, and Description Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Owner Party
                    </label>
                    <select
                      value={com.owner}
                      onChange={(e) => handleUpdateCommitment(idx, 'owner', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                    >
                      <option value="you">You (Your Team)</option>
                      <option value="contact">{contact ? `${contact.name} (${contact.company})` : 'Contact'}</option>
                      <option value="team">Cross-functional / Shared</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Due Date <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={com.dueDate}
                      onChange={(e) => handleUpdateCommitment(idx, 'dueDate', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Context / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Include SLA rebate appendix"
                      value={com.description || ''}
                      onChange={(e) => handleUpdateCommitment(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>
            ))}

            {newCommitments.length === 0 && (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-2">
                <p>No new commitments entered.</p>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddCommitment}
                >
                  Add First Commitment
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Section 5: Concerns and Blockers */}
        <Card
          title="Concerns, Risks & Blockers"
          subtitle="Surfaced objections or operational obstacles that require tracking"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          action={
            <Button
              type="button"
              size="xs"
              variant="secondary"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddConcern}
            >
              Add Concern
            </Button>
          }
        >
          <div className="space-y-3.5">
            {newConcerns.map((con, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Concern Topic / Headline <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={con.topic}
                      onChange={(e) => handleUpdateConcern(idx, 'topic', e.target.value)}
                      placeholder="e.g. EU-West Data Residency & Compliance Timeline..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="w-36">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Severity
                    </label>
                    <select
                      value={con.severity}
                      onChange={(e) =>
                        handleUpdateConcern(
                          idx,
                          'severity',
                          e.target.value as 'low' | 'medium' | 'high'
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
                    >
                      <option value="low">Low Severity</option>
                      <option value="medium">Medium Severity</option>
                      <option value="high">High Severity</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveConcern(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 mt-4 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove concern"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Description & Grounding Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={con.description}
                    onChange={(e) => handleUpdateConcern(idx, 'description', e.target.value)}
                    placeholder="Details on why this blocker was raised, who cares, and mitigation plan..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans"
                  />
                </div>
              </div>
            ))}

            {newConcerns.length === 0 && (
              <div className="p-5 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                No active concerns or blockers recorded for this session.
              </div>
            )}
          </div>
        </Card>

        {/* Section 6: Updated Preferences and Important Facts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Updated Preferences */}
          <Card
            title="Updated Preferences"
            subtitle="Learned behavioral habits or communication needs"
            icon={<Sliders className="w-5 h-5 text-sky-400" />}
            action={
              <Button
                type="button"
                size="xs"
                variant="secondary"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={handleAddPreference}
              >
                Add Pref
              </Button>
            }
          >
            <div className="space-y-3.5">
              {newPreferences.map((pref, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={pref.category}
                      onChange={(e) =>
                        handleUpdatePreference(
                          idx,
                          'category',
                          e.target.value as 'communication' | 'decision-making' | 'technical' | 'scheduling'
                        )
                      }
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-sky-300 focus:outline-none cursor-pointer"
                    >
                      <option value="communication">Communication</option>
                      <option value="decision-making">Decision-making</option>
                      <option value="technical">Technical</option>
                      <option value="scheduling">Scheduling</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemovePreference(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Preference statement..."
                      value={pref.text}
                      onChange={(e) => handleUpdatePreference(idx, 'text', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Context / trigger quote..."
                      value={pref.context}
                      onChange={(e) => handleUpdatePreference(idx, 'context', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400"
                    />
                  </div>
                </div>
              ))}

              {newPreferences.length === 0 && (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  No new preferences recorded.
                </p>
              )}
            </div>
          </Card>

          {/* Important Facts (Memory Sources) */}
          <Card
            title="Important Facts (Memory Sources)"
            subtitle="Grounding quotes and intel stored into memory sources"
            icon={<Bookmark className="w-5 h-5 text-purple-400" />}
            action={
              <Button
                type="button"
                size="xs"
                variant="secondary"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={handleAddFact}
              >
                Add Fact
              </Button>
            }
          >
            <div className="space-y-3.5">
              {newFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Topic Tag (e.g. Budget, SRE Roster)..."
                      value={fact.tag}
                      onChange={(e) => handleUpdateFact(idx, 'tag', e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-purple-300 focus:outline-none flex-1 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFact(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Fact excerpt / verbatim quote..."
                      value={fact.excerpt}
                      onChange={(e) => handleUpdateFact(idx, 'excerpt', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Why it matters / strategic rationale..."
                      value={fact.whyItMatters}
                      onChange={(e) => handleUpdateFact(idx, 'whyItMatters', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400"
                    />
                  </div>
                </div>
              ))}

              {newFacts.length === 0 && (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  No new memory facts recorded.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Section 7: Follow-up Actions & Next Meeting */}
        <Card
          title="Follow-Up Actions & Next Cadence"
          subtitle="Next scheduled interaction and preparation tasks"
          icon={<Calendar className="w-5 h-5 text-indigo-400" />}
        >
          <div className="space-y-4">
            {/* Follow-up tasks */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Immediate Follow-Up Actions
              </label>
              <div className="flex items-center gap-2 mb-2.5">
                <input
                  type="text"
                  placeholder="e.g. Send calendar invite for rehearsal on Oct 10..."
                  value={newFollowUpText}
                  onChange={(e) => setNewFollowUpText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFollowUp();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddFollowUp}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                {followUps.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <span>{action}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFollowUp(i)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Meeting Date */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Target Next Meeting Date & Time
              </label>
              <input
                type="datetime-local"
                value={nextMeetingDate}
                onChange={(e) => setNextMeetingDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl z-20">
          <Link to={`/meetings/${id}/brief`}>
            <Button type="button" variant="ghost" size="md">
              Cancel & Return
            </Button>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              isLoading={submitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Complete Meeting & Ingest into Memory
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Compass icon helper
const CompassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
