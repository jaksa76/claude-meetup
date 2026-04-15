export interface SmsAdapter {
  send(to: string, body: string): Promise<void>;
}
