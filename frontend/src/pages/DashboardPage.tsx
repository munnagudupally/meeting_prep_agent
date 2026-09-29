import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Calendar,
  CalendarPlus,
  CheckSquare,
  ArrowRight,
  Clock,
  ShieldAlert,
  Brain,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import {
  getContacts,
  getAllMeetings,
  getAllCommitments,
  updateCommitmentStatus
} from '../services';
import type { Contact, Meeting, Commitment } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cList, mList, comList] = await Promise.all([
        getContacts(),
        getAllMeetings(),
        getAllCommitments()
      ]);
      setContacts(cList);
      setMeetings(mList);
      setCommitments(comList);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError(err instanceof Error ? err.message : 'Unable to load dashboard intelligence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleCommitment = async (commitmentId: string, currentStatus: Commitment['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'open' : 'completed';
    await updateCommitmentStatus(commitmentId, nextStatus);
    setCommitments((prev) =>
      prev.map((c) => (c.id === commitmentId ? { ...c, status: nextStatus } : c))
    );
  };

  if (loading) {
    return <LoadingSpinner message="Assembling stakeholder intelligence and cross-meeting memory..." fullHeight />;
  }

  if (error) {
    return (
      <div className="py-12 max-w-2xl mx-auto space-y-4">
        <ApiErrorBanner error={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  const primaryContact = contacts.find((c) => c.id === 'contact-rahul-sharma') || contacts[0];
  const upcomingMeetings = meetings.filter((m) => m.status === 'upcoming');
  const recentCompletedMeetings = meetings
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  const openCommitments = commitments.filter((c) => c.status === 'open');

  return (
    <PageContainer>
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/50 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hindsight Meeting Prep Agent • Active Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Pre-Meeting Intelligence Dashboard
            </h1>
            <p className="text-sm md:text-base text-slate-300">
              Grounded briefings for stakeholder syncs synthesizing previous meetings, open deliverables, known concerns, and decisions.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/meetings/meeting-6/brief">
              <Button variant="gradient" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                Launch Rahul's Brief
              </Button>
            </Link>
            <Link to="/meetings/new">
              <Button variant="secondary" size="md" leftIcon={<CalendarPlus className="w-4 h-4" />}>
                Create Meeting
              </Button>
            </Link>
            <Link to="/contacts">
              <Button variant="outline" size="md" leftIcon={<Users className="w-4 h-4" />}>
                View Contacts
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stakeholders</p>
              <p className="text-2xl font-bold text-white mt-1">{contacts.length}</p>
              <Link to="/contacts" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Acme Technologies tracked
              </Link>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Meetings</p>
              <p className="text-2xl font-bold text-white mt-1">{meetings.length}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {recentCompletedMeetings.length} completed historical
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Commitments</p>
              <p className="text-2xl font-bold text-white mt-1">{openCommitments.length}</p>
              <Link to="/commitments" className="text-xs text-amber-400 hover:text-amber-300 mt-1 flex items-center gap-1">
                <CheckSquare className="w-3 h-3" /> View ledger
              </Link>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Concerns</p>
              <p className="text-2xl font-bold text-white mt-1">{primaryContact?.knownConcerns.length || 0}</p>
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> p99 latency & budget ROI
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Primary Grid Layout: Left (Upcoming & Recent Meetings), Right (Primary Demo Stakeholder & Open Commitments) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meetings Section (Upcoming & Recent) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Meetings */}
          <Card
            title="Upcoming Meetings"
            subtitle={`${upcomingMeetings.length} sessions scheduled with pending briefings`}
            icon={<Calendar className="w-4 h-4" />}
            action={
              <Link to="/meetings/new">
                <Button variant="secondary" size="xs" leftIcon={<CalendarPlus className="w-3 h-3" />}>
                  Schedule Sync
                </Button>
              </Link>
            }
          >
            {upcomingMeetings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-6 h-6 text-slate-500" />}
                title="No Upcoming Meetings"
                description="Schedule your next stakeholder discussion to generate a contextual AI briefing."
                actionText="Schedule Meeting"
                onAction={() => window.location.assign('/meetings/new')}
              />
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((m) => {
                  const meetingContact = contacts.find((c) => c.id === m.contactId);
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-indigo-900/40 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="primary" size="sm">
                            Upcoming
                          </Badge>
                          <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {new Date(m.scheduledAt).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} • {m.durationMinutes} min
                          </span>
                          <Badge variant="outline" size="sm">
                            {m.meetingType}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                        <p className="text-xs text-slate-400">
                          Stakeholder:{' '}
                          <span className="text-slate-200 font-medium">
                            {meetingContact ? `${meetingContact.name} (${meetingContact.company})` : 'Unknown'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={`/meetings/${m.id}/brief`}>
                          <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                            View Brief
                          </Button>
                        </Link>
                        <Link to={`/meetings/${m.id}/post-meeting`}>
                          <Button variant="outline" size="sm">
                            Post-Meeting
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Completed Meetings */}
          <Card
            title="Recent Meetings"
            subtitle="Previous stakeholder discussions and logged decisions"
            icon={<Clock className="w-4 h-4" />}
            action={
              <Link to="/meetings">
                <Button variant="ghost" size="xs" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  All History
                </Button>
              </Link>
            }
          >
            {recentCompletedMeetings.length === 0 ? (
              <EmptyState
                title="No Completed Meetings Yet"
                description="Completed meetings with discussion notes and decisions will appear here."
              />
            ) : (
              <div className="space-y-3">
                {recentCompletedMeetings.slice(0, 3).map((m, idx) => {
                  return (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-indigo-400">
                            Sync #{recentCompletedMeetings.length - idx}
                          </span>
                          <Badge variant="success" size="sm">
                            Completed
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(m.scheduledAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/meetings/${m.id}/brief`}>
                            <Button variant="ghost" size="xs" leftIcon={<Sparkles className="w-3 h-3 text-indigo-400" />}>
                              Brief
                            </Button>
                          </Link>
                          <Link to={`/meetings/${m.id}/post-meeting`}>
                            <Button variant="ghost" size="xs">
                              Debrief
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {m.summary}
                      </p>

                      {m.decisions && m.decisions.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 text-xs">
                          <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block mb-1">
                            Key Consensus:
                          </span>
                          <p className="text-slate-200 line-clamp-1">✓ {m.decisions[0]}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Featured Demo Target & Open Commitments */}
        <div className="space-y-6">
          {/* Primary Stakeholder Card */}
          <Card
            title={
              <span className="flex items-center gap-2">
                <span>Featured Stakeholder</span>
                <Badge variant="primary" size="sm">Primary</Badge>
              </span>
            }
            subtitle="Rahul Sharma • VP of Engineering at Acme"
            icon={<Brain className="w-4 h-4" />}
            action={
              <Link to="/contacts/contact-rahul-sharma">
                <Button variant="ghost" size="xs" rightIcon={<ExternalLink className="w-3 h-3" />}>
                  Profile
                </Button>
              </Link>
            }
          >
            {primaryContact && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <img
                    src={primaryContact.avatarUrl}
                    alt={primaryContact.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{primaryContact.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{primaryContact.title}</p>
                    <p className="text-xs text-indigo-400 font-medium truncate">{primaryContact.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Meetings</span>
                    <span className="font-bold text-white">{primaryContact.previousMeetingsCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Open Items</span>
                    <span className="font-bold text-amber-400">{primaryContact.openCommitmentsCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold block">
                    Observed Dynamic:
                  </span>
                  <p className="text-slate-300 leading-relaxed line-clamp-2">
                    Values concise bullet summaries over slides. Begins syncs by reviewing open action items.
                  </p>
                </div>

                <Link to="/meetings/meeting-6/brief" className="block">
                  <Button variant="gradient" size="sm" className="w-full" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                    Open Meeting Briefing
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Open Commitments Widget */}
          <Card
            title="Open Commitments"
            subtitle={`${openCommitments.length} pending action items`}
            icon={<CheckSquare className="w-4 h-4 text-amber-400" />}
            action={
              <Link to="/commitments">
                <Button variant="ghost" size="xs">
                  Full Ledger
                </Button>
              </Link>
            }
          >
            {openCommitments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No open commitments.</p>
            ) : (
              <div className="space-y-2.5">
                {openCommitments.slice(0, 4).map((com) => (
                  <div
                    key={com.id}
                    className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={com.owner === 'you' ? 'primary' : 'warning'} size="sm">
                        {com.owner === 'you' ? 'You' : 'Rahul'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">Due {com.dueDate}</span>
                    </div>
                    <p className="text-slate-200 font-medium leading-snug line-clamp-2">{com.title}</p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {com.sourceMeetingTitle}
                      </span>
                      <button
                        onClick={() => handleToggleCommitment(com.id, com.status)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
