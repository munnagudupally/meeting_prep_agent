import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldAlert,
  Sliders,
  Building,
  Mail,
  Clock,
  CheckSquare,
  CheckCircle2,
  CalendarPlus,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import {
  getContact,
  getMeetingsByContact,
  updateCommitmentStatus
} from '../services';
import type { Contact, Meeting, Commitment } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';

export const ContactDetailsPage: React.FC = () => {
  const { id = 'contact-rahul-sharma' } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [c, mList] = await Promise.all([
        getContact(id),
        getMeetingsByContact(id)
      ]);
      setContact(c);
      setMeetings(mList);

      // Extract commitments for this contact
      const contactCommitments: Commitment[] = [];
      mList.forEach((m) => {
        if (m.commitments) {
          contactCommitments.push(...m.commitments);
        }
      });
      setCommitments(contactCommitments);
    } catch (err) {
      console.error('Failed to load contact details', err);
      setError('Unable to load contact profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleCommitment = async (commitmentId: string, currentStatus: Commitment['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'open' : 'completed';
    await updateCommitmentStatus(commitmentId, nextStatus);
    setCommitments((prev) =>
      prev.map((c) => (c.id === commitmentId ? { ...c, status: nextStatus } : c))
    );
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving stakeholder dossier and conversation history..." fullHeight />;
  }

  if (error) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{error}</h2>
        <Button variant="secondary" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Stakeholder Profile Not Found</h2>
        <p className="text-sm text-slate-400">The requested contact ID does not exist.</p>
        <Link to="/contacts">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Contacts
          </Button>
        </Link>
      </div>
    );
  }

  const isRahul = contact.id === 'contact-rahul-sharma';
  const openCommitments = commitments.filter((c) => c.status === 'open');

  return (
    <PageContainer>
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts Directory
        </Link>
      </div>

      {/* Main Stakeholder Header Card */}
      <Card className="border-indigo-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {contact.name}
                </h1>
                <Badge variant="primary">{contact.company}</Badge>
                <Badge
                  variant={
                    contact.relationshipHealth === 'strong'
                      ? 'success'
                      : contact.relationshipHealth === 'neutral'
                      ? 'info'
                      : 'danger'
                  }
                >
                  Health: {contact.relationshipHealth.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                {contact.title} • {contact.department}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> {contact.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> {contact.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> {contact.previousMeetingsCount} Historical Meetings
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isRahul && (
              <Link to="/meetings/meeting-6/brief">
                <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                  View Meeting Brief
                </Button>
              </Link>
            )}
            <Link to="/meetings/new">
              <Button variant="secondary" size="sm" leftIcon={<CalendarPlus className="w-4 h-4" />}>
                Schedule Meeting
              </Button>
            </Link>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-300 leading-relaxed mt-4 pt-4 border-t border-slate-800">
          {contact.bio}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              #{tag}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Relationship Summary & Strategic Context */}
      <Card
        title="Relationship Summary & Dynamic"
        subtitle={`Cadence: Bi-weekly syncs over 5 months • Total Meetings: ${contact.previousMeetingsCount}`}
        icon={<TrendingUp className="w-4 h-4 text-indigo-400" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold block">
              Meeting Frequency & Cadence
            </span>
            <p className="text-xs font-bold text-white">{contact.previousMeetingsCount} Synced Sessions</p>
            <p className="text-[11px] text-slate-400">
              Active cadence across 5 months; next sync planned for{' '}
              {contact.nextMeetingDate ? new Date(contact.nextMeetingDate).toLocaleDateString() : 'TBD'}.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">
              Relationship Posture
            </span>
            <p className="text-xs font-bold text-white">Strategic Partner (High Trust)</p>
            <p className="text-[11px] text-slate-400">
              Technical decision maker. Values reproducible telemetry, terminal benchmarks, and clear SLAs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold block">
              Action Items Outstanding
            </span>
            <p className="text-xs font-bold text-white">{openCommitments.length} Open Deliverables</p>
            <p className="text-[11px] text-slate-400">
              Requires review at start of every meeting per observed preference.
            </p>
          </div>
        </div>
      </Card>

      {/* Preferences & Concerns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Preferences */}
        <Card
          title="Observed Contact Preferences"
          subtitle="Extracted from historical conversation dynamics"
          icon={<Sliders className="w-4 h-4 text-sky-400" />}
        >
          {contact.preferences.length === 0 ? (
            <p className="text-xs text-slate-400">No explicit preferences recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {contact.preferences.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="info" size="sm">
                      {p.category.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{p.text}</h4>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    Context: {p.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Known Concerns */}
        <Card
          title="Known Concerns & Objections"
          subtitle="Active watchpoints that require preemptive mitigation"
          icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
        >
          {contact.knownConcerns.length === 0 ? (
            <p className="text-xs text-slate-400">No active concerns detected.</p>
          ) : (
            <div className="space-y-3">
              {contact.knownConcerns.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={c.severity === 'high' ? 'danger' : c.severity === 'medium' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {c.severity.toUpperCase()} SEVERITY
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Detected: {c.detectedDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{c.topic}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Commitments Section */}
      <Card
        title={`Commitments & Deliverables (${commitments.length})`}
        subtitle={`${openCommitments.length} open action items • Click checkmark to toggle status`}
        icon={<CheckSquare className="w-4 h-4 text-amber-400" />}
        action={
          <Link to="/commitments">
            <Button variant="ghost" size="xs">
              View All Commitments
            </Button>
          </Link>
        }
      >
        {commitments.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-6 h-6 text-slate-500" />}
            title="No Commitments Logged"
            description="Commitments agreed in meetings with this stakeholder will appear here."
          />
        ) : (
          <div className="space-y-2.5">
            {commitments.map((com) => {
              const isOpen = com.status === 'open';
              return (
                <div
                  key={com.id}
                  className={`p-3.5 rounded-xl bg-slate-950/50 border transition-all flex items-start justify-between gap-4 ${
                    isOpen ? 'border-slate-800 hover:border-slate-700' : 'border-slate-850 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleCommitment(com.id, com.status)}
                      className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      {com.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-600 hover:border-indigo-400" />
                      )}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={com.owner === 'you' ? 'primary' : 'warning'} size="sm">
                          {com.owner === 'you' ? 'You (Your Team)' : `Owner: ${com.ownerName}`}
                        </Badge>
                        <Badge variant={com.status === 'completed' ? 'success' : 'outline'} size="sm">
                          {com.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400">Due: {com.dueDate}</span>
                      </div>
                      <h4
                        className={`text-xs md:text-sm font-semibold ${
                          com.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {com.title}
                      </h4>
                      {com.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">{com.description}</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                        Origin: {com.sourceMeetingTitle} ({com.sourceMeetingDate})
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleToggleCommitment(com.id, com.status)}
                  >
                    {com.status === 'completed' ? 'Reopen' : 'Complete'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Meetings Section */}
      <Card
        title={`Meeting History with ${contact.name} (${meetings.length})`}
        subtitle="Chronological log of past sessions, discussions, and decisions"
        icon={<Calendar className="w-4 h-4 text-indigo-400" />}
        action={
          <Link to="/meetings/new">
            <Button variant="secondary" size="xs" leftIcon={<CalendarPlus className="w-3 h-3" />}>
              Schedule New Sync
            </Button>
          </Link>
        }
      >
        {meetings.length === 0 ? (
          <EmptyState
            title="No Meetings Logged"
            description="Meetings held with this stakeholder will appear here."
          />
        ) : (
          <div className="space-y-3.5">
            {meetings.map((m, idx) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Sync #{meetings.length - idx}
                    </span>
                    <Badge variant={m.status === 'upcoming' ? 'primary' : 'success'} size="sm">
                      {m.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(m.scheduledAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })} • {m.durationMinutes} min
                    </span>
                    <Badge variant="outline" size="sm">
                      {m.meetingType}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {m.summary || m.agenda.join(' • ')}
                  </p>

                  {m.decisions && m.decisions.length > 0 && (
                    <div className="text-xs text-emerald-400 pt-0.5">
                      <strong>Consensus: </strong> {m.decisions[0]}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/meetings/${m.id}/brief`}>
                    <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                      Brief
                    </Button>
                  </Link>
                  <Link to={`/meetings/${m.id}/post-meeting`}>
                    <Button variant="outline" size="sm" leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}>
                      Debrief
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
