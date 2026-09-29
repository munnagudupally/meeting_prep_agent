import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  Filter,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  ExternalLink,
  Plus,
  X,
  Sparkles,
  ArrowUpDown,
  Users
} from 'lucide-react';
import { apiService } from '../services/apiService';
import type { Commitment, Contact, Meeting, CreateCommitmentPayload } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const CommitmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialContactId = searchParams.get('contactId') || 'all';

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterContactId, setFilterContactId] = useState<string>(initialContactId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc'>('dueDateAsc');

  // New Commitment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwner, setNewOwner] = useState<'you' | 'contact'>('you');
  const [newDueDate, setNewDueDate] = useState('2026-10-15');
  const [newContactId, setNewContactId] = useState('contact-rahul-sharma');
  const [newMeetingId, setNewMeetingId] = useState('meeting-6');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [allComms, contactList, meetingList] = await Promise.all([
          apiService.getAllCommitments(),
          apiService.getContacts(),
          apiService.getAllMeetings()
        ]);
        setCommitments(allComms);
        setContacts(contactList);
        setMeetings(meetingList);
      } catch (err) {
        console.error('Failed to load commitments', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update contact filter if URL changes
  useEffect(() => {
    const cid = searchParams.get('contactId');
    if (cid && cid !== filterContactId) {
      setFilterContactId(cid);
    }
  }, [searchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mock interaction to toggle commitment completion
  const toggleStatus = async (id: string, currentStatus: Commitment['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'open' : 'completed';
    await apiService.updateCommitmentStatus(id, nextStatus);

    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    showToast(
      nextStatus === 'completed'
        ? 'Commitment marked as completed! Synchronized across dossier & timeline.'
        : 'Commitment re-opened!'
    );
  };

  // Helper to determine if a commitment is overdue
  // Reference date in mock system is roughly 2026-10-02 (meeting-6) or current date
  const isOverdue = (c: Commitment): boolean => {
    if (c.status === 'completed') return false;
    const targetDate = new Date(c.dueDate);
    const today = new Date();
    const mockRefDate = new Date('2026-10-01'); // Mock world reference date
    return targetDate < today || targetDate < mockRefDate;
  };

  // Relative due calculation
  const getDueBadge = (c: Commitment) => {
    if (c.status === 'completed') {
      return (
        <Badge variant="success" size="sm">
          Completed
        </Badge>
      );
    }

    if (isOverdue(c)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950/70 text-rose-400 border border-rose-800/80 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          OVERDUE ({c.dueDate})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
        <Clock className="w-3 h-3 text-indigo-400" />
        Due: {c.dueDate}
      </span>
    );
  };

  // Filter & Search Logic
  const filtered = commitments
    .filter((c) => {
      // Owner filter
      if (filterOwner !== 'all') {
        if (filterOwner === 'you' && c.owner !== 'you') return false;
        if (filterOwner === 'contact' && c.owner === 'you') return false;
      }

      // Status filter
      if (filterStatus === 'open' && c.status !== 'open') return false;
      if (filterStatus === 'completed' && c.status !== 'completed') return false;
      if (filterStatus === 'overdue' && !isOverdue(c)) return false;

      // Contact filter
      if (filterContactId !== 'all' && c.contactId !== filterContactId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesMeeting = c.sourceMeetingTitle.toLowerCase().includes(q);
        const matchesOwner = c.ownerName.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesMeeting || matchesOwner;
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.dueDate).getTime();
      const timeB = new Date(b.dueDate).getTime();
      return sortBy === 'dueDateAsc' ? timeA - timeB : timeB - timeA;
    });

  // Calculate high level counts
  const totalCount = commitments.length;
  const openCount = commitments.filter((c) => c.status === 'open').length;
  const overdueCount = commitments.filter((c) => isOverdue(c)).length;
  const completedCount = commitments.filter((c) => c.status === 'completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle adding a custom commitment
  const handleAddCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const contact = contacts.find((c) => c.id === newContactId);
    const meeting = meetings.find((m) => m.id === newMeetingId);

    const payload: CreateCommitmentPayload = {
      meetingId: newMeetingId,
      contactId: newContactId,
      owner: newOwner,
      ownerName: newOwner === 'you' ? 'Your Team' : contact?.name || 'Contact',
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
      status: 'open',
      sourceMeetingTitle: meeting?.title || 'Executive Session',
      sourceMeetingDate: new Date().toISOString().split('T')[0]
    };

    const created = await apiService.addCommitment(payload);
    setCommitments((prev) => [created, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    showToast('New commitment created and logged to accountability ledger!');
  };

  if (loading) {
    return <LoadingSpinner message="Loading cross-meeting commitments ledger & accountability state..." fullHeight />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-indigo-950 border border-indigo-500 shadow-2xl text-xs font-semibold text-white flex items-center gap-2.5 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span>Commitments & Follow-Ups</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Accountability ledger tracking deliverables promised by you and external stakeholders across all historical meetings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/meetings/meeting-6/brief">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}>
              Meeting Brief
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Commitment
          </Button>
        </div>
      </div>

      {/* 2. STATS & INDICATOR TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Deliverables */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Deliverables
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">{totalCount}</span>
          <span className="text-[11px] text-slate-400 block">{contacts.length} Contacts</span>
        </div>

        {/* Open Indicator */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
            filterStatus === 'open'
              ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950/60'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
            Open Commitments
          </span>
          <span className="text-2xl font-extrabold text-indigo-300 font-mono">{openCount}</span>
          <span className="text-[11px] text-slate-400 block">Pending fulfillment</span>
        </div>

        {/* Overdue Indicator */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
            overdueCount > 0 ? 'bg-rose-950/30 border-rose-800/60' : 'bg-slate-900/80 border-slate-800'
          } ${filterStatus === 'overdue' ? 'ring-2 ring-rose-500 shadow-md shadow-rose-950/60' : 'hover:border-rose-700/80'}`}
        >
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Overdue Items
          </span>
          <span className="text-2xl font-extrabold text-rose-300 font-mono">{overdueCount}</span>
          <span className="text-[11px] text-rose-300/80 block">Requires immediate action</span>
        </div>

        {/* Completed Indicator */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'completed' ? 'all' : 'completed')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
            filterStatus === 'completed'
              ? 'bg-emerald-950/50 border-emerald-500 shadow-md shadow-emerald-950/60'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
            Completed Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-300 font-mono">{completedCount}</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">({completionRate}%)</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Fulfilled trust markers</span>
        </div>
      </div>

      {/* 3. MULTI-FACETED FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>

            {[
              { id: 'all', label: 'All', count: totalCount },
              { id: 'open', label: 'Open', count: openCount },
              { id: 'overdue', label: 'Overdue', count: overdueCount, highlight: overdueCount > 0 },
              { id: 'completed', label: 'Completed', count: completedCount }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? tab.id === 'overdue'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : tab.highlight
                    ? 'bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Bar & Sort Order */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, meeting, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() =>
                setSortBy((prev) => (prev === 'dueDateAsc' ? 'dueDateDesc' : 'dueDateAsc'))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Toggle due date sorting"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sortBy === 'dueDateAsc' ? 'Due Soonest' : 'Due Latest'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Owner & Contact dropdowns */}
        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800/60 text-xs">
          {/* Owner Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Owner:</span>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Owners</option>
              <option value="you">My Deliverables (Your Team)</option>
              <option value="contact">Stakeholders (External)</option>
            </select>
          </div>

          {/* Contact Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Contact:</span>
            <select
              value={filterContactId}
              onChange={(e) => {
                setFilterContactId(e.target.value);
                if (e.target.value === 'all') {
                  searchParams.delete('contactId');
                  setSearchParams(searchParams);
                } else {
                  setSearchParams({ contactId: e.target.value });
                }
              }}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Contacts ({contacts.length})</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} • {c.company}
                </option>
              ))}
            </select>
          </div>

          {(filterStatus !== 'all' ||
            filterOwner !== 'all' ||
            filterContactId !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterOwner('all');
                setFilterContactId('all');
                setSearchQuery('');
                searchParams.delete('contactId');
                setSearchParams(searchParams);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer ml-auto"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 4. COMMITMENTS LIST */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Commitments Match Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try switching status back to all or changing owner/contact selections.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFilterStatus('all');
              setFilterOwner('all');
              setFilterContactId('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const isItemOverdue = isOverdue(item);
            const isCompleted = item.status === 'completed';
            const contact = contacts.find((c) => c.id === item.contactId);

            return (
              <Card
                key={item.id}
                className={`transition-all bg-slate-900/90 hover:border-slate-700 shadow-md ${
                  isItemOverdue
                    ? 'border-rose-900/70 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                    : isCompleted
                    ? 'opacity-75 border-slate-800/80 bg-slate-950/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Checkbox & Content */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Mock interactive toggle */}
                    <button
                      onClick={() => toggleStatus(item.id, item.status)}
                      className="mt-1 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                      title={isCompleted ? 'Click to mark as open' : 'Click to mark as completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                      ) : isItemOverdue ? (
                        <div className="w-5 h-5 rounded-md border-2 border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 flex items-center justify-center transition-colors" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-600 hover:border-indigo-400 flex items-center justify-center transition-colors" />
                      )}
                    </button>

                    <div className="space-y-2 flex-1">
                      {/* Badge Metadata Bar */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Owner Badge */}
                        <Badge variant={item.owner === 'you' ? 'primary' : 'warning'} size="sm">
                          {item.owner === 'you' ? 'Owner: You (Your Team)' : `Owner: ${item.ownerName}`}
                        </Badge>

                        {/* Status / Due Badge */}
                        {getDueBadge(item)}

                        {/* Related Contact */}
                        <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <Link
                            to={`/contacts/${item.contactId}`}
                            className="hover:text-indigo-400 hover:underline transition-colors"
                          >
                            {contact?.name || item.ownerName}
                          </Link>
                          {contact && (
                            <span className="text-slate-500 font-normal">({contact.company})</span>
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-sm md:text-base font-bold leading-snug tracking-tight ${
                          isCompleted ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {item.description}
                        </p>
                      )}

                      {/* Related Meeting Origin */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          Origin: {item.sourceMeetingTitle} ({item.sourceMeetingDate})
                        </span>
                        {item.meetingId && (
                          <Link
                            to={`/meetings/${item.meetingId}/brief`}
                            className="text-indigo-400 hover:text-indigo-300 font-sans font-medium inline-flex items-center gap-0.5 ml-1 shrink-0"
                            title="View Meeting Brief"
                          >
                            <span>View Brief</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                    <Button
                      variant={isCompleted ? 'secondary' : 'primary'}
                      size="xs"
                      onClick={() => toggleStatus(item.id, item.status)}
                    >
                      {isCompleted ? 'Mark Open' : 'Mark Completed'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. ADD COMMITMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
                Add New Commitment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommitment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Commitment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deliver benchmark comparison report on AWS Graviton3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Deliverable Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed deliverables, benchmark parameters, or dependencies..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Owner</label>
                  <select
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value as 'you' | 'contact')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="you">My Deliverable (Your Team)</option>
                    <option value="contact">Stakeholder (Contact)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Related Contact</label>
                  <select
                    value={newContactId}
                    onChange={(e) => setNewContactId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Related Meeting</label>
                  <select
                    value={newMeetingId}
                    onChange={(e) => setNewMeetingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title.slice(0, 24)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Commitment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitmentsPage;
