import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOLDERS, contentTypeFor, folderTitle, lessonFolder, parseFilename, parseFolder } from '../../../lib/lessonResources';

describe('lesson resources library', () => {
  it('knows the unit folder and twelve lesson folders', () => {
    assert.equal(FOLDERS.length, 13);
    assert.equal(lessonFolder(3), 'lesson-03');
    assert.equal(lessonFolder(12), 'lesson-12');
    assert.equal(parseFolder('lesson-07'), 'lesson-07');
    assert.equal(parseFolder('unit'), 'unit');
    assert.equal(parseFolder('lesson-13'), null);
    assert.equal(parseFolder('lesson-7'), null);
    assert.equal(parseFolder('../secrets'), null);
    assert.equal(folderTitle('lesson-01'), 'Lesson 1: Website Detectives');
    assert.equal(folderTitle('unit'), 'Whole unit');
  });

  it('accepts friendly file names and rejects anything that could escape the folder', () => {
    assert.equal(parseFilename('Lesson 03 - Teacher printables.pdf'), 'Lesson 03 - Teacher printables.pdf');
    assert.equal(parseFilename('  Student   Workbook (editable).pptx '), 'Student Workbook (editable).pptx');
    assert.equal(parseFilename('notes.txt'), null);
    assert.equal(parseFilename('../../etc/passwd.pdf'), null);
    assert.equal(parseFilename('a/b.pdf'), null);
    assert.equal(parseFilename('.hidden.pdf'), null);
    assert.equal(parseFilename('x'.repeat(130) + '.pdf'), null);
    assert.equal(parseFilename('bad\u0000name.pdf'), null);
    assert.equal(parseFilename(42), null);
  });

  it('maps extensions to content types', () => {
    assert.equal(contentTypeFor('Pages.PDF'), 'application/pdf');
    assert.equal(contentTypeFor('deck.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    assert.equal(contentTypeFor('mystery.bin'), 'application/octet-stream');
  });
});
