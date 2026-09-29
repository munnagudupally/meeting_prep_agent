import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarPlus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { createMeeting, prepareMeeting } from '../services';
import type { Meeting, MeetingAttendee } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PageContainer } from '../components/layout/PageContainer';

export const MeetingCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // Helper to format Date into YYYY-MM-DDTHH:mm in local time
  const toLocalISO = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Default start date: tomorrow at 10:00
  const defaultStart = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return toLocalISO(d);
  };

  // Default end date: tomorrow at 10:45
  const defaultEnd = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 45, 0, 0);
    return toLocalISO(d);
  };

  const [title, setTitle] = useState('Product Roadmap Alignment & Architecture Review');
  const [description, setDescription] = useState(
    'Review Q4 deliverables, discuss AI prep pipeline integrations, and confirm timeline milestones with lead stakeholders.'
  );
  const [startTime, setStartTime] = useState(defaultStart());
  const [endTime, setEndTime] = useState(defaultEnd());
  const [location, setLocation] = useState('https://meet.google.com/xyz-meeting-prep');
  const [status, setStatus] = useState<'upcoming' | 'in_progress' | 'completed'>('upcoming');

  const [attendees, setAttendees] = useState<MeetingAttendee[]>([
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@techcorp.io',
      company: 'TechCorp Enterprise',
      role: 'VP of Engineering',
      linkedinUrl: 'https://linkedin.com/in/sarahjenkins'
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [preparingBrief, setPreparingBrief] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddAttendee = () => {
    setAttendees([
      ...attendees,
      { name: '', email: '', company: '', role: '', linkedinUrl: '' }
    ]);
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleAttendeeChange = (index: number, field: keyof MeetingAttendee, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (!title.trim()) {
        throw new Error('Meeting title is required.');
      }

      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        throw new Error('Please specify a valid start date and time.');
      }

      let endDateISO: string | null = null;
      if (endTime && endTime.trim()) {
        const endDate = new Date(endTime);
        if (isNaN(endDate.getTime())) {
          throw new Error('Please specify a valid end date and time.');
        }
        if (endDate.getTime() <= startDate.getTime()) {
          throw new Error('End time must be after the meeting start time.');
        }
        endDateISO = endDate.toISOString();
      }

      // Filter valid attendees and clean empty fields
      const validAttendees = attendees
        .filter((a) => (a.name && a.name.trim()) || (a.email && a.email.trim()))
        .map((a) => ({
          name: a.name.trim() || 'Participant',
          email: a.email.trim().toLowerCase(),
          company: a.company?.trim() || '',
          role: a.role?.trim() || '',
          linkedinUrl: a.linkedinUrl?.trim() || ''
        }));

      const newMeeting = await createMeeting({
        title: title.trim(),
        description: description.trim(),
        startTime: startDate.toISOString(),
        endTime: endDateISO,
        location: location.trim(),
        attendees: validAttendees,
        status
      });

      setCreatedMeeting(newMeeting);
    } catch (err: unknown) {
      console.error('Failed to create meeting', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error creating meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!createdMeeting) return;
    try {
      setPreparingBrief(true);
      await prepareMeeting(createdMeeting.id);
      navigate(`/meetings/${createdMeeting.id}/brief`);
    } catch (err: unknown) {
      console.error('Failed to generate brief', err);
      alert(err instanceof Error ? err.message : 'Failed to generate brief');
    } finally {
      setPreparingBrief(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/meetings" className="hover:text-slate-200 transition-colors">
            Meetings
          </Link>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="text-indigo-400 font-semibold">Schedule New Meeting</span>
        </div>

        {/* Success Banner if meeting was just created */}
        {createdMeeting ? (
          <Card className="p-8 text-center space-y-6 bg-slate-900/90 border-emerald-500/40">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <Badge variant="emerald" size="md">
                Meeting Saved to Firestore
              </Badge>
              <h2 className="text-xl font-bold text-white">{createdMeeting.title}</h2>
              <p className="text-xs text-slate-400">
                Scheduled for {new Date(startTime).toLocaleString()} with{' '}
                {createdMeeting.attendees?.length || 0} stakeholder(s).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="gradient"
                size="md"
                onClick={handleGenerateBrief}
                disabled={preparingBrief}
                leftIcon={<Sparkles className={`w-4 h-4 ${preparingBrief ? 'animate-spin' : ''}`} />}
              >
                {preparingBrief ? 'Generating AI Brief...' : 'Generate AI Briefing'}
              </Button>

              <Link to={`/meetings/${createdMeeting.id}`}>
                <Button variant="secondary" size="md">
                  View Meeting Details
                </Button>
              </Link>

              <Link to="/meetings">
                <Button variant="outline" size="md">
                  All Meetings
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Meeting Creation Form */
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-1">
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Firestore Meeting Ledger</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Schedule New Meeting</h1>
              <p className="text-xs text-slate-400">
                Register a new meeting session to unlock cross-meeting Hindsight context and automated briefing synthesis.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Meeting Core Information */}
              <Card className="p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>General Information</span>
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q4 Executive Sync & Contract Review"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Objective & Agenda Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the main objectives and context for this meeting..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Timing & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Location / Conference Link
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Initial Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Stakeholders & Attendees Section */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Stakeholders & Attendees ({attendees.length})</span>
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAddAttendee}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Attendee
                  </Button>
                </div>

                {attendees.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300">
                        Attendee #{idx + 1}
                      </span>
                      {attendees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(idx)}
                          className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                          title="Remove attendee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={att.name}
                          onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                          placeholder="e.g. John Matrix"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={att.email}
                          onChange={(e) => handleAttendeeChange(idx, 'email', e.target.value)}
                          placeholder="john@techcorp.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Company</label>
                        <input
                          type="text"
                          value={att.company}
                          onChange={(e) => handleAttendeeChange(idx, 'company', e.target.value)}
                          placeholder="TechCorp"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Role / Title</label>
                        <input
                          type="text"
                          value={att.role}
                          onChange={(e) => handleAttendeeChange(idx, 'role', e.target.value)}
                          placeholder="CTO / Lead"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">LinkedIn Profile</label>
                        <input
                          type="text"
                          value={att.linkedinUrl}
                          onChange={(e) => handleAttendeeChange(idx, 'linkedinUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link to="/meetings">
                  <Button type="button" variant="secondary" size="md">
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="gradient"
                  size="md"
                  disabled={submitting}
                  leftIcon={<CalendarPlus className="w-4 h-4" />}
                >
                  {submitting ? 'Creating Meeting in Firestore...' : 'Create Meeting'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
