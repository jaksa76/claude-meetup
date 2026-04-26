import { encryptPhone, decryptPhone } from './crypto.js';

describe('encryptPhone / decryptPhone', () => {
  it('round-trips a phone number correctly', () => {
    const plain = '+382 67 123 456';
    const { enc, iv } = encryptPhone(plain);
    expect(decryptPhone(enc, iv)).toBe(plain);
  });

  it('produces different ciphertext for the same input each time (random IV)', () => {
    const plain = '+382 67 000 000';
    const first = encryptPhone(plain);
    const second = encryptPhone(plain);
    expect(first.enc).not.toBe(second.enc);
    expect(first.iv).not.toBe(second.iv);
  });

  it('ciphertext does not contain the plaintext', () => {
    const plain = '+382 67 999 999';
    const { enc } = encryptPhone(plain);
    expect(enc).not.toContain(plain);
    expect(Buffer.from(enc, 'base64').toString()).not.toContain(plain);
  });
});
