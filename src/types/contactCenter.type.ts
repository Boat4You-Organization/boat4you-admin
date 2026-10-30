/* Contact Center (P2) DTOs, as the backend's /admin/cc API sends them (Instants as ISO-8601 strings). */
import { ChatSessionStatus } from '@/services/chat.service';

export type ContactStatus = 'NEW' | 'REPLIED' | 'OFFER_SENT' | 'NEGOTIATING' | 'WON' | 'LOST' | 'SPAM';

export const CONTACT_STATUSES: ContactStatus[] = ['NEW', 'REPLIED', 'OFFER_SENT', 'NEGOTIATING', 'WON', 'LOST', 'SPAM'];

export const CHAT_STATUSES: ChatSessionStatus[] = ['AI', 'HUMAN_REQUESTED', 'HUMAN', 'CLOSED', 'LOCKED'];

export interface ConversationFilter {
  siteId?: string;
  status?: string;
  needsHuman?: boolean;
  flaggedOnly?: boolean;
  contactStatus?: string;
  tag?: string;
  from?: string;
  to?: string;
  q?: string;
  includeSpam?: boolean;
  before?: string;
  beforeId?: number;
  size?: number;
}

export interface ConversationRow {
  id: number;
  siteId: string;
  status: ChatSessionStatus;
  locale: string;
  visitorName: string | null;
  visitorEmail: string | null;
  phone: string | null;
  adminUnread: boolean;
  lastActivityAt: string;
  lastMessage: string | null;
  lastMessageRole: string | null;
  lastSeenAt: string | null;
  currentPage: string | null;
  countryCode: string | null;
  country: string | null;
  ip: string | null;
  flagged: boolean;
  lockReason: string | null;
  lockedAt: string | null;
  missed: boolean;
  contactId: number | null;
  contactStatus: ContactStatus | null;
  tags: string[];
  visitorId: number | null;
}

export interface MessageView {
  id: number;
  role: 'USER' | 'ASSISTANT' | 'ADMIN' | 'SYSTEM';
  content: string;
  payload: string | null;
  createdAt: string;
  authorUserId: number | null;
}

export interface PageViewItem {
  siteId: string;
  path: string;
  title: string | null;
  pageType: string | null;
  at: string;
}

export interface SearchItem {
  source: string;
  siteId: string;
  location: string | null;
  countryCode: string | null;
  startDate: string | null;
  endDate: string | null;
  minPersons: number | null;
  minCabins: number | null;
  vesselType: string | null;
  resultCount: number | null;
  at: string;
}

export interface ConversationDetail {
  row: ConversationRow;
  referrer: string | null;
  pageTrail: string | null;
  messages: MessageView[];
  history: PageViewItem[];
  searches: SearchItem[];
  firstResponseAt: string | null;
  firstResponseBy: string | null;
  takenOverAt: string | null;
  handoffRequestedAt: string | null;
  aiReturnedAt: string | null;
}

export interface LiveVisitor {
  visitKey: string;
  visitId: number;
  visitorKey: string;
  visitorId: number;
  siteId: string;
  currentPath: string | null;
  currentTitle: string | null;
  pageType: string | null;
  boatSlug: string | null;
  currentPageSince: string | null;
  visitStartedAt: string;
  lastBeatAt: string;
  returning: boolean;
  countryCode: string | null;
  ip: string | null;
  locale: string | null;
  deviceClass: string;
  browser: string | null;
  os: string | null;
  channel: string;
  fromSiteId: string | null;
  visible: boolean;
  pageCount: number;
  pendingProactive: number;
}

export interface LiveRow {
  visitor: LiveVisitor;
  chatSessionId: number | null;
  chatStatus: ChatSessionStatus | null;
  contactId: number | null;
  contactName: string | null;
  adminUnread: boolean;
}

export type ProactiveResult = 'QUEUED' | 'NOT_LIVE' | 'BOT' | 'QUEUE_FULL' | 'INVALID_TEXT';

export interface ContactRow {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: ContactStatus;
  tags: string[];
  conversations: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface SourceView {
  channel: string;
  siteId: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  fromSiteId: string | null;
  landingUrl: string | null;
  at: string;
}

export interface VisitItem {
  id: number;
  siteId: string;
  startedAt: string;
  pageCount: number;
  channel: string;
  countryCode: string | null;
}

export interface ContactCard {
  contact: ContactRow;
  note: string | null;
  emailVerified: boolean;
  firstSource: SourceView | null;
  lastSource: SourceView | null;
  visits: VisitItem[];
  conversations: ConversationRow[];
  searches: SearchItem[];
  boatsViewed: string[];
  possibleDuplicates: ContactRow[];
}

export interface ContactPatch {
  name?: string;
  email?: string;
  phone?: string;
  status?: ContactStatus;
  note?: string;
}

export interface Count {
  key: string;
  value: number;
}

export interface CcStats {
  from: string;
  to: string;
  siteId: string | null;
  chat: {
    started: number;
    startedByTeam: number;
    aiOnly: number;
    takenOver: number;
    missed: number;
    medianFirstResponseSeconds: number | null;
    contactsCollected: number;
  };
  visitors: {
    visits: number;
    visitors: number;
    newVisitors: number;
    returningVisitors: number;
    bySite: Count[];
    byChannel: Count[];
    byCountry: Count[];
    sisterToBoat4you: Count[];
  };
  searches: {
    total: number;
    topLocations: Count[];
    topCountries: Count[];
    byMonth: Count[];
    personsBuckets: Count[];
  };
}
