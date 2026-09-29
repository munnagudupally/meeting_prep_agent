import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  Calendar,
  BrainCircuit,
  ExternalLink,
  Lightbulb,
  Sparkles,
  FileText,
  ListTodo,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Save,
  ArrowLeft
} from 'lucide-react';
import {
  getMeeting,
  getPrepBrief,
  prepareMeeting,
  updateBriefNotes
} from '../services';
import type { Meeting, MeetingBrief } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';
import { PageContainer } from '../components/layout/PageContainer';

function formatDisplayDate(val: any): string {
  if (!val) return 'Date not specified';
  if (val && typeof val === 'object' && ('_seconds' in val || 'seconds' in val)) {
    const secs = val._seconds || val.seconds;
    return new Date(secs * 1000).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short'
    });
  }
  const d = new Date(val);
  return isNaN(d.getTime())
    ? String(val)
    : d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
}

export const MeetingBriefPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [brief, setBrief] = useState<MeetingBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [m, b] = await Promise.all([
        getMeeting(id),
        getPrepBrief(id)
      ]);

      setMeeting(m);
      setBrief(b);
      if (b?.customNotes) {
        setCustomNotes(b.customNotes);
      }
    } catch (err: unknown) {
      console.error('Failed to load meeting brief', err);
      setError(err instanceof Error ? err.message : 'Failed to load brief data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGenerateBrief = async () => {
    if (!id) return;
    try {
      setGenerating(true);
      setError(null);
      const newBrief = await prepareMeeting(id);
      setBrief(newBrief);
      if (newBrief.customNotes) setCustomNotes(newBrief.customNotes);
      const updatedMeeting = await getMeeting(id);
      if (updatedMeeting) setMeeting(updatedMeeting);
    } catch (err: unknown) {
      console.error('Failed to generate brief', err);
      setError(err instanceof Error ? err.message : 'Brief generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      setSavingNotes(true);
      const updated = await updateBriefNotes(id, customNotes);
      setBrief(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err: unknown) {
      console.error('Failed to save notes', err);
      alert(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCopyBrief = () => {
    if (!brief || !meeting) return;
    const text = `EXECUTIVE MEETING BRIEF
=====================================================
MEETING: ${meeting.title}
DATE: ${formatDisplayDate(meeting.startTime || meeting.scheduledAt)}
SUMMARY:
${brief.summary}

OBJECTIVES:
${(brief.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n')}

KEY TALKING POINTS:
${(brief.keyTalkingPoints || []).map((p) => `• ${p}`).join('\n')}

RECOMMENDED QUESTIONS:
${(brief.recommendedQuestions || []).map((q: any) => `• ${typeof q === 'string' ? q : q.question}`).join('\n')}

POTENTIAL RISKS:
${(brief.potentialRisks || []).map((r) => `• ${r}`).join('\n')}

CUSTOM NOTES:
${customNotes || 'None'}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return <LoadingSpinner message="Synthesizing cross-meeting intelligence and briefing notes..." fullHeight />;
  }

  if (error && !meeting) {
    return (
      <PageContainer>
        <div className="py-12 max-w-xl mx-auto space-y-4">
          <ApiErrorBanner error={error} onRetry={loadData} />
          <div className="text-center">
            <Link to="/meetings">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Meetings
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumbs & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/meetings" className="hover:text-slate-200 transition-colors">
              Meetings
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/meetings/${id}`} className="hover:text-slate-200 transition-colors truncate max-w-xs">
              {meeting?.title || 'Meeting Details'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-400 font-semibold">Executive Brief</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyBrief}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied to Clipboard' : 'Copy Brief'}
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print
            </Button>

            <Link to={`/meetings/${id}/post-meeting`}>
              <Button variant="secondary" size="xs" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                Post-Meeting Debrief
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/50 p-6 md:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hindsight Autonomous Briefing Engine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {meeting?.title || 'Meeting Prep Brief'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {formatDisplayDate(meeting?.startTime || meeting?.scheduledAt)}
                </span>
                {meeting?.location && (
                  <span className="text-slate-400">
                    Location: <span className="text-slate-200">{meeting.location}</span>
                  </span>
                )}
                <Badge variant={brief ? 'purple' : 'amber'}>
                  {brief ? 'AI Synthesized' : 'Briefing Pending'}
                </Badge>
              </div>
            </div>

            {/* Regenerate Action */}
            <div className="shrink-0">
              <Button
                variant="gradient"
                size="md"
                onClick={handleGenerateBrief}
                disabled={generating}
                leftIcon={<RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />}
              >
                {generating ? 'Synthesizing...' : brief ? 'Regenerate Brief' : 'Generate Brief'}
              </Button>
            </div>
          </div>
        </div>

        {/* If No Brief Generated Yet */}
        {!brief ? (
          <Card className="p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">No briefing generated yet</h3>
              <p className="text-xs text-slate-400">
                Click below to synthesize meeting goals, attendee profiles, past Hindsight relationship memories, and recommended strategies.
              </p>
            </div>
            <Button
              variant="gradient"
              size="md"
              onClick={handleGenerateBrief}
              disabled={generating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {generating ? 'Generating AI Brief...' : 'Generate Brief Now'}
            </Button>
          </Card>
        ) : (
          /* Brief Content View */
          <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="p-6 space-y-3 border-indigo-900/40 bg-indigo-950/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                <FileText className="w-4 h-4" />
                <span>Executive Summary</span>
              </div>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed font-normal">
                {brief.summary}
              </p>
            </Card>

            {/* 2-Column Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Objectives */}
              {brief.objectives && brief.objectives.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-indigo-400" />
                    <span>Meeting Objectives</span>
                  </h2>
                  <ul className="space-y-2.5">
                    {brief.objectives.map((obj, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-slate-200 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Key Talking Points */}
              {brief.keyTalkingPoints && brief.keyTalkingPoints.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Key Talking Points</span>
                  </h2>
                  <ul className="space-y-2.5">
                    {brief.keyTalkingPoints.map((point, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-slate-200 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Attendee Profiles */}
            {brief.attendeeProfiles && brief.attendeeProfiles.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Synthesized Stakeholder Profiles ({brief.attendeeProfiles.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brief.attendeeProfiles.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{att.name}</p>
                          <p className="text-xs text-indigo-400">
                            {att.role} • {att.company}
                          </p>
                        </div>
                        {att.linkedinUrl && (
                          <a
                            href={att.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            title="LinkedIn Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {att.background && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {att.background}
                        </p>
                      )}

                      {att.pastInteractionsSummary && (
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">History: </span>
                          {att.pastInteractionsSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommended Questions & Potential Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High-Impact Questions */}
              {brief.recommendedQuestions && brief.recommendedQuestions.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Recommended High-Impact Questions</span>
                  </h2>
                  <div className="space-y-3">
                    {brief.recommendedQuestions.map((q: any, idx: number) => {
                      const text = typeof q === 'string' ? q : q.question;
                      const rationale = typeof q === 'object' ? q.rationale : null;
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                          <p className="text-xs md:text-sm font-semibold text-slate-100">"{text}"</p>
                          {rationale && (
                            <p className="text-[11px] text-slate-400">Why: {rationale}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Potential Risks & Blind Spots */}
              {brief.potentialRisks && brief.potentialRisks.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Potential Risks & Blind Spots</span>
                  </h2>
                  <div className="space-y-3">
                    {brief.potentialRisks.map((risk, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{risk}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Hindsight Relationship Insights */}
            <Card className="p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Hindsight Cross-Meeting Memory Insights</span>
              </h2>
              {brief.hindsightInsights && brief.hindsightInsights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brief.hindsightInsights.map((ins, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-900/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="indigo" size="sm">{ins.topic}</Badge>
                        <span className="text-[10px] text-slate-400">{ins.relevance}</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 whitespace-pre-line">{ins.insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  No historical memories found for this stakeholder.
                </div>
              )}
            </Card>

            {/* Custom Private Notes Editor */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Custom Preparation Notes</span>
                </h2>
                {notesSaved && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Notes Saved
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add your own private strategy notes, reminders, or concessions for this meeting..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {savingNotes ? 'Saving...' : 'Save Private Notes'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
