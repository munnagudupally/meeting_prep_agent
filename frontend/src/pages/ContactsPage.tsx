import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowRight,
  Calendar,
  Building,
  X,
  Mail,
  RefreshCw
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
      (c.company || '').toLowerCase().includes(term) ||
      (c.title || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingSpinner message="Retrieving stakeholder network and relationship history..." fullHeight />;
  }

  if (error) {
    return (
      <PageContainer>
        <div className="py-12 max-w-2xl mx-auto space-y-4">
          <ApiErrorBanner error={error} onRetry={fetchContactsList} />
        </div>
      </PageContainer>
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
      subtitle="Directory of external stakeholders derived from meeting attendees, Hindsight memory, and commitments."
      badge={<Badge variant="primary">{contacts.length} Tracked</Badge>}
      actions={
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContactsList}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
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
        </div>
      }
    >
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-slate-500" />}
          title={contacts.length === 0 ? 'No Stakeholders Registered Yet' : 'No Matching Stakeholders Found'}
          description={
            contacts.length === 0
              ? 'Schedule a meeting with attendees or record a memory to automatically populate the contacts directory.'
              : `No contacts matched your search for "${searchTerm}". Try searching by another name or company.`
          }
          actionText={contacts.length === 0 ? 'Schedule First Meeting' : 'Clear Search'}
          onAction={
            contacts.length === 0
              ? () => window.location.assign('/meetings/new')
              : () => setSearchTerm('')
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => {
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
                className="hover:border-slate-700 transition-all space-y-4 p-5"
              >
                {/* Top Profile Summary */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-base shrink-0">
                        {(contact.name || 'S')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{contact.name}</h3>
                      <p className="text-xs text-slate-300 truncate">{contact.title || 'Stakeholder'}</p>
                      <p className="text-xs text-indigo-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" />
                        {contact.company || 'Enterprise Partner'}
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
                    {(contact.relationshipHealth || 'ACTIVE').toUpperCase()}
                  </Badge>
                </div>

                {/* Contact Email / Info */}
                {contact.email && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-slate-200 truncate">
                      {contact.email}
                    </a>
                  </div>
                )}

                {/* Last Meeting info */}
                <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Recent Session:
                  </span>
                  <span className="text-slate-200 font-medium font-mono">{formattedLastMeeting}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Meetings</span>
                    <span className="font-bold text-slate-100">{contact.previousMeetingsCount || 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Concerns</span>
                    <span className="font-bold text-rose-400">{(contact.knownConcerns || []).length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Open Tasks</span>
                    <span className="font-bold text-amber-400">{contact.openCommitmentsCount || 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <Link to={`/contacts/${contact.id}`}>
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Details
                    </Button>
                  </Link>

                  <Link to={`/meetings/new`}>
                    <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3 h-3" />}>
                      Schedule
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};
