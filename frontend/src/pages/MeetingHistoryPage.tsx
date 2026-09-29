import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Plus,
  Clock,
  FileCheck2,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Filter,
  CheckCircle2,
  ChevronRight,
  User
} from 'lucide-react';
import {
  getAllMeetings,
  getContacts,
  prepareMeeting
} from '../services';
import type { Meeting, Contact } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';

export const MeetingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');
  const [preparingMeetingId, setPreparingMeetingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mList, cList] = await Promise.all([
        getAllMeetings(),
        getContacts()
      ]);
      setMeetings(mList);
      setContacts(cList);
    } catch (err) {
      console.error('Failed to load meeting history', err);
      setError('Unable to load meeting history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrepareMeeting = async (meetingId: string) => {
    try {
      setPreparingMeetingId(meetingId);
      await prepareMeeting(meetingId);
      navigate(`/meetings/${meetingId}/brief`);
    } catch (err) {
      console.error('Failed to prepare meeting brief', err);
      alert('Error preparing meeting brief.');
    } finally {
      setPreparingMeetingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading chronological meeting ledger and commitments..." fullHeight />;
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

  // Filter logic
  const filteredMeetings = meetings.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (contactFilter !== 'all' && m.contactId !== contactFilter) return false;
    return true;
  });

  return (
    <PageContainer
      title={
        <span className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-400" />
          Meeting History & Logs
        </span>
      }
      subtitle="Chronological record of stakeholder discussions, decisions, open commitments, and AI briefings."
      badge={<Badge variant="primary">{meetings.length} Total Sessions</Badge>}
      actions={
        <Link to="/meetings/new">
          <Button variant="gradient" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Schedule New Meeting
          </Button>
        </Link>
      }
    >
      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Status Tabs */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            {(['all', 'upcoming', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Stakeholder Dropdown */}
          <select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Stakeholders ({contacts.length})</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredMeetings.length} of {meetings.length} meetings
        </span>
      </div>

      {/* Meeting Cards List */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6 text-slate-500" />}
          title="No Meetings Matched"
          description="There are no meetings matching the selected filters. Change filter or schedule a new sync."
          actionText="Schedule New Meeting"
          onAction={() => navigate('/meetings/new')}
        />
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const meetingContact = contacts.find((c) => c.id === meeting.contactId);
            const isUpcoming = meeting.status === 'upcoming';
            const commitments = meeting.commitments || [];
            const decisions = meeting.decisions || [];

            return (
              <Card
                key={meeting.id}
                className={`transition-all ${
                  isUpcoming
                    ? 'border-indigo-500/50 bg-slate-900/90 shadow-md ring-1 ring-indigo-500/20'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Status, Date, Duration, Stakeholder */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Badge variant={isUpcoming ? 'primary' : 'success'}>
                        {meeting.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        • {meeting.durationMinutes} min
                      </span>
                      <Badge variant="outline" size="sm">
                        {meeting.meetingType}
                      </Badge>
                    </div>

                    {meetingContact && (
                      <Link
                        to={`/contacts/${meetingContact.id}`}
                        className="flex items-center gap-2 text-xs text-slate-300 hover:text-indigo-400 transition-colors group"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold">{meetingContact.name}</span>
                        <span className="text-slate-400 font-normal">({meetingContact.company})</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {/* Title and Summary */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {meeting.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      {meeting.summary || meeting.agenda.join(' • ')}
                    </p>
                  </div>

                  {/* Agenda Topics */}
                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                        Agenda Topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {meeting.agenda.map((topic, i) => (
                          <span
                            key={i}
                            className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                          >
                            • {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decisions Made (if any) */}
                  {decisions.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Decisions & Consensus Logged:
                      </span>
                      <ul className="text-xs text-slate-200 space-y-1">
                        {decisions.map((dec, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Commitments Associated with this Meeting */}
                  {commitments.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                      <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" /> Commitments Generated ({commitments.length}):
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {commitments.map((com) => (
                          <div
                            key={com.id}
                            className="p-2 rounded bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={com.owner === 'you' ? 'primary' : 'warning'}
                                size="sm"
                              >
                                {com.owner === 'you' ? 'You' : com.ownerName}
                              </Badge>
                              <Badge
                                variant={com.status === 'completed' ? 'success' : 'outline'}
                                size="sm"
                              >
                                {com.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-slate-200 font-medium line-clamp-1">{com.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Due: {com.dueDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Notes */}
                  {meeting.notes && (
                    <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded border border-slate-800">
                      <strong className="text-slate-300 not-italic">Notes: </strong> {meeting.notes}
                    </div>
                  )}

                  {/* Action Bar with Prepare Meeting Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-400 font-mono">
                      Meeting ID: <code className="text-indigo-400">{meeting.id}</code>
                    </span>

                    <div className="flex items-center gap-2.5">
                      {/* Prepare Meeting Button: calls prepareMeeting(meetingId) and navigates */}
                      <Button
                        variant="gradient"
                        size="sm"
                        isLoading={preparingMeetingId === meeting.id}
                        onClick={() => handlePrepareMeeting(meeting.id)}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        {isUpcoming ? 'Prepare Meeting Brief' : 'Open Meeting Brief'}
                      </Button>

                      {/* Post-Meeting Debrief */}
                      <Link to={`/meetings/${meeting.id}/post-meeting`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
                        >
                          Post-Meeting
                        </Button>
                      </Link>

                      {meetingContact && (
                        <Link to={`/contacts/${meetingContact.id}`}>
                          <Button variant="ghost" size="sm">
                            Stakeholder
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
