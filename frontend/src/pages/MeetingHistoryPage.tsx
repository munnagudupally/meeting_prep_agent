import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Plus,
  Clock,
  FileCheck2,
  RefreshCw,
  ChevronRight,
  Search,
  MapPin,
  Users
} from 'lucide-react';
import { getAllMeetings, prepareMeeting } from '../services';
import type { Meeting } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';

function formatDisplayDate(val: any): string {
  if (!val) return 'Date not specified';
  if (val && typeof val === 'object' && ('_seconds' in val || 'seconds' in val)) {
    const secs = val._seconds || val.seconds;
    return new Date(secs * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  const d = new Date(val);
  return isNaN(d.getTime())
    ? String(val)
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
}

export const MeetingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as any) || 'all';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [preparingMeetingId, setPreparingMeetingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const mList = await getAllMeetings();
      setMeetings(mList);
    } catch (err: unknown) {
      console.error('Failed to load meetings', err);
      setError(err instanceof Error ? err.message : 'Unable to load meetings list.');
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
    } catch (err: unknown) {
      console.error('Failed to prepare meeting brief', err);
      alert(err instanceof Error ? err.message : 'Error preparing meeting brief.');
    } finally {
      setPreparingMeetingId(null);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return <LoadingSpinner message="Loading chronological meeting ledger from Firestore..." fullHeight />;
  }

  if (error) {
    return (
      <PageContainer>
        <div className="py-12 max-w-xl mx-auto space-y-4">
          <ApiErrorBanner error={error} onRetry={loadData} />
        </div>
      </PageContainer>
    );
  }

  // Filter logic
  const filteredMeetings = meetings.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = m.title.toLowerCase().includes(q);
      const descMatch = (m.description || '').toLowerCase().includes(q);
      const attendeeMatch = (m.attendees || []).some((a) =>
        a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      );
      if (!titleMatch && !descMatch && !attendeeMatch) return false;
    }
    return true;
  });

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Firestore Meeting Ledger</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meetings Directory</h1>
            <p className="text-xs text-slate-400">
              Chronological ledger of stakeholder syncs, preparation briefs, and post-meeting records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>

            <Link to="/meetings/new">
              <Button
                variant="gradient"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Schedule Meeting
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title, description, or attendee name..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800/80 shrink-0">
            {['all', 'upcoming', 'in_progress', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleStatusFilterChange(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <Card className="p-12 text-center">
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-slate-500" />}
              title={
                searchQuery || statusFilter !== 'all'
                  ? 'No matching meetings found'
                  : 'No meetings scheduled yet'
              }
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Schedule your first meeting to generate contextual AI briefs and record memories.'
              }
              actionText={
                searchQuery || statusFilter !== 'all' ? 'Clear Filters' : 'Schedule New Meeting'
              }
              onAction={
                searchQuery || statusFilter !== 'all'
                  ? () => {
                      setSearchQuery('');
                      handleStatusFilterChange('all');
                    }
                  : () => navigate('/meetings/new')
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((m) => {
              const prepStatus = m.prepStatus || (m.prepBriefId ? 'ready' : 'pending');
              const isPreparing = preparingMeetingId === m.id;

              return (
                <Card
                  key={m.id}
                  className="p-5 hover:border-slate-700 transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Meeting Details */}
                    <div className="space-y-2 flex-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            m.status === 'completed'
                              ? 'emerald'
                              : m.status === 'cancelled'
                              ? 'rose'
                              : 'indigo'
                          }
                          size="sm"
                        >
                          {m.status.toUpperCase()}
                        </Badge>

                        <Badge
                          variant={
                            prepStatus === 'ready'
                              ? 'purple'
                              : prepStatus === 'generating'
                              ? 'amber'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {prepStatus === 'ready'
                            ? 'Brief Ready'
                            : prepStatus === 'generating'
                            ? 'Generating...'
                            : 'Brief Pending'}
                        </Badge>

                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {formatDisplayDate(m.startTime || m.scheduledAt)}
                        </span>
                      </div>

                      <div>
                        <Link
                          to={`/meetings/${m.id}`}
                          className="text-base font-bold text-white hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{m.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {m.description && (
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>

                      {/* Attendees and Location info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        {m.attendees && m.attendees.length > 0 && (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {m.attendees.map((a) => a.name).join(', ')}
                          </span>
                        )}

                        {m.location && (
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-xs">{m.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <Button
                        variant="gradient"
                        size="xs"
                        onClick={() => handlePrepareMeeting(m.id)}
                        disabled={isPreparing}
                        leftIcon={<Sparkles className={`w-3.5 h-3.5 ${isPreparing ? 'animate-spin' : ''}`} />}
                      >
                        {isPreparing ? 'Generating...' : prepStatus === 'ready' ? 'View Brief' : 'Generate Brief'}
                      </Button>

                      <Link to={`/meetings/${m.id}/post-meeting`}>
                        <Button
                          variant="secondary"
                          size="xs"
                          leftIcon={<FileCheck2 className="w-3.5 h-3.5" />}
                        >
                          Post-Meeting
                        </Button>
                      </Link>

                      <Link to={`/meetings/${m.id}`}>
                        <Button variant="outline" size="xs">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
