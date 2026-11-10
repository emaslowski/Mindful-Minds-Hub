import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendCredentialEmail } from './credentialEmail';

const message = {
  to: 'student@example.test',
  subject: 'Private access details',
  text: 'Access code: TEST-CODE\nPassword: test-only-password',
  html: '<p>Access code: TEST-CODE</p>',
};
const sender = 'teacher@example.test';

test('sends valid MIME through the school Gmail account', async () => {
  const calls: Array<{ path: string; options: any }> = [];
  const id = await sendCredentialEmail(message, {
    sender,
    gmail: {
      async request(path, options) {
        calls.push({ path, options });
        if (path.endsWith('/profile')) {
          return Response.json({ emailAddress: sender });
        }
        const raw = (options.body as { raw: string }).raw;
        assert.match(raw, /^[A-Za-z0-9_-]+$/);
        const mime = Buffer.from(raw, 'base64url').toString('utf8');
        assert.match(mime, /From: The Brightside Wellness Project LLC <teacher@example.test>/);
        assert.match(mime, /To: student@example.test/);
        assert.match(mime, /multipart\/alternative/);
        assert.match(mime, /test-only-password/);
        return Response.json({ id: 'accepted-message' });
      },
    },
  });
  assert.equal(id, 'accepted-message');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].path, '/gmail/v1/users/me/messages/send');
  assert.equal(calls[1].options.method, 'POST');
});

test('missing configuration fails without calling Gmail', async () => {
  await assert.rejects(sendCredentialEmail(message, {
    gmail: { async request() { throw new Error('Must not call Gmail'); } },
  }), /not configured/);
  await assert.rejects(sendCredentialEmail(message, { sender, gmail: null }), /not configured/);
});

test('a different Gmail account cannot send student credentials', async () => {
  let calls = 0;
  await assert.rejects(sendCredentialEmail(message, {
    sender,
    gmail: {
      async request() {
        calls++;
        return Response.json({ emailAddress: 'other@example.test' });
      },
    },
  }), /does not match/);
  assert.equal(calls, 1);
});

test('authorization failures are explicit and do not send', async () => {
  await assert.rejects(sendCredentialEmail(message, {
    sender,
    gmail: { async request() { return new Response(null, { status: 403 }); } },
  }), /authorization check failed \(HTTP 403\)/);
});

test('rejected or unconfirmed sends fail without retries or SMTP fallback', async () => {
  for (const status of [403, 429, 500, 200]) {
    let calls = 0;
    await assert.rejects(sendCredentialEmail(message, {
      sender,
      gmail: {
        async request() {
          calls++;
          return calls === 1
            ? Response.json({ emailAddress: sender })
            : Response.json({}, { status });
        },
      },
    }), status === 200 ? /no confirmation/ : new RegExp(`HTTP ${status}`));
    assert.equal(calls, 2);
  }
});
