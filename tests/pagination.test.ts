import {test} from 'node:test';
import assert from 'node:assert/strict';
import {completeWordBoundary,paginate} from '../lib/pagination';
test('long wide text moves to another leaf without losing characters',()=>{const text='W'.repeat(310);const pages=paginate(text,'memory');assert.ok(pages.length>1);assert.equal(pages.join('\n').replace(/-\n/g,'').replace(/\n/g,''),text);});
test('ordinary 300-character prose can fit a single leaf',()=>{const text=('The quiet hours have a peculiar honesty. There is time enough to listen. ').repeat(5).slice(0,310);assert.equal(paginate(text,'memory').length,1);});
test('ordinary words move intact to the next line',()=>{assert.deepEqual(paginate('the reach out world acquaintance','memory',120),['the reach\nout world\nacquaintance']);});
test('only a word wider than a full line is hyphenated',()=>{const pages=paginate('acquaintance','memory',80);assert.match(pages[0],/-\n/);assert.equal(pages.join('\n').replace(/-\n/g,'').replace(/\n/g,''),'acquaintance');});
test('streaming waits for a word or punctuation boundary',()=>{assert.equal(completeWordBoundary('reach'),0);assert.equal(completeWordBoundary('reach out'),6);assert.equal(completeWordBoundary('Hello,world'),6);});
