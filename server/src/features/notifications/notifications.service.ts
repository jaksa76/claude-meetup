import { SmsAdapter } from './adapters/sms.adapter.js';

let adapter: SmsAdapter | null = null;

export function setAdapter(a: SmsAdapter): void {
  adapter = a;
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!adapter) {
    console.warn('[notifications] No SMS adapter configured — skipping SMS to', to);
    return;
  }
  await adapter.send(to, body);
}
