import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  Mail,
  Clock,
  CalendarPlus,
  AlertCircle,
  BrainCircuit
} from 'lucide-react';
import {
  getContact,
  getMemories,
  getAllMeetings
} from '../services';
import type { Contact, Meeting, Memory } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PageContainer } from '../components/layout/PageContainer';

export const ContactDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [c, allMeets, allMems] = await Promise.all([
        getContact(id),
        getAllMeetings(),
        getMemories()
      ]);

      setContact(c);

      // Filter meetings for this contact by id or attendee email/name
      const contactMeetings = allMeets.filter((m) => {
        if (m.contactId === id) return true;
        if (c && m.attendees) {
          return m.attendees.some(
            (a) =>
              (c.email && a.email && a.email.toLowerCase() === c.email.toLowerCase()) ||
              (c.name && a.name && a.name.toLowerCase() === c.name.toLowerCase())
          );
        }
        return false;
      });
      setMeetings(contactMeetings);

      // Filter memories for this contact
      const contactMemories = allMems.filter((mem) => {
        if (c && c.email && mem.attendeeEmail) {
          return mem.attendeeEmail.toLowerCase() === c.email.toLowerCase();
        }
        if (c && c.name && mem.attendeeName) {
          return mem.attendeeName.toLowerCase().includes(c.name.toLowerCase());
        }
        return false;
      });
      setMemories(contactMemories);
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

  if (loading) {
    return <LoadingSpinner message="Retrieving stakeholder dossier and conversation history..." fullHeight />;
  }

  if (error || !contact) {
    return (
      <PageContainer>
        <div className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{error || 'Stakeholder Not Found'}</h2>
          <Link to="/contacts">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Contacts
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
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
        <Card className="border-indigo-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-2xl shrink-0">
                  {(contact.name || 'S')[0].toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {contact.name}
                  </h1>
                  <Badge variant="primary">{contact.company || 'Enterprise Partner'}</Badge>
                  <Badge
                    variant={
                      contact.relationshipHealth === 'strong'
                        ? 'success'
                        : contact.relationshipHealth === 'neutral'
                        ? 'info'
                        : 'danger'
                    }
                  >
                    Health: {(contact.relationshipHealth || 'ACTIVE').toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  {contact.title || 'Stakeholder'} {contact.department ? `• ${contact.department}` : ''}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                  {contact.company && (
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-400" /> {contact.company}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> {contact.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> {contact.previousMeetingsCount || meetings.length} Meetings
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link to="/meetings/new">
                <Button variant="gradient" size="sm" leftIcon={<CalendarPlus className="w-4 h-4" />}>
                  Schedule Meeting
                </Button>
              </Link>
            </div>
          </div>

          {/* Bio */}
          {contact.bio && (
            <p className="text-xs text-slate-300 leading-relaxed mt-4 pt-4 border-t border-slate-800">
              {contact.bio}
            </p>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* 2-Column: Meetings & Memories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Associated Meetings */}
          <Card className="p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Associated Meetings ({meetings.length})</span>
            </h2>

            {meetings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No meetings recorded with this stakeholder yet.
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <Link
                        to={`/meetings/${m.id}`}
                        className="text-xs font-bold text-slate-100 hover:text-indigo-400"
                      >
                        {m.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {m.status.toUpperCase()}
                      </p>
                    </div>

                    <Link to={`/meetings/${m.id}/brief`}>
                      <Button variant="outline" size="xs">
                        Brief
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Hindsight Memories */}
          <Card className="p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Hindsight Memories ({memories.length})</span>
            </h2>

            {memories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No memories logged for this stakeholder yet.
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="indigo" size="sm">
                        {mem.category.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mem.sentiment || 'neutral'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{mem.note}</p>
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
