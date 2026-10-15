import test from 'node:test';
import assert from 'node:assert/strict';
import {transferItems,verifyCopy} from '../file-ops.js';
import {MockDirectory} from './mock-fs.mjs';

const load=async dir=>{const source=await dir.addFile('notes.md','# Hello');return {name:source.name,handle:source};};
const children=dir=>[...dir.children.keys()].sort();

test('copies a file, verifies bytes, leaves source unchanged',async()=>{
  const source=new MockDirectory('from'),dest=new MockDirectory('to'),item=await load(source);
  const progress=[];
  const result=await transferItems({items:[item],sourceDir:source,destinationDir:dest,mode:'copy',onProgress:x=>progress.push(x.phase)});
  assert.equal(result.copied,1);assert.equal(result.moved,0);assert.equal(result.failed.length,0);
  assert.deepEqual(children(source),['notes.md']);assert.deepEqual(children(dest),['notes.md']);
  assert.equal(await verifyCopy(item.handle,await dest.getFileHandle('notes.md')),true);
  assert(progress.includes('verifying-final'));
  assert(!children(dest).some(x=>x.startsWith('.fold-transfer-')));
});

test('same-folder copy chooses a unique name',async()=>{
  const dir=new MockDirectory('same'),item=await load(dir);
  const result=await transferItems({items:[item],sourceDir:dir,destinationDir:dir,mode:'copy'});
  assert.equal(result.copied,1);assert.deepEqual(children(dir),['notes (2).md','notes.md']);
});

test('move removes the source only after byte verification',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst'),item=await load(src);
  const result=await transferItems({items:[item],sourceDir:src,destinationDir:dst,mode:'move'});
  assert.equal(result.moved,1);assert.deepEqual(children(src),[]);
  assert.deepEqual(children(dst),['notes.md']);
});

test('rename within the same folder stages and verifies',async()=>{
  const dir=new MockDirectory('src'),item=await load(dir);
  const result=await transferItems({items:[item],sourceDir:dir,destinationDir:dir,mode:'move',renameTo:'renamed.md'});
  assert.equal(result.moved,1);assert.deepEqual(children(dir),['renamed.md']);
});

test('recursive directory copy preserves nested structure',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst');
  const folder=await src.addFolder('project');
  await folder.addFile('README.md','hello');
  const nested=await folder.addFolder('images');await nested.addFile('diagram.svg','<svg/>');
  const result=await transferItems({items:[{name:'project',handle:folder}],sourceDir:src,destinationDir:dst,mode:'copy'});
  assert.equal(result.copied,1);assert.equal(result.failed.length,0);
  assert.equal(await verifyCopy(folder,await dst.getDirectoryHandle('project')),true);
});

test('staging corruption is detected and source is retained',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst'),item=await load(src);
  dst.corruptWrites=true;
  const result=await transferItems({items:[item],sourceDir:src,destinationDir:dst,mode:'move'});
  assert.equal(result.moved,0);assert.equal(result.failed[0].code,'VERIFY_FAILED');
  assert.deepEqual(children(src),['notes.md']);
  assert.deepEqual(children(dst),[]);
});

test('moving a directory into its descendant is refused',async()=>{
  const src=new MockDirectory('src'),outer=await src.addFolder('outer');
  const nested=await outer.addFolder('nested');
  await outer.addFile('keep.txt','still here');
  const result=await transferItems({items:[{name:'outer',handle:outer}],sourceDir:src,destinationDir:nested,mode:'move'});
  assert.equal(result.moved,0);assert.equal(result.failed[0].code,'SELF_TRANSFER');
  assert.deepEqual(children(src),['outer']);
  assert.deepEqual(children(nested),[]);
});

test('failed deletion leaves both verified copies, with explicit report',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst'),item=await load(src);
  src.denyRemoval.add('notes.md');
  const result=await transferItems({items:[item],sourceDir:src,destinationDir:dst,mode:'move'});
  assert.equal(result.failed[0].code,'COPIED_NOT_REMOVED');
  assert.equal(result.outputs[0].retainedSource,true);
  assert.deepEqual(children(src),['notes.md']);
  assert.deepEqual(children(dst),['notes.md']);
});

test('existing explicit rename destination is never overwritten',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst'),item=await load(src);
  await dst.addFile('taken.md','protect me');
  const result=await transferItems({items:[item],sourceDir:src,destinationDir:dst,mode:'move',renameTo:'taken.md'});
  assert.equal(result.failed[0].code,'CONFLICT');
  assert.equal((await (await dst.getFileHandle('taken.md')).getFile()).size,10);
  assert.deepEqual(children(src),['notes.md']);
});

test('cancelled operation does not delete a source',async()=>{
  const src=new MockDirectory('src'),dst=new MockDirectory('dst'),item=await load(src);
  const controller=new AbortController();controller.abort();
  const result=await transferItems({items:[item],sourceDir:src,destinationDir:dst,mode:'move',signal:controller.signal});
  assert.equal(result.cancelled,true);assert.equal(result.moved,0);
  assert.deepEqual(children(src),['notes.md']);assert.deepEqual(children(dst),[]);
});
