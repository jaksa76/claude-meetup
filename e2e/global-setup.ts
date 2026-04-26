import { request } from '@playwright/test';

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://localhost:3001' });
  await api.post('/api/test/reset');
  await api.dispose();
}
