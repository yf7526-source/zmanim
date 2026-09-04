import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const contact = read('base44/functions/submitContactMessage/entry.ts');
expect(contact.includes('ContactMessage.create'), 'Contact form must persist the message before notification.');
expect(contact.includes("getConnection('gmail')"), 'Contact form must use the Gmail connector for notifications.');
expect(contact.includes('gmailNotificationSent'), 'Contact form must report Gmail notification status.');
expect(contact.indexOf('ContactMessage.create') < contact.indexOf('notification = await notifyConnectedGmail'), 'Contact record must be created before Gmail notification is attempted.');
expect(contact.includes('Reply-To:'), 'Contact Gmail notification should set Reply-To to the visitor email.');

const reply = read('base44/functions/sendEmailReply/entry.ts');
expect(reply.includes('requireAdmin'), 'Admin email replies must require admin authorization.');
expect(reply.includes('if (!profileRes.ok)'), 'Admin Gmail reply must validate Gmail profile HTTP status.');
expect(reply.includes('if (!res.ok)'), 'Admin Gmail reply must validate Gmail send HTTP status.');

for (const rel of ['src/components/SolarInfoPanel.jsx', 'src/components/moon/MoonChatPanel.jsx']) {
  const chat = read(rel);
  expect(chat.includes('requestIdRef'), `${rel} must ignore stale assistant responses.`);
  expect(chat.includes('cancelChatRequest'), `${rel} must expose UI cancellation.`);
  expect(chat.includes("if (requestId !== requestIdRef.current) return;"), `${rel} must reject late assistant results.`);
  expect(chat.includes('disabled={!input.trim()}'), `${rel} must disable empty sends.`);
  expect(chat.includes('temporarily unavailable'), `${rel} must show a clear AI-unavailable state.`);
}

if (failures.length) throw new Error(`Communication validation failed:\n${failures.join('\n')}`);
console.log('Communication validation passed: Contact→Gmail, admin reply, and Sun/Moon chat request ownership checked.');
