import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Clock,
  Calendar,
  Sparkles,
  ShieldAlert,
  Sliders,
  CheckSquare,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  Users,
  Lightbulb,
  CalendarDays
} from 'lucide-react';
import { apiService } from '../services/apiService';
import type { TimelineEvent, TimelineEventType, Contact } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const MemoryTimelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialContactId = searchParams.get('contactId') || 'all';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(initialContactId);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contactList, timelineEvents] = await Promise.all([
          apiService.getContacts(),
          apiService.getTimelineEvents(selectedContactId === 'all' ? undefined : selectedContactId)
        ]);
        setContacts(contactList);
        setEvents(timelineEvents);
      } catch (err) {
        console.error('Failed to load memory timeline', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedContactId]);

  // Sync contact filter with URL
  const handleContactChange = (newContactId: string) => {
    setSelectedContactId(newContactId);
    if (newContactId === 'all') {
      searchParams.delete('contactId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ contactId: newContactId });
    }
  };

  const toggleEventExpanded = (id: string) => {
    setExpandedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mock interaction to toggle commitment completion from timeline
  const handleToggleCommitment = async (commitmentId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'completed' ? 'open' : 'completed';
    await apiService.updateCommitmentStatus(commitmentId, nextStatus);

    // Optimistically update timeline events state
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.details?.commitmentId === commitmentId) {
          return {
            ...evt,
            badgeText: nextStatus === 'completed' ? 'Commitment Fulfilled' : 'Commitment Promised',
            badgeVariant: nextStatus === 'completed' ? 'success' : 'warning',
            details: {
              ...evt.details,
              status: nextStatus
            }
          };
        }
        return evt;
      })
    );
  };

  if (loading) {
    return <LoadingSpinner message="Reconstructing chronological memory timeline & interaction history..." fullHeight />;
  }

  // Filter events
  const filteredEvents = events
    .filter((evt) => {
      // Type filter
      if (selectedType !== 'all' && evt.type !== selectedType) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesDesc = (evt.description || '').toLowerCase().includes(q);
        const matchesSummary = (evt.summary || '').toLowerCase().includes(q);
        const matchesContact = evt.contactName.toLowerCase().includes(q) || evt.contactCompany.toLowerCase().includes(q);
        const matchesMeeting = (evt.meetingTitle || '').toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesSummary || matchesContact || matchesMeeting;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  // Calculate event type counts
  const typeCounts = {
    all: events.length,
    meeting: events.filter((e) => e.type === 'meeting').length,
    fact: events.filter((e) => e.type === 'fact').length,
    concern: events.filter((e) => e.type === 'concern').length,
    preference: events.filter((e) => e.type === 'preference').length,
    commitment: events.filter((e) => e.type === 'commitment').length
  };

  // Group events by Month/Year for clean reading
  const groupedEvents: { [monthYear: string]: TimelineEvent[] } = {};
  filteredEvents.forEach((evt) => {
    const d = new Date(evt.date);
    const monthYear = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!groupedEvents[monthYear]) {
      groupedEvents[monthYear] = [];
    }
    groupedEvents[monthYear].push(evt);
  });

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'fact':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'concern':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'preference':
        return <Sliders className="w-4 h-4 text-sky-400" />;
      case 'commitment':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getEventNodeColor = (type: TimelineEventType) => {
    switch (type) {
      case 'meeting':
        return 'border-indigo-500 bg-indigo-950 text-indigo-400 shadow-indigo-500/20';
      case 'fact':
        return 'border-purple-500 bg-purple-950 text-purple-400 shadow-purple-500/20';
      case 'concern':
        return 'border-rose-500 bg-rose-950 text-rose-400 shadow-rose-500/20';
      case 'preference':
        return 'border-sky-500 bg-sky-950 text-sky-400 shadow-sky-500/20';
      case 'commitment':
        return 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-emerald-500/20';
      default:
        return 'border-slate-500 bg-slate-900 text-slate-400 shadow-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. HEADER & INTERACTION INTELLIGENCE STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <span>Memory Timeline & Interaction History</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Longitudinal chronological memory log synthesizing meeting summaries, remembered facts, stakeholder preferences, known concerns, and commitment transitions.
          </p>
        </div>

        {/* Quick dossier jump */}
        <div className="flex items-center gap-2">
          <Link to="/meetings/meeting-6/brief">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}>
              Meeting Brief
            </Button>
          </Link>
          <Link to="/commitments">
            <Button variant="secondary" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}>
              Commitments
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW MATRIX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Interactions Logged
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">{events.length}</span>
          <span className="text-[11px] text-slate-400 block">Across 5+ months</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
            Meeting Summaries
          </span>
          <span className="text-2xl font-extrabold text-indigo-300 font-mono">{typeCounts.meeting}</span>
          <span className="text-[11px] text-slate-400 block">Agendas & decisions</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider block">
            Remembered Facts
          </span>
          <span className="text-2xl font-extrabold text-purple-300 font-mono">{typeCounts.fact}</span>
          <span className="text-[11px] text-slate-400 block">Grounded quotes</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
            Commitment Events
          </span>
          <span className="text-2xl font-extrabold text-emerald-300 font-mono">{typeCounts.commitment}</span>
          <span className="text-[11px] text-slate-400 block">Promised & fulfilled</span>
        </div>
      </div>

      {/* 3. TOOLBAR: CONTACT SELECTOR, EVENT TYPE FILTERS, SEARCH, SORT */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Contact Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Filter Contact:
            </span>
            <select
              value={selectedContactId}
              onChange={(e) => handleContactChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Contacts ({contacts.length})</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} • {c.company}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input & Sort Order Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search memories, facts, quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Toggle sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Event Type Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Event Types:
          </span>

          {[
            { id: 'all', label: 'All Events', count: typeCounts.all },
            { id: 'meeting', label: 'Meeting Summaries', count: typeCounts.meeting },
            { id: 'fact', label: 'Remembered Facts', count: typeCounts.fact },
            { id: 'concern', label: 'Concerns', count: typeCounts.concern },
            { id: 'preference', label: 'Preferences', count: typeCounts.preference },
            { id: 'commitment', label: 'Commitment Changes', count: typeCounts.commitment }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CHRONOLOGICAL TIMELINE STREAM */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Timeline Events Match</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switching the event type filter back to all events.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedType('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear} className="space-y-4">
              {/* Month Group Header Sticky Flag */}
              <div className="flex items-center gap-3 sticky top-16 z-20 bg-slate-950/90 backdrop-blur-sm py-2">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-800/50 shadow-sm">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {monthYear}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-900/60 to-transparent" />
                <span className="text-[11px] font-mono text-slate-500">
                  {monthEvents.length} events
                </span>
              </div>

              {/* Month Timeline Items */}
              <div className="relative border-l-2 border-indigo-900/40 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-5">
                {monthEvents.map((evt) => {
                  const isExpanded = !!expandedEventIds[evt.id];
                  const hasExpandableDetails =
                    evt.type === 'meeting' &&
                    ((evt.details?.decisions && evt.details.decisions.length > 0) ||
                      (evt.details?.discussionTopics && evt.details.discussionTopics.length > 0) ||
                      (evt.details?.agenda && evt.details.agenda.length > 0));

                  return (
                    <div key={evt.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[35px] sm:-left-[43px] top-4 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 z-10 ${getEventNodeColor(
                          evt.type
                        )}`}
                      >
                        {getEventIcon(evt.type)}
                      </div>

                      {/* Event Card */}
                      <Card className="hover:border-slate-700/80 transition-all bg-slate-900/90 shadow-lg">
                        <div className="space-y-3">
                          {/* Card Header: Badges & Date */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={evt.badgeVariant} size="sm">
                                {evt.badgeText}
                              </Badge>

                              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <Link
                                  to={`/contacts/${evt.contactId}`}
                                  className="hover:text-indigo-400 hover:underline transition-colors"
                                >
                                  {evt.contactName}
                                </Link>
                                <span className="text-slate-500 font-normal">({evt.contactCompany})</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {evt.date}
                              </span>
                              {evt.timestamp && (
                                <span className="text-slate-500">• {evt.timestamp}</span>
                              )}
                            </div>
                          </div>

                          {/* Event Title */}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm md:text-base font-bold text-white tracking-tight leading-snug">
                              {evt.title}
                            </h3>

                            {evt.meetingId && (
                              <Link
                                to={`/meetings/${evt.meetingId}/brief`}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 shrink-0 bg-indigo-950/30 px-2 py-1 rounded-lg border border-indigo-800/40"
                                title="Open meeting brief dossier"
                              >
                                <span>Brief</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>

                          {/* Event Description / Summary */}
                          {(evt.summary || evt.description) && (
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {evt.summary || evt.description}
                            </p>
                          )}

                          {/* TYPE-SPECIFIC CALLOUTS */}

                          {/* 1. Remembered Fact Quote & Why It Matters */}
                          {evt.type === 'fact' && evt.details && (
                            <div className="space-y-2 pt-1">
                              {evt.details.whyItMatters && (
                                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-800/40 text-xs text-purple-200 space-y-1">
                                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-purple-400 font-mono">
                                    <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Why It Matters:</span>
                                  </div>
                                  <p className="leading-relaxed text-slate-200">
                                    {evt.details.whyItMatters}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. Concern Callout */}
                          {evt.type === 'concern' && evt.details && (
                            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs space-y-1 text-rose-200">
                              <span className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                                Severity: {evt.details.severity?.toUpperCase()} RISK
                              </span>
                              <p className="text-slate-300 leading-relaxed">
                                {evt.details.whyItMatters}
                              </p>
                            </div>
                          )}

                          {/* 3. Preference Callout */}
                          {evt.type === 'preference' && evt.details && (
                            <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-900/40 text-xs text-sky-200 font-mono">
                              Category: {evt.details.category?.toUpperCase()}
                            </div>
                          )}

                          {/* 4. Commitment Interactive Checkbox */}
                          {evt.type === 'commitment' && evt.details && (
                            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-200">
                                    Owner: {evt.details.owner}
                                  </span>
                                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                                    Due: {evt.details.dueDate}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono block">
                                  Status: {evt.details.status?.toUpperCase()}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  handleToggleCommitment(
                                    evt.details!.commitmentId!,
                                    evt.details!.status
                                  )
                                }
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                                  evt.details.status === 'completed'
                                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  {evt.details.status === 'completed'
                                    ? 'Completed (Click to Re-open)'
                                    : 'Mark as Fulfilled'}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Expandable Meeting Details */}
                          {hasExpandableDetails && (
                            <div className="pt-2 border-t border-slate-800/80">
                              <button
                                onClick={() => toggleEventExpanded(evt.id)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : 'View'} Decisions & Agenda Topics</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                                  {evt.details?.decisions && evt.details.decisions.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                                        Decisions Agreed:
                                      </span>
                                      <ul className="space-y-1">
                                        {evt.details.decisions.map((dec, idx) => (
                                          <li
                                            key={idx}
                                            className="text-xs text-slate-200 flex items-start gap-1.5"
                                          >
                                            <span className="text-emerald-400 font-bold">•</span>
                                            <span>{dec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {evt.details?.discussionTopics && evt.details.discussionTopics.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                                        Topics Discussed:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {evt.details.discussionTopics.map((topic, idx) => (
                                          <span
                                            key={idx}
                                            className="text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800"
                                          >
                                            {topic}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryTimelinePage;
