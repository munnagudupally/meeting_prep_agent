import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Search,
  Users,
  Plus,
  Trash2,
  BrainCircuit,
  RefreshCw,
  Tag
} from 'lucide-react';
import { getMemories, createMemory, deleteMemory } from '../services';
import type { Memory } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PageContainer } from '../components/layout/PageContainer';
import { EmptyState } from '../components/common/EmptyState';

function formatDisplayDate(val: any): string {
  if (!val) return 'Date not specified';
  if (val && typeof val === 'object' && ('_seconds' in val || 'seconds' in val)) {
    const secs = val._seconds || val.seconds;
    return new Date(secs * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const MemoryTimelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Memory Modal Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newCategory, setNewCategory] = useState('rapport');
  const [newSentiment, setNewSentiment] = useState<'positive' | 'neutral' | 'cautious'>('neutral');
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const mems = await getMemories();
      setMemories(mems);
    } catch (err) {
      console.error('Failed to load memory timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setCreating(true);
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createMemory({
        attendeeName: newAttendeeName.trim(),
        attendeeEmail: newAttendeeEmail.trim(),
        category: newCategory,
        sentiment: newSentiment,
        note: newNote.trim(),
        tags: tagsArray
      });

      setMemories((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);

      // Reset form
      setNewAttendeeName('');
      setNewAttendeeEmail('');
      setNewCategory('rapport');
      setNewSentiment('neutral');
      setNewNote('');
      setNewTags('');
    } catch (err: unknown) {
      console.error('Failed to create memory', err);
      alert(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memory entry?')) {
      try {
        setDeletingId(id);
        await deleteMemory(id);
        setMemories((prev) => prev.filter((m) => m.id !== id));
      } catch (err: unknown) {
        console.error('Failed to delete memory', err);
        alert(err instanceof Error ? err.message : 'Failed to delete memory');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Reconstructing chronological Hindsight memory repository..." fullHeight />;
  }

  // Filter logic
  const filteredMemories = memories.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const noteMatch = m.note.toLowerCase().includes(q);
      const nameMatch = (m.attendeeName || '').toLowerCase().includes(q);
      const emailMatch = (m.attendeeEmail || '').toLowerCase().includes(q);
      const tagMatch = (m.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!noteMatch && !nameMatch && !emailMatch && !tagMatch) return false;
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
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Hindsight Memory Repository</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Cross-Meeting Memory Timeline</h1>
            <p className="text-xs text-slate-400">
              Persistent memory logs capturing stakeholder dynamics, commitments, preferences, and relationship nuances.
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

            <Button
              variant="gradient"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Memory
            </Button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories by stakeholder, keywords, or tags..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800/80 shrink-0">
            {['all', 'rapport', 'commitment', 'decision', 'concern', 'preference', 'general'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memories Timeline View */}
        {filteredMemories.length === 0 ? (
          <Card className="p-12 text-center">
            <EmptyState
              icon={<BrainCircuit className="w-8 h-8 text-slate-500" />}
              title={
                searchQuery || selectedCategory !== 'all'
                  ? 'No matching memories found'
                  : 'No memories recorded yet'
              }
              description={
                searchQuery || selectedCategory !== 'all'
                  ? 'Try clearing your search query or selecting a different category.'
                  : 'Record memories manually or complete a post-meeting debrief to populate Hindsight intelligence.'
              }
              actionText={
                searchQuery || selectedCategory !== 'all' ? 'Clear Filters' : 'Record First Memory'
              }
              onAction={
                searchQuery || selectedCategory !== 'all'
                  ? () => {
                      setSearchQuery('');
                      handleCategoryChange('all');
                    }
                  : () => setIsCreateModalOpen(true)
              }
            />
          </Card>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-6">
            {filteredMemories.map((mem) => {
              const badgeVariant =
                mem.category === 'commitment'
                  ? 'purple'
                  : mem.category === 'concern'
                  ? 'rose'
                  : mem.category === 'decision'
                  ? 'emerald'
                  : mem.category === 'preference'
                  ? 'amber'
                  : 'indigo';

              const isDeleting = deletingId === mem.id;

              return (
                <div key={mem.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 ring-4 ring-slate-950" />

                  <Card className="p-5 hover:border-slate-700 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={badgeVariant} size="sm">
                          {mem.category.toUpperCase()}
                        </Badge>

                        {mem.sentiment && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              mem.sentiment === 'positive'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : mem.sentiment === 'cautious'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {mem.sentiment.toUpperCase()}
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDisplayDate(mem.createdAt)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(mem.id)}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors self-end sm:self-auto cursor-pointer"
                        title="Delete memory"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      {mem.note}
                    </p>

                    {/* Metadata footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      {(mem.attendeeName || mem.attendeeEmail) && (
                        <div className="flex items-center gap-1.5 text-indigo-300">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {mem.attendeeName || 'Stakeholder'}{' '}
                            {mem.attendeeEmail ? `(${mem.attendeeEmail})` : ''}
                          </span>
                        </div>
                      )}

                      {mem.tags && mem.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {mem.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Record Memory Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Record New Hindsight Memory</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Stakeholder Name
                    </label>
                    <input
                      type="text"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Stakeholder Email
                    </label>
                    <input
                      type="email"
                      value={newAttendeeEmail}
                      onChange={(e) => setNewAttendeeEmail(e.target.value)}
                      placeholder="rahul@acme.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="rapport">Rapport & Background</option>
                      <option value="commitment">Commitment / Promise</option>
                      <option value="decision">Key Decision</option>
                      <option value="concern">Known Concern</option>
                      <option value="preference">Stakeholder Preference</option>
                      <option value="general">General Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sentiment
                    </label>
                    <select
                      value={newSentiment}
                      onChange={(e) => setNewSentiment(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="positive">Positive / Enthusiastic</option>
                      <option value="neutral">Neutral / Informational</option>
                      <option value="cautious">Cautious / Risk Point</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Memory Note *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter the observation, commitment, or insight to remember for future prep..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="latency, SLA, budget, security"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    size="sm"
                    disabled={creating}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {creating ? 'Saving Memory...' : 'Save Memory'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
