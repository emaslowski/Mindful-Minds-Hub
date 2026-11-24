import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHttpUrl, parseCraft, parseCraftImage, serializeCraft, splitLines } from './crafts';

describe('splitLines', () => {
  it('drops blanks and list markers', () => {
    assert.deepEqual(splitLines('1. Paper\n\n- Glue\n* Scissors \n2) Tape'), ['Paper', 'Glue', 'Scissors', 'Tape']);
  });
});

describe('parseCraft', () => {
  it('requires a title when creating', () => {
    assert.deepEqual(parseCraft({}, false), { error: 'Give the craft a title.' });
    assert.deepEqual(parseCraft({}, true), { values: {} });
  });
  it('normalizes materials and steps from text or arrays', () => {
    const r = parseCraft({ title: ' Paper lantern ', materials: ['Paper', '', 'Glue'], steps: 'Fold\n\nCut' }, false);
    assert.deepEqual(r, { values: { title: 'Paper lantern', materials: 'Paper\nGlue', steps: 'Fold\nCut' } });
  });
  it('accepts only http(s) links and clears empty ones', () => {
    assert.deepEqual(parseCraft({ link: '' }, true), { values: { link: null } });
    assert.deepEqual(parseCraft({ link: null }, true), { values: { link: null } });
    assert.deepEqual(parseCraft({ link: 'https://youtu.be/x' }, true), { values: { link: 'https://youtu.be/x' } });
    assert.ok('error' in parseCraft({ link: 'javascript:alert(1)' }, true));
    assert.ok(!isSafeHttpUrl('ftp://a.b'));
  });
  it('rejects bad types', () => {
    assert.ok('error' in parseCraft({ title: 'x'.repeat(121) }, false));
    assert.ok('error' in parseCraft({ title: 'ok', published: 'yes' }, false));
  });
});

describe('parseCraftImage', () => {
  it('allows only common image types within the size limit', () => {
    assert.ok('error' in parseCraftImage({ contentType: 'image/svg+xml', size: 10 }));
    assert.ok('error' in parseCraftImage({ contentType: 'image/png', size: 11 * 1024 * 1024 }));
    assert.deepEqual(parseCraftImage({ filename: 'a.png', contentType: 'image/png', size: 10 }), { filename: 'a.png', contentType: 'image/png', size: 10 });
  });
});

describe('serializeCraft', () => {
  it('exposes the image only when it is verified', () => {
    const now = new Date('2026-11-24T12:00:00Z');
    const base = { id: 3, title: 'T', description: '', materials: 'a\nb', steps: '', link: null, published: true,
      imageObjectPath: '/objects/uploads/x', imageContentType: 'image/png', imageSize: 5, createdBy: null, createdAt: now, updatedAt: now };
    assert.equal(serializeCraft({ ...base, imageReady: false }).imageUrl, null);
    assert.equal(serializeCraft({ ...base, imageReady: true }).imageUrl, `/api/crafts/3/image?v=${now.getTime()}`);
    assert.deepEqual(serializeCraft({ ...base, imageReady: true }).materials, ['a', 'b']);
  });
});
