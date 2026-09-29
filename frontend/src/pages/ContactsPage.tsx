import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Calendar,
  Building,
  X
} from 'lucide-react';
import { getContacts } from '../services';
import type { Contact } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/layout/PageContainer';
import { ApiErrorBanner } from '../components/common/ApiErrorBanner';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContactsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
      setError(err instanceof Error ? err.message : 'Unable to load contacts directory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsList();
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.department.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingSpinner message="Retrieving stakeholder network and relationship history..." fullHeight />;
  }

  if (error) {
    return (
      <div className="py-12 max-w-2xl mx-auto space-y-4">
        <ApiErrorBanner error={error} onRetry={fetchContactsList} />
      </div>
    );
  }

  return (
    <PageContainer
      title={
        <span className="flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          Contacts & Stakeholders
        </span>
      }
      subtitle="Directory of external stakeholders, historical meeting memory, preferences, and commitments."
      badge={<Badge variant="primary">{contacts.length} Tracked</Badge>}
      actions={
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, company, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6 text-slate-500" />}
          title="No Matching Stakeholders Found"
          description={`No contacts matched your search for "${searchTerm}". Try searching by another name or company.`}
          actionText="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => {
            const isRahul = contact.id === 'contact-rahul-sharma';
            const formattedLastMeeting = contact.lastMeetingDate
              ? new Date(contact.lastMeetingDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'None';

            return (
              <Card
                key={contact.id}
                className={`transition-all ${
                  isRahul
                    ? 'border-indigo-500/50 bg-slate-900/90 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/20'
                    : 'hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Profile Summary */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-white truncate">{contact.name}</h3>
                          {isRahul && (
                            <Badge variant="primary" size="sm">
                              Demo Focus
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 truncate">{contact.title}</p>
                        <p className="text-xs text-indigo-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {contact.company}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        contact.relationshipHealth === 'strong'
                          ? 'success'
                          : contact.relationshipHealth === 'neutral'
                          ? 'info'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {contact.relationshipHealth.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {contact.bio}
                  </p>

                  {/* Last Meeting info */}
                  <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Last Meeting:
                    </span>
                    <span className="text-slate-200 font-medium font-mono">{formattedLastMeeting}</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Meetings</span>
                      <span className="font-bold text-slate-100">{contact.previousMeetingsCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Concerns</span>
                      <span className="font-bold text-rose-400">{contact.knownConcerns.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Open Tasks</span>
                      <span className="font-bold text-amber-400">{contact.openCommitmentsCount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <Link to={`/contacts/${contact.id}`}>
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        View Details
                      </Button>
                    </Link>

                    {isRahul && (
                      <Link to="/meetings/meeting-6/brief">
                        <Button variant="gradient" size="sm" leftIcon={<Sparkles className="w-3 h-3" />}>
                          Brief
                        </Button>
                      </Link>
                    )}
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
