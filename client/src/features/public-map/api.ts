export interface OpenIssue {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category?: string;
  createdAt: string;
}

export async function fetchOpenIssues(): Promise<OpenIssue[]> {
  const res = await fetch('/api/issues');
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json() as Promise<OpenIssue[]>;
}
