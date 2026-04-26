import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.PHONE_ENC_KEY ?? '0'.repeat(64);
const KEY = Buffer.from(KEY_HEX, 'hex');

export function encryptPhone(plain: string): { enc: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const enc = Buffer.concat([encrypted, tag]).toString('base64');
  return { enc, iv: iv.toString('base64') };
}

export function decryptPhone(enc: string, iv: string): string {
  const ivBuf = Buffer.from(iv, 'base64');
  const data = Buffer.from(enc, 'base64');
  const tag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv(ALGORITHM, KEY, ivBuf);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
