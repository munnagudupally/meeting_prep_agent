import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  FileCheck2,
  Trash2,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Mail
} from 'lucide-react';
import { getMeeting, deleteMeeting, updateMeeting, prepareMeeting } from '../services';
import type { Meeting } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PageContainer } from '../components/layout/PageContainer';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';

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

export const MeetingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick edit status modal or inline state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchMeeting = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMeeting(id);
      if (!data) {
        setError('Meeting not found or you do not have permission to view it.');
      } else {
        setMeeting(data);
      }
    } catch (err: unknown) {
      console.error('Failed to load meeting details', err);
      setError(err instanceof Error ? err.message : 'Unable to load meeting details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const handleGenerateBrief = async () => {
    if (!meeting) return;
    try {
      setGeneratingBrief(true);
      await prepareMeeting(meeting.id);
      navigate(`/meetings/${meeting.id}/brief`);
    } catch (err: unknown) {
      console.error('Failed to generate brief', err);
      alert(err instanceof Error ? err.message : 'Brief generation failed');
    } finally {
      setGeneratingBrief(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    if (window.confirm(`Are you sure you want to delete "${meeting.title}"? This cannot be undone.`)) {
      try {
        setDeleting(true);
        await deleteMeeting(meeting.id);
        navigate('/meetings', { replace: true });
      } catch (err: unknown) {
        console.error('Failed to delete meeting', err);
        alert(err instanceof Error ? err.message : 'Failed to delete meeting');
        setDeleting(false);
      }
    }
  };

  const handleStatusChange = async (newStatus: Meeting['status']) => {
    if (!meeting) return;
    try {
      setUpdatingStatus(true);
      const updated = await updateMeeting(meeting.id, { status: newStatus });
      setMeeting(updated);
    } catch (err: unknown) {
      console.error('Failed to update status', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Fetching meeting metadata and attendees from Firestore..." fullHeight />;
  }

  if (error || !meeting) {
    return (
      <PageContainer>
        <div className="py-12 max-w-xl mx-auto space-y-4">
          <ApiErrorBanner error={error || 'Meeting not found'} onRetry={fetchMeeting} />
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

  const prepStatus = meeting.prepStatus || (meeting.prepBriefId ? 'ready' : 'pending');

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/meetings" className="hover:text-slate-200 transition-colors">
            Meetings
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-indigo-400 truncate max-w-xs">{meeting.title}</span>
        </div>

        {/* Hero Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    meeting.status === 'completed'
                      ? 'emerald'
                      : meeting.status === 'cancelled'
                      ? 'rose'
                      : 'indigo'
                  }
                >
                  {meeting.status.toUpperCase()}
                </Badge>

                <Badge
                  variant={
                    prepStatus === 'ready'
                      ? 'purple'
                      : prepStatus === 'generating'
                      ? 'amber'
                      : 'slate'
                  }
                >
                  {prepStatus === 'ready'
                    ? 'AI Brief Ready'
                    : prepStatus === 'generating'
                    ? 'Generating Brief...'
                    : 'Prep Brief Pending'}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {meeting.title}
              </h1>

              {meeting.description && (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {meeting.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="gradient"
                size="sm"
                onClick={handleGenerateBrief}
                disabled={generatingBrief}
                leftIcon={<Sparkles className={`w-4 h-4 ${generatingBrief ? 'animate-spin' : ''}`} />}
              >
                {generatingBrief
                  ? 'Generating AI Brief...'
                  : prepStatus === 'ready'
                  ? 'View / Regenerate Brief'
                  : 'Generate Brief'}
              </Button>

              <Link to={`/meetings/${meeting.id}/post-meeting`}>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FileCheck2 className="w-4 h-4" />}
                >
                  Post-Meeting Input
                </Button>
              </Link>

              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteMeeting}
                disabled={deleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Grid: Details & Attendees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Meeting Metadata */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Meeting Details
              </h2>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Start Time</span>
                    <span className="text-slate-200 font-medium">
                      {formatDisplayDate(meeting.startTime || meeting.scheduledAt)}
                    </span>
                  </div>
                </div>

                {meeting.endTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">End Time</span>
                      <span className="text-slate-200 font-medium">
                        {formatDisplayDate(meeting.endTime)}
                      </span>
                    </div>
                  </div>
                )}

                {meeting.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location / Link</span>
                      {meeting.location.startsWith('http') ? (
                        <a
                          href={meeting.location}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate max-w-[180px]">{meeting.location}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-200">{meeting.location}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  Update Meeting Status
                </label>
                <select
                  value={meeting.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as Meeting['status'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Right: Attendees List */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Stakeholders & Attendees ({meeting.attendees?.length || 0})</span>
                </h2>
              </div>

              {(!meeting.attendees || meeting.attendees.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No attendees registered for this meeting.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meeting.attendees.map((attendee, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-100">{attendee.name}</p>
                          {(attendee.role || attendee.company) && (
                            <p className="text-xs text-indigo-400 flex items-center gap-1.5 mt-0.5">
                              {attendee.role}
                              {attendee.role && attendee.company && <span>•</span>}
                              {attendee.company}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400">
                        {attendee.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`mailto:${attendee.email}`} className="hover:text-slate-200">
                              {attendee.email}
                            </a>
                          </div>
                        )}
                        {attendee.linkedinUrl && (
                          <div className="flex items-center gap-1.5 truncate">
                            <a
                              href={attendee.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              LinkedIn Profile
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
