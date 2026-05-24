export interface PaperReport {
  id: string;
  createdAt: number;
  username: string;
  committee: string;
  country: string;
  topic: string;
  paperPreview: string;
  feedback: unknown;
}

export interface SessionReport {
  id: string;
  createdAt: number;
  username: string;
  committee: string;
  topic: string;
  userCountry: string;
  delegates: unknown[];
  userSpeechCount: number;
  durationMs: number;
  feedback: unknown;
  transcript: unknown[];
}

export interface BookingReport {
  id: string;
  createdAt: number;
  username: string;
  topic: string;
  coach: string;
  date: string;
  time: string;
  name: string;
  email: string;
  notes?: string;
}

interface Store {
  papers: PaperReport[];
  sessions: SessionReport[];
  bookings: BookingReport[];
}

declare global {
  // eslint-disable-next-line no-var
  var __realmunStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__realmunStore) {
    globalThis.__realmunStore = { papers: [], sessions: [], bookings: [] };
  }
  return globalThis.__realmunStore;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function recordPaper(
  data: Omit<PaperReport, "id" | "createdAt">
): PaperReport {
  const record: PaperReport = { id: newId(), createdAt: Date.now(), ...data };
  getStore().papers.unshift(record);
  return record;
}

export function recordSession(
  data: Omit<SessionReport, "id" | "createdAt">
): SessionReport {
  const record: SessionReport = { id: newId(), createdAt: Date.now(), ...data };
  getStore().sessions.unshift(record);
  return record;
}

export function recordBooking(
  data: Omit<BookingReport, "id" | "createdAt">
): BookingReport {
  const record: BookingReport = { id: newId(), createdAt: Date.now(), ...data };
  getStore().bookings.unshift(record);
  return record;
}

export function listPapers(): PaperReport[] {
  return getStore().papers;
}

export function listSessions(): SessionReport[] {
  return getStore().sessions;
}

export function listBookings(): BookingReport[] {
  return getStore().bookings;
}

export function getPaper(id: string): PaperReport | undefined {
  return getStore().papers.find((p) => p.id === id);
}

export function getSessionReport(id: string): SessionReport | undefined {
  return getStore().sessions.find((s) => s.id === id);
}

export function counts(): { papers: number; sessions: number; bookings: number } {
  const s = getStore();
  return {
    papers: s.papers.length,
    sessions: s.sessions.length,
    bookings: s.bookings.length,
  };
}
