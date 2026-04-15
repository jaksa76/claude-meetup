import { v4 as uuidv4 } from 'uuid';

export interface Issue {
  id: string;
  trackingCode: string;
  description: string;
  latitude: number;
  longitude: number;
  contactPhone?: string;
  photoPath?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  category?: string;
  createdAt: string;
}

// In-memory store (replaced by DB in a later story)
const store = new Map<string, Issue>();

function generateTrackingCode(): string {
  return uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
}

export interface CreateIssueInput {
  description: string;
  latitude: number;
  longitude: number;
  contactPhone?: string;
  photoPath?: string;
}

export function createIssue(input: CreateIssueInput): Issue {
  const issue: Issue = {
    id: uuidv4(),
    trackingCode: generateTrackingCode(),
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    contactPhone: input.contactPhone,
    photoPath: input.photoPath,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  store.set(issue.id, issue);
  return issue;
}

export function listOpenIssues(): Issue[] {
  return [...store.values()].filter(
    (i) => i.status !== 'resolved' && i.status !== 'rejected',
  );
}

export function listAllIssues(): Issue[] {
  return [...store.values()];
}

export function getIssueByTrackingCode(trackingCode: string): Issue | undefined {
  return [...store.values()].find((i) => i.trackingCode === trackingCode);
}

export function getIssueById(id: string): Issue | undefined {
  return store.get(id);
}

export function updateIssue(id: string, patch: Partial<Issue>): Issue | undefined {
  const issue = store.get(id);
  if (!issue) return undefined;
  const updated = { ...issue, ...patch };
  store.set(id, updated);
  return updated;
}

/** Exposed for tests */
export function _clearStore(): void {
  store.clear();
}
