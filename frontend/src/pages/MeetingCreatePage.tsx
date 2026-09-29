import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  CalendarPlus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import {
  getContacts,
  createMeeting,
  prepareMeeting
} from '../services';
import type { Contact, Meeting, CreateMeetingPayload } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PageContainer } from '../components/layout/PageContainer';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const MeetingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedContactId = searchParams.get('contactId');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preparingBrief, setPreparingBrief] = useState(false);

  // Success state with the newly created meeting
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);

  // Default date: 3 days from now at 14:00
  const defaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    contactId: preselectedContactId || 'contact-rahul-sharma',
    title: 'Q4 Production Cutover & SRE War Room Alignment',
    scheduledAt: defaultDateTime(),
    durationMinutes: 30,
    meetingType: 'executive-sync' as CreateMeetingPayload['meetingType'],
    agendaText: 'Confirm SRE team on-call war room roster\nReview latency guardrails and Graviton memory benchmarks\nFinalize emergency rollback procedures',
    notes: 'Rahul indicated in Meeting #5 that CFO approval is locked. Needs concrete rollback runbooks before cutover.'
  });

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoadingContacts(true);
        const list = await getContacts();
        setContacts(list);
        if (preselectedContactId && list.some((c) => c.id === preselectedContactId)) {
          setFormData((prev) => ({ ...prev, contactId: preselectedContactId }));
        }
      } catch (err) {
        console.error('Failed to load contacts for meeting creation', err);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadContacts();
  }, [preselectedContactId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateMeetingPayload = {
        contactId: formData.contactId,
        title: formData.title.trim(),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        meetingType: formData.meetingType,
        agenda: formData.agendaText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        notes: formData.notes.trim()
      };

      const newMeeting = await createMeeting(payload);
      setCreatedMeeting(newMeeting);
    } catch (err) {
      console.error('Failed to create meeting', err);
      alert('Error creating meeting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepareMeeting = async () => {
    if (!createdMeeting) return;
    try {
      setPreparingBrief(true);
      await prepareMeeting(createdMeeting.id);
      navigate(`/meetings/${createdMeeting.id}/brief`);
    } catch (err) {
      console.error('Failed to prepare meeting brief', err);
      alert('Error preparing meeting brief.');
    } finally {
      setPreparingBrief(false);
    }
  };

  if (loadingContacts) {
    return <LoadingSpinner message="Preparing meeting creation workspace..." fullHeight />;
  }

  const selectedContact = contacts.find((c) => c.id === formData.contactId);

  // Success Confirmation Screen
  if (createdMeeting) {
    const contactForCreated = contacts.find((c) => c.id === createdMeeting.contactId);
    return (
      <PageContainer maxWidth="2xl">
        <div className="py-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" size="md">
              Meeting Created Successfully
            </Badge>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {createdMeeting.title}
            </h1>
            <p className="text-sm text-slate-300">
              Scheduled with{' '}
              <strong className="text-white">
                {contactForCreated ? `${contactForCreated.name} (${contactForCreated.company})` : 'Stakeholder'}
              </strong>{' '}
              on{' '}
              {new Date(createdMeeting.scheduledAt).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}.
            </p>
          </div>

          {/* Meeting Confirmation Card */}
          <Card className="text-left bg-slate-900/90 border-slate-800">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Meeting ID:</span>
                <span className="font-mono text-indigo-400">{createdMeeting.id}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Duration & Type:</span>
                <span className="text-slate-200">
                  {createdMeeting.durationMinutes} min • {createdMeeting.meetingType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Agenda:</span>
                <ul className="list-disc list-inside text-slate-200 space-y-0.5">
                  {createdMeeting.agenda.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Action choices */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="gradient"
              size="lg"
              isLoading={preparingBrief}
              onClick={handlePrepareMeeting}
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Prepare Meeting Brief
            </Button>

            <Link to="/meetings">
              <Button variant="secondary" size="lg" leftIcon={<Calendar className="w-4 h-4" />}>
                View in Meeting History
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      maxWidth="4xl"
      title={
        <span className="flex items-center gap-2">
          <CalendarPlus className="w-6 h-6 text-indigo-400" />
          Schedule Stakeholder Meeting
        </span>
      }
      subtitle="Schedule a new sync to enable Hindsight to synthesize historical memory and generate an intelligent briefing."
    >
      <div>
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Meeting History
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stakeholder Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Stakeholder *
            </label>
            <div className="relative">
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.title} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            {selectedContact && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300">
                    <strong className="text-white">{selectedContact.name}</strong> • {selectedContact.company}
                  </span>
                </div>
                <Badge variant="purple" size="sm">
                  {selectedContact.previousMeetingsCount} Previous Syncs
                </Badge>
              </div>
            )}
          </div>

          {/* Meeting Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Production Cutover & Architecture Sync"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Grid: Date/Time, Duration, Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Duration
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Meeting Format
              </label>
              <select
                value={formData.meetingType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    meetingType: e.target.value as CreateMeetingPayload['meetingType']
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="executive-sync">Executive Sync</option>
                <option value="technical-review">Technical Review</option>
                <option value="1-on-1">1-on-1</option>
                <option value="vendor-evaluation">Vendor Evaluation</option>
                <option value="catch-up">Catch-up</option>
              </select>
            </div>
          </div>

          {/* Agenda / Objectives */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Meeting Objective & Agenda Topics (One per line) *
            </label>
            <textarea
              rows={4}
              required
              value={formData.agendaText}
              onChange={(e) => setFormData({ ...formData, agendaText: e.target.value })}
              placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Optional Pre-Meeting Notes & Background
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional background context for your prep dossier..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <Link to="/meetings">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              isLoading={submitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
};
