import type { Contact, Meeting, MemorySource, MeetingBrief } from '../types';
import contactsJson from './contacts.json';
import meetingsJson from './meetings.json';
import memorySourcesJson from './memorySources.json';
import briefMeeting6Json from './briefMeeting6.json';

export const INITIAL_CONTACTS: Contact[] = contactsJson as unknown as Contact[];
export const INITIAL_MEETINGS: Meeting[] = meetingsJson as unknown as Meeting[];
export const MOCK_MEMORY_SOURCES: MemorySource[] = memorySourcesJson as unknown as MemorySource[];
export const MOCK_BRIEF_FOR_MEETING_6: MeetingBrief = briefMeeting6Json as unknown as MeetingBrief;
