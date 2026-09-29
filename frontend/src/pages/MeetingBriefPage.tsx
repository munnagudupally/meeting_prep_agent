import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  ShieldAlert,
  Sliders,
  HelpCircle,
  AlertTriangle,
  History,
  X,
  ChevronRight,
  Calendar,
  BrainCircuit,
  User,
  Clock,
  ExternalLink,
  Search,
  Lightbulb,
  Sparkles,
  FileText,
  ListTodo,
  Copy,
  Check,
  Printer,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../services/apiService';
import type { Meeting, Contact, MeetingBriefData } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';

export const MeetingBriefPage: React.FC = () => {
  const { id = 'meeting-6' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [brief, setBrief] = useState<MeetingBriefData | null>(null);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);

  // Side Panel / Modal state for "View Memory Sources" (WHY?)
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  const [selectedMemoryTag, setSelectedMemoryTag] = useState<string>('all');
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>('');
  const [activeMemorySourceId, setActiveMemorySourceId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [m, meetingsList] = await Promise.all([
          apiService.getMeeting(id),
          apiService.getAllMeetings()
        ]);

        setAllMeetings(meetingsList);

        if (m) {
          setMeeting(m);
          const c = await apiService.getContact(m.contactId);
          setContact(c);

          if (m.brief) {
            setBrief(m.brief);
          } else {
            const b = await apiService.prepareMeeting(m.id);
            setBrief(b);
          }
        }
      } catch (err) {
        console.error('Failed to load meeting brief', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMemoryPanelOpen) {
        setIsMemoryPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMemoryPanelOpen]);

  // Auto-scroll to highlighted memory source card when opened
  useEffect(() => {
    if (isMemoryPanelOpen && activeMemorySourceId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`memory-source-${activeMemorySourceId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMemoryPanelOpen, activeMemorySourceId]);

  const openMemorySources = (tag = 'all', highlightId: string | null = null) => {
    setSelectedMemoryTag(tag);
    setActiveMemorySourceId(highlightId);
    setMemorySearchQuery('');
    setIsMemoryPanelOpen(true);
  };

  const copyBriefSummary = () => {
    if (!meeting || !brief) return;
    const formattedDate = new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = new Date(meeting.scheduledAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });

    const summaryText = `EXECUTIVE MEETING BRIEF
=====================================================
MEETING: ${meeting.title}
DATE: ${formattedDate} at ${formattedTime} (${meeting.durationMinutes} mins)
STATUS: ${meeting.status.toUpperCase()}
PARTICIPANT: ${contact?.name || 'Contact'} (${contact?.company || 'Company'}) - ${contact?.title || ''}
RELATIONSHIP POSTURE: ${brief.relationship.relationshipStatus} (${brief.relationship.previousMeetingsCount} previous meetings)
CADENCE: ${brief.relationship.cadence}

KEY DYNAMIC:
${brief.relationship.keyDynamic}

OPEN COMMITMENTS (${brief.keyContext.openCommitments.length}):
${brief.keyContext.openCommitments
  .map((c) => `• [Due ${c.dueDate}] ${c.title} (Owner: ${c.ownerName}) - From: ${c.sourceMeetingTitle}`)
  .join('\n')}

KNOWN CONCERNS (${brief.keyContext.knownConcerns.length}):
${brief.keyContext.knownConcerns
  .map((con) => `• [${con.severity.toUpperCase()}] ${con.topic}: ${con.description}`)
  .join('\n')}

OBSERVED PREFERENCES (${brief.keyContext.preferences.length}):
${brief.keyContext.preferences
  .map((p) => `• [${p.category.toUpperCase()}] ${p.text} (Grounding: ${p.context})`)
  .join('\n')}

STRATEGIC RECOMMENDED QUESTIONS:
${brief.keyContext.recommendedQuestions
  .map((q, idx) => `${idx + 1}. ${q.question}\n   Rationale: ${q.rationale}`)
  .join('\n\n')}

RISKS & FOLLOW-UPS:
${brief.keyContext.risksAndFollowUps
  .map((rf) => `• [${rf.type.toUpperCase()}] ${rf.title}\n   Impact: ${rf.impact}\n   Suggested Action: ${rf.suggestedAction}`)
  .join('\n\n')}
=====================================================
Grounded via Hindsight Memory Agent`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Synthesizing historical meeting memories & generating briefing dossier..."
        fullHeight
      />
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
        <ApiErrorBanner error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!meeting || !brief) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-white">Brief Not Available</h2>
        <p className="text-sm text-slate-400 mt-2">
          Unable to find or prepare briefing for this meeting.
        </p>
        <Link to="/meetings" className="text-indigo-400 mt-4 inline-block font-medium hover:underline">
          Return to meetings
        </Link>
      </div>
    );
  }

  const memorySources = brief.memorySources || [];
  const filteredMemories = memorySources.filter((m) => {
    const matchesTag = selectedMemoryTag === 'all' || m.contextType === selectedMemoryTag;
    const matchesSearch =
      !memorySearchQuery ||
      m.excerpt.toLowerCase().includes(memorySearchQuery.toLowerCase()) ||
      m.meetingTitle.toLowerCase().includes(memorySearchQuery.toLowerCase()) ||
      (m.whyItMatters && m.whyItMatters.toLowerCase().includes(memorySearchQuery.toLowerCase())) ||
      m.tag.toLowerCase().includes(memorySearchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const formattedDate = new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(meeting.scheduledAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP BREADCRUMB & PRIMARY ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <Link to="/meetings" className="hover:text-slate-200 transition-colors">
            Meetings
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-indigo-400 font-semibold truncate max-w-[240px]">
            {meeting.title}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Executive Briefing (Phase 5)</span>
        </div>

        {/* PROMINENT "WHY? VIEW MEMORY SOURCES" ACTION BUTTON & UTILITIES */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Meeting Selector */}
          {allMeetings.length > 1 && (
            <div className="relative">
              <select
                value={meeting.id}
                onChange={(e) => navigate(`/meetings/${e.target.value}/brief`)}
                className="appearance-none bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-300 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                title="Switch Briefing Target"
              >
                {allMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id === 'meeting-6' ? '⭐ ' : ''}{m.title.slice(0, 32)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Copy Brief Button */}
          <button
            onClick={copyBriefSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Copy formatted summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            title="Print dossier or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print</span>
          </button>

          {/* PRIMARY PROMINENT "WHY? VIEW MEMORY SOURCES" ACTION BUTTON */}
          <button
            onClick={() => openMemorySources('all')}
            id="btn-why-memory-sources"
            className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 hover:bg-pos-100 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 ring-1 ring-indigo-400/40 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>WHY? View Memory Sources</span>
            <span className="px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white/20 rounded-md text-white">
              {memorySources.length}
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* 2. DEDICATED ACTION TOOLBAR (View Contact, View Memory Timeline, View Commitments, Post-Meeting Notes) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Quick Actions & Dossier Links:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button: View Contact */}
          <Link
            to={contact ? `/contacts/${contact.id}` : '/contacts'}
            id="btn-view-contact"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<User className="w-3.5 h-3.5 text-indigo-400" />}
            >
              View Contact
            </Button>
          </Link>

          {/* Button: View Memory Timeline */}
          <Link
            to={`/timeline${contact ? `?contactId=${contact.id}` : ''}`}
            id="btn-view-timeline"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<History className="w-3.5 h-3.5 text-purple-400" />}
            >
              View Memory Timeline
            </Button>
          </Link>

          {/* Button: View Commitments */}
          <Link
            to={`/commitments${contact ? `?contactId=${contact.id}` : ''}`}
            id="btn-view-commitments"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ListTodo className="w-3.5 h-3.5 text-emerald-400" />}
            >
              View Commitments
            </Button>
          </Link>

          {/* Button: Post-Meeting Notes */}
          <Link
            to={`/meetings/${meeting.id}/post-meeting`}
            id="btn-post-meeting-notes"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Post-Meeting Notes
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. HERO BRIEFING DOSSIER CARD: Contact Name, Company, Meeting Date, Title, Previous Meeting Count */}
      <div className="p-6 md:p-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <img
              src={contact?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={contact?.name || 'Contact'}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/50"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {contact?.name || 'Rahul Sharma'}
                </h1>
                <Badge variant="primary" size="md">
                  {contact?.company || 'Acme Technologies'}
                </Badge>
                <Badge variant="success" size="md">
                  {brief.relationship.relationshipStatus}
                </Badge>
              </div>

              <p className="text-sm text-slate-300 font-medium">
                {contact?.title || 'VP of Engineering'} • {contact?.department || 'Platform Engineering'}
              </p>

              <div className="pt-2">
                <h2 className="text-base md:text-lg font-bold text-indigo-300 flex items-center gap-2">
                  <span>{meeting.title}</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {formattedDate} at {formattedTime}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {meeting.durationMinutes} Minutes Duration
                </span>
                <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800 text-indigo-300 font-semibold">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  {brief.relationship.previousMeetingsCount} Previous Meetings Grounding
                </span>
              </div>
            </div>
          </div>

          {/* Synthesis Stats Tile */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-left lg:text-right min-w-[240px] space-y-1">
            <span className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider font-bold block">
              Agent Synthesis Status
            </span>
            <span className="text-xs text-slate-200 font-mono block">
              Generated: {new Date(brief.generatedAt).toLocaleString()}
            </span>
            <div className="flex items-center lg:justify-end gap-2 pt-1 text-[11px] text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Grounding: {brief.relationship.previousMeetingsCount} Meetings & {memorySources.length} Memories</span>
            </div>
          </div>
        </div>

        {/* Memory Grounding Callout Banner with direct WHY? button */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/50 to-slate-950/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                <span>Verified Historical Memory Grounding</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  {memorySources.length} Sources Active
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Every statement, concern, and recommendation in this briefing is backed by recorded quotes and "Why It Matters" intelligence.
              </p>
            </div>
          </div>

          <button
            onClick={() => openMemorySources('all')}
            id="hero-btn-why-memory-sources"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-200" />
            <span>WHY? View Memory Sources</span>
          </button>
        </div>
      </div>

      {/* 4. RELATIONSHIP SUMMARY & DYNAMIC */}
      <Card
        title="RELATIONSHIP SUMMARY & CADENCE"
        subtitle={`${brief.relationship.previousMeetingsCount} completed historical meetings • Cadence: ${brief.relationship.cadence}`}
        icon={<Users className="w-4 h-4 text-indigo-400" />}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm">
              Status: {brief.relationship.relationshipStatus}
            </Badge>
            <button
              onClick={() => openMemorySources('relationship', 'mem-6')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40"
            >
              Why this posture? <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              Key Dynamic & Behavioral Posture
            </span>
            <span className="text-xs text-slate-400">
              5 Months Longitudinal Context
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {brief.relationship.keyDynamic}
          </p>
        </div>
      </Card>

      {/* 5. KEY CONTEXT: Open Commitments, Known Concerns, Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 5A: OPEN COMMITMENTS */}
        <Card
          title="Open Commitments"
          subtitle={`${brief.keyContext.openCommitments.length} pending commitments`}
          icon={<CheckSquare className="w-4 h-4 text-indigo-400" />}
          className="border-indigo-900/30"
          action={
            <Link
              to={`/commitments${contact ? `?contactId=${contact.id}` : ''}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              All Commitments <ChevronRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="space-y-3.5">
            {brief.keyContext.openCommitments.map((com) => (
              <div
                key={com.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={com.owner === 'you' ? 'primary' : 'warning'} size="sm">
                    {com.owner === 'you' ? 'Owner: You (Your Team)' : `Owner: ${com.ownerName}`}
                  </Badge>
                  <span className="text-[10px] text-amber-400/90 font-mono font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                    Due {com.dueDate}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                  {com.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {com.description}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-400 font-mono truncate max-w-[170px]">
                    From: {com.sourceMeetingTitle}
                  </span>
                  <button
                    onClick={() => openMemorySources('commitment', 'mem-2')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    View Source <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 5B: KNOWN CONCERNS */}
        <Card
          title="Known Concerns"
          subtitle="Stakeholder anxieties & objections"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          className="border-rose-950/30"
          action={
            <Badge variant="danger" size="sm">
              {brief.keyContext.knownConcerns.length} Tracked
            </Badge>
          }
        >
          <div className="space-y-3.5">
            {brief.keyContext.knownConcerns.map((con) => (
              <div
                key={con.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={con.severity === 'high' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {con.severity.toUpperCase()} SEVERITY
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Detected {con.detectedDate}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                  {con.topic}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {con.description}
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => openMemorySources('concern', con.id === 'concern-1' ? 'mem-1' : 'mem-3')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    Inspect Transcript & Why It Matters <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SECTION 5C: PREFERENCES */}
        <Card
          title="Observed Preferences"
          subtitle="Communication & decision-making style"
          icon={<Sliders className="w-4 h-4 text-sky-400" />}
          className="border-sky-950/30"
          action={
            <Badge variant="info" size="sm">
              {brief.keyContext.preferences.length} Learned
            </Badge>
          }
        >
          <div className="space-y-3.5">
            {brief.keyContext.preferences.map((pref) => (
              <div
                key={pref.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <Badge variant="info" size="sm">
                  {pref.category.toUpperCase()}
                </Badge>
                <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
                  {pref.text}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                  Grounding: {pref.context}
                </p>
                <div className="pt-0.5">
                  <button
                    onClick={() => openMemorySources('preference', pref.id === 'pref-1' ? 'mem-4' : 'mem-5')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    View Source Memory <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. RECOMMENDED QUESTIONS */}
      <Card
        title="RECOMMENDED STRATEGIC QUESTIONS"
        subtitle="AI-suggested questions grounded in historical commitments and known concerns"
        icon={<HelpCircle className="w-4 h-4 text-emerald-400" />}
        action={
          <Badge variant="success" size="sm">
            {brief.keyContext.recommendedQuestions.length} Formulated
          </Badge>
        }
      >
        <div className="space-y-3.5">
          {brief.keyContext.recommendedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Strategic Question
                </span>

                {q.linkedMemorySourceId && (
                  <button
                    onClick={() => openMemorySources('all', q.linkedMemorySourceId)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1.5 cursor-pointer bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-800/40"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                    Why ask this? View Memory Source <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <blockquote className="text-sm font-semibold text-white leading-relaxed pl-3 border-l-2 border-emerald-500/80">
                {q.question}
              </blockquote>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/70">
                <strong className="text-indigo-300 font-medium">Strategic Rationale: </strong>
                {q.rationale}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. RISKS AND STRATEGIC FOLLOW-UPS */}
      <Card
        title="RISKS & STRATEGIC FOLLOW-UPS"
        subtitle="Identified deal risks, technical roadblocks, and recommended mitigation actions"
        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.keyContext.risksAndFollowUps.map((rf) => (
            <div
              key={rf.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Badge variant={rf.type === 'risk' ? 'danger' : 'warning'} size="sm">
                  {rf.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-slate-400 font-mono">High Priority</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">{rf.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-rose-300/90 font-medium">Impact: </strong>
                {rf.impact}
              </p>
              <p className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-slate-300 font-semibold block text-[10px] uppercase mb-0.5">
                  Historical Signal:
                </strong>
                {rf.sourceSnippet}
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-emerald-200">Recommended Action: </strong>
                  {rf.suggestedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. NEXT STEPS & POST-MEETING TRANSITION ACTIONS (Bottom Action Footer) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Meeting Readiness Complete
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            All historical context, commitments, and strategic rationale loaded. Capture debrief notes or jump to related assets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={contact ? `/contacts/${contact.id}` : '/contacts'}
            id="btn-footer-view-contact"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<User className="w-3.5 h-3.5 text-indigo-400" />}
            >
              View Contact
            </Button>
          </Link>

          <Link
            to={`/timeline${contact ? `?contactId=${contact.id}` : ''}`}
            id="btn-footer-view-timeline"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<History className="w-3.5 h-3.5 text-purple-400" />}
            >
              View Memory Timeline
            </Button>
          </Link>

          <Link
            to={`/commitments${contact ? `?contactId=${contact.id}` : ''}`}
            id="btn-footer-view-commitments"
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ListTodo className="w-3.5 h-3.5 text-emerald-400" />}
            >
              View Commitments
            </Button>
          </Link>

          <Link
            to={`/meetings/${meeting.id}/post-meeting`}
            id="btn-footer-post-meeting-notes"
          >
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Post-Meeting Notes
            </Button>
          </Link>
        </div>
      </div>

      {/* 9. "WHY? VIEW MEMORY SOURCES" SLIDE-OVER SIDE PANEL / MODAL */}
      {isMemoryPanelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsMemoryPanelOpen(false)}
            aria-label="Close panel"
          />

          {/* Slide-over Drawer / Panel */}
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
            {/* Panel Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      Memory Provenance & Sources
                    </h3>
                    <Badge variant="primary" size="sm">
                      {memorySources.length} Grounded Sources
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exact quotes and "Why It Matters" intelligence backing this brief.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMemoryPanelOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close panel (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Category Filter Toolbar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search transcript quotes, keywords, or topics..."
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Tag Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['all', 'concern', 'commitment', 'preference', 'relationship'].map((tag) => {
                  const count =
                    tag === 'all'
                      ? memorySources.length
                      : memorySources.filter((m) => m.contextType === tag).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedMemoryTag(tag);
                        setActiveMemorySourceId(null);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedMemoryTag === tag
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Memory Items List */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {filteredMemories.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-sm">No memory sources match your current filter.</p>
                  <button
                    onClick={() => {
                      setSelectedMemoryTag('all');
                      setMemorySearchQuery('');
                    }}
                    className="text-xs text-indigo-400 mt-2 font-medium hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredMemories.map((mem) => {
                  const isHighlighted = activeMemorySourceId === mem.id;
                  return (
                    <div
                      key={mem.id}
                      id={`memory-source-${mem.id}`}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isHighlighted
                          ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/60 shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Source Meeting Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="primary" size="sm">
                            {mem.tag}
                          </Badge>
                          <span className="text-xs font-bold text-slate-100">
                            {mem.meetingTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                          <span>{mem.meetingDate}</span>
                          {mem.timestampInMeeting && (
                            <span className="text-slate-500">• {mem.timestampInMeeting}</span>
                          )}
                          <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                            {Math.round(mem.relevanceScore * 100)}% Match
                          </span>
                        </div>
                      </div>

                      {/* Exact Memory Excerpt */}
                      <blockquote className="p-3.5 rounded-xl bg-slate-900/90 border-l-4 border-indigo-500 text-xs md:text-sm text-slate-200 leading-relaxed italic">
                        "{mem.excerpt}"
                      </blockquote>

                      {/* CRUCIAL: "WHY IT MATTERS" INSIGHT BOX */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-indigo-950/30 border border-emerald-700/40 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WHY IT MATTERS:</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {mem.whyItMatters ||
                            "This historical signal directly guides today's agenda by highlighting critical stakeholder priorities and operational risks."}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">
                          Category: {mem.contextType.toUpperCase()}
                        </span>
                        <Link
                          to={`/timeline${contact ? `?contactId=${contact.id}` : ''}`}
                          onClick={() => setIsMemoryPanelOpen(false)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                          View in Timeline <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredMemories.length} of {memorySources.length} sources
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMemoryPanelOpen(false)}
              >
                Close Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingBriefPage;
