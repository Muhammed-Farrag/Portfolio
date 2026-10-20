import { describe, expect, it, vi } from 'vitest';
import { mailtoHref, plainText, postToService, resolveMode, validate, webmailLinks } from '../../src/features/contact/send';

const ok = { name: 'Sara', email: 'sara@example.com', message: 'Hello, I would like to talk about a project.' };

describe('contact form', () => {
  it('accepts a complete message and names each missing part', () => {
    expect(validate(ok)).toEqual({});
    const e = validate({ name: ' ', email: 'sara@', message: 'hi' });
    expect(Object.keys(e).sort()).toEqual(['email', 'message', 'name']);
  });

  it('writes the message into a mailto link, encoded', () => {
    const href = mailtoHref('mohamed.frage19@gmail.com', { ...ok, message: 'Hi & hello?\nSecond line' });
    expect(href.startsWith('mailto:mohamed.frage19@gmail.com?subject=Portfolio%20message%20from%20Sara&body=')).toBe(true);
    expect(decodeURIComponent(href.split('body=')[1]!)).toBe('Hi & hello?\nSecond line\n\nSara\nsara@example.com');
  });

  it('offers Gmail, Outlook.com and plain text for computers without a mail app', () => {
    const [gmail, outlook] = webmailLinks('mohamed.frage19@gmail.com', ok);
    expect(new URL(gmail!.href).searchParams.get('to')).toBe('mohamed.frage19@gmail.com');
    expect(new URL(gmail!.href).searchParams.get('su')).toBe('Portfolio message from Sara');
    expect(new URL(outlook!.href).searchParams.get('body')).toContain('sara@example.com');
    expect(plainText('mohamed.frage19@gmail.com', ok).startsWith('To: mohamed.frage19@gmail.com\nSubject: Portfolio message from Sara\n\n')).toBe(true);
  });

  it('uses the form service only when it has an endpoint', () => {
    expect(resolveMode(undefined, undefined)).toBe('mailto');
    expect(resolveMode('service', undefined)).toBe('mailto');
    expect(resolveMode('service', 'https://formspree.io/f/abc')).toBe('service');
    expect(resolveMode('mailto', 'https://formspree.io/f/abc')).toBe('mailto');
  });

  it('posts JSON to the service and fails loudly when it is refused', async () => {
    const fetchOk = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await postToService('https://formspree.io/f/abc', ok, fetchOk as unknown as typeof fetch);
    const [url, init] = fetchOk.mock.calls[0]!;
    expect(url).toBe('https://formspree.io/f/abc');
    expect(JSON.parse(init.body)).toMatchObject({ name: 'Sara', email: 'sara@example.com' });
    const fetchBad = vi.fn().mockResolvedValue({ ok: false, status: 422 });
    await expect(postToService('https://x', ok, fetchBad as unknown as typeof fetch)).rejects.toThrow('422');
  });
});
