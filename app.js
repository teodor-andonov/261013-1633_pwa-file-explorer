
/* Fold — Chromium/Edge local file explorer. No external services or dependencies. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICON = {
folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
file:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m21 15-5-5L5 21"/>',
back:'<path d="m15 18-6-6 6-6"/>',forward:'<path d="m9 18 6-6-6-6"/>',up:'<path d="m6 14 6-6 6 6"/>',
refresh:'<path d="M20 11A8 8 0 0 0 6 6L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5"/>',
preview:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14 4v16"/>',
more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4-4"/>',
upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 17v3h16v-3"/>',
plus:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v3M3 11v7h9m6-4v8m-4-4h8"/>',
moon:'<path d="M20 13A9 9 0 1 1 11 4a7 7 0 0 0 9 9z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
trash:'<path d="M3 6h18m-2 0-1 14H6L5 6m4 0V4h6v2"/>'
};
const svg = n => '<svg viewBox="0 0 24 24" aria-hidden="true">'+(ICON[n]||ICON.file)+'</svg>';
const fmtSize = n => n==null?'—':n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':n<1073741824?(n/1048576).toFixed(1)+' MB':(n/1073741824).toFixed(2)+' GB';
const fmtDate = n => n?new Date(n).toLocaleDateString():'—';
const extension = n => (n.lastIndexOf('.')>0?n.slice(n.lastIndexOf('.')+1):'').toLowerCase();
const imageExt = new Set(['png','jpg','jpeg','webp','gif','bmp','avif','svg']);
const textExt = new Set(['txt','md','json','js','mjs','cjs','ts','tsx','jsx','css','html','htm','xml','csv','yaml','yml','toml','py','go','rs','sh','bat','log','ini','conf']);
const badName = n => !n || /[<>:"/\\|?*\x00-\x1F]/.test(n) || /[. ]$/.test(n) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i.test(n);
const S = {roots:[],activeId:null,dir:null,entries:[],visible:[],selection:new Set(),anchor:0,clipboard:null,query:'',sort:'name',descending:false,previewOpen:false,previewURL:null,seq:0,busy:false};
const root = () => S.roots.find(x=>x.id===S.activeId);
const selected = () => S.entries.filter(e=>S.selection.has(e.name));
const chosen = () => selected()[0];
let db;
function store(){return db||(db=new Promise((resolve,reject)=>{const q=indexedDB.open('fold-store',1);q.onupgradeneeded=()=>q.result.createObjectStore('settings');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);}));}
async function getSaved(key){try{const d=await store();return await new Promise(r=>{const q=d.transaction('settings').objectStore('settings').get(key);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null);});}catch{return null;}}
async function save(key,val){try{const d=await store();await new Promise((r,j)=>{const q=d.transaction('settings','readwrite').objectStore('settings').put(val,key);q.onsuccess=r;q.onerror=j;});}catch(e){console.warn('Fold preferences',e);}}
function persist(){void save('roots',S.roots);void save('active',S.activeId);}
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),3200);}
function theme(v){document.documentElement.dataset.theme=v;localStorage.setItem('fold-theme',v);$('theme-button').innerHTML=svg(v==='dark'?'sun':'moon')+'<span>'+(v==='dark'?'Light appearance':'Dark appearance')+'</span>';document.querySelector('meta[name="theme-color"]').content=v==='dark'?'#17191b':'#f7f7f5';}
function modal(opts){return new Promise(resolve=>{
const box=$('modal-root');
box.innerHTML='<div class="modal-backdrop"><form class="modal"><h2>'+esc(opts.title)+'</h2>'+(opts.description?'<p>'+esc(opts.description)+'</p>':'')+(opts.value!==undefined?'<input type="text" id="modal-value" required autocomplete="off">':'')+'<div class="modal-buttons"><button type="button" id="modal-cancel">Cancel</button><button type="submit" class="'+(opts.danger?'danger':'primary')+'">'+esc(opts.confirm||'OK')+'</button></div></form></div>';
const field=$('modal-value');if(field){field.value=opts.value;field.focus();field.select();}else box.querySelector('[type=submit]').focus();
const close=v=>{document.removeEventListener('keydown',escapeModal,true);box.replaceChildren();resolve(v);};
const escapeModal=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(null);}};
document.addEventListener('keydown',escapeModal,true);
$('modal-cancel').onclick=()=>close(null);
box.querySelector('form').onsubmit=e=>{e.preventDefault();close(field?field.value:true);};
box.querySelector('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget)close(null);};
});}
function error(e){console.error(e);toast(e&&e.message?e.message:'Operation failed');}
async function permission(handle,request){try{if(!handle.queryPermission)return true;let p=await handle.queryPermission({mode:'readwrite'});if(p!=='granted'&&request)p=await handle.requestPermission({mode:'readwrite'});return p==='granted';}catch{return false;}}
function renderRoots(){
$('roots').innerHTML=S.roots.map(r=>'<div class="root-tab'+(r.id===S.activeId?' active':'')+'" role="button" tabindex="0" data-root="'+r.id+'">'+svg('folder')+'<span class="tab-label">'+esc(r.name)+'</span><button class="tab-close" data-close="'+r.id+'" title="Close folder tab">×</button></div>').join('');
}
async function addRoot(){if(!window.showDirectoryPicker){toast('Use current Chrome or Edge over HTTPS.');return;}
try{const handle=await window.showDirectoryPicker({mode:'readwrite',id:'fold-folders'});for(const r of S.roots){if(await r.handle.isSameEntry(handle)){await switchRoot(r.id,true);return;}}
const r={id:crypto.randomUUID(),name:handle.name,handle,path:[],history:[[]],pos:0};S.roots.push(r);S.activeId=r.id;persist();renderRoots();await load(true);
}catch(e){if(e.name!=='AbortError')error(e);}}
async function switchRoot(id,request){S.activeId=id;persist();renderRoots();await load(request);}
async function closeRoot(id){S.roots=S.roots.filter(x=>x.id!==id);if(S.activeId===id)S.activeId=S.roots[0]?.id||null;persist();renderRoots();await load(false);}
async function directory(r){let h=r.handle;for(const name of r.path)h=await h.getDirectoryHandle(name);return h;}
function go(path){const r=root();if(!r)return;if(JSON.stringify(r.path)===JSON.stringify(path))return;r.history=r.history.slice(0,r.pos+1);r.history.push([...path]);r.pos++;r.path=[...path];persist();void load(false);}
function step(delta){const r=root();if(!r||r.pos+delta<0||r.pos+delta>=r.history.length)return;r.pos+=delta;r.path=[...r.history[r.pos]];persist();void load(false);}
function toolbar(){
const r=root();
$('breadcrumbs').innerHTML=r?['<button class="crumb" data-crumb="0">'+esc(r.name)+'</button>'].concat(r.path.map((p,i)=>'<span class="crumb-separator">›</span><button class="crumb" data-crumb="'+(i+1)+'">'+esc(p)+'</button>')).join(''):'';
$('folder-title').textContent=r?(r.path.at(-1)||r.name):'Files';
$('status-left').textContent=S.selection.size?S.selection.size+' selected':r?S.visible.length+' items':'Local files only · nothing uploaded';
$('status-right').textContent=S.clipboard?(S.clipboard.items.length+' '+(S.clipboard.cut?'cut':'copied')+' · Ctrl+V to paste'):'Ctrl+Shift+N · new folder';
$('file-count').textContent='';
$('preview-toggle').classList.toggle('pressed',S.previewOpen);
$('preview').classList.toggle('open',S.previewOpen);
document.querySelector('[data-action=back]').disabled=!r||r.pos===0;
document.querySelector('[data-action=forward]').disabled=!r||r.pos===r.history.length-1;
document.querySelector('[data-action=up]').disabled=!r||!r.path.length;
}
async function load(request){
const seq=++S.seq;S.selection.clear();S.query='';$('search').value='';S.entries=[];S.visible=[];S.dir=null;releasePreview();$('preview-content').textContent='';
const r=root();renderRoots();toolbar();$('file-scroller').scrollTop=0;
if(!r){$('file-rows').innerHTML='<div class="empty"><div class="empty-title">Your files, without the noise.</div><div class="empty-sub">Add a local folder with the + button. Each folder becomes a sidebar tab. Files never leave this computer.</div></div>';return;}
$('file-rows').innerHTML='<div class="placeholder">Opening '+esc(r.name)+'…</div>';
try{
if(!await permission(r.handle,request)){$('file-rows').innerHTML='<div class="empty"><div class="empty-title">Folder access needed</div><div class="empty-sub">Re-authorize the folder to browse and edit it.<p><button class="quiet-button" data-action="grant">Grant access</button></p></div></div>';return;}
const d=await directory(r);const entries=[];for await(const [name,handle] of d.entries()){entries.push({name,handle,kind:handle.kind,meta:null});}
if(seq!==S.seq)return;S.dir=d;S.entries=entries;filter();
}catch(e){if(seq!==S.seq)return;error(e);$('file-rows').innerHTML='<div class="empty"><div class="empty-title">Could not open this folder</div><div class="empty-sub">'+esc(e.message)+'</div></div>';}
}
function filter(reset=true){
const q=S.query.trim().toLocaleLowerCase();S.visible=S.entries.filter(e=>e.name.toLocaleLowerCase().includes(q));
S.visible.sort((a,b)=>{if(a.kind!==b.kind)return a.kind==='directory'?-1:1;
let n=0;if(S.sort==='type')n=extension(a.name).localeCompare(extension(b.name));
if(S.sort==='size')n=(a.meta?.size??-1)-(b.meta?.size??-1);
if(S.sort==='modified')n=(a.meta?.modified??-1)-(b.meta?.modified??-1);
if(!n)n=a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});
return S.descending?-n:n;});
if(reset)$('file-scroller').scrollTop=0;draw();toolbar();
}
let drawing=false;
function schedule(){if(drawing)return;drawing=true;requestAnimationFrame(()=>{drawing=false;draw();});}
function draw(){
if(!S.dir)return;
const list=$('file-scroller');const height=list.clientHeight||500;const top=Math.max(0,Math.floor(list.scrollTop/40)-12),end=Math.min(S.visible.length,Math.ceil((list.scrollTop+height)/40)+12);
let html='<div style="height:'+(top*40)+'px"></div>';
for(let i=top;i<end;i++){
const e=S.visible[i];const icon=e.kind==='directory'?'folder':imageExt.has(extension(e.name))?'image':'file';
html+='<div class="file-row'+(S.selection.has(e.name)?' selected':'')+'" data-row="'+i+'" role="row"><div class="row-name"><span class="row-icon">'+svg(icon)+'</span><span title="'+esc(e.name)+'">'+esc(e.name)+'</span></div><span class="row-type">'+(e.kind==='directory'?'Folder':(extension(e.name).toUpperCase()||'File'))+'</span><span class="row-size">'+(e.kind==='directory'?'—':fmtSize(e.meta?.size))+'</span><span class="row-modified">'+fmtDate(e.meta?.modified)+'</span></div>';
}
html+='<div style="height:'+((S.visible.length-end)*40)+'px"></div>';
if(!S.visible.length)html='<div class="empty">'+(S.query?'No matching items.':'This folder is empty.')+'</div>';
$('file-rows').innerHTML=html;
}
function pick(i,opts){
const e=S.visible[i];if(!e)return;
if(opts.shift){if(!opts.ctrl)S.selection.clear();for(let j=Math.min(S.anchor,i);j<=Math.max(S.anchor,i);j++)S.selection.add(S.visible[j].name);}
else if(opts.ctrl){if(S.selection.has(e.name))S.selection.delete(e.name);else S.selection.add(e.name);S.anchor=i;}
else{S.selection=new Set([e.name]);S.anchor=i;}
schedule();toolbar();if(S.previewOpen)void preview();
}
async function openItem(i){const e=S.visible[i];if(!e)return;if(e.kind==='directory'){const r=root();go([...r.path,e.name]);}else{S.selection=new Set([e.name]);S.previewOpen=true;toolbar();draw();await preview();}}
function releasePreview(){if(S.previewURL){URL.revokeObjectURL(S.previewURL);S.previewURL=null;}}
async function preview(){
const e=chosen();const host=$('preview-content');releasePreview();
if(!S.previewOpen||!e){host.innerHTML='<div class="preview-sub">Select a file to preview</div>';return;}
host.innerHTML='<div class="preview-title">'+esc(e.name)+'</div><div class="preview-sub">Loading…</div>';
if(e.kind==='directory'){host.innerHTML='<div class="preview-title">'+esc(e.name)+'</div><div class="preview-sub">Folder</div>';return;}
const current=e.name,curRoot=S.activeId,curPath=JSON.stringify(root()?.path);
try{
const f=await e.handle.getFile();if(!S.previewOpen||chosen()?.name!==current||S.activeId!==curRoot||JSON.stringify(root()?.path)!==curPath)return;
e.meta={size:f.size,modified:f.lastModified};draw();
let media='',x=extension(e.name);
if(imageExt.has(x)){S.previewURL=URL.createObjectURL(f);media='<img alt="Preview" src="'+S.previewURL+'">';}
else if(f.type.startsWith('audio/')){S.previewURL=URL.createObjectURL(f);media='<audio controls src="'+S.previewURL+'"></audio>';}
else if(f.type.startsWith('video/')){S.previewURL=URL.createObjectURL(f);media='<video controls src="'+S.previewURL+'"></video>';}
else if(x==='pdf'){S.previewURL=URL.createObjectURL(f);media='<iframe title="PDF preview" style="height:65vh" src="'+S.previewURL+'"></iframe>';}
else if((textExt.has(x)||f.type.startsWith('text/'))&&f.size<2097152){media='<textarea id="preview-editor" spellcheck="false"></textarea><button class="quiet-button" data-action="save-text">Save changes · Ctrl+S</button>';}
else{media='<p class="preview-sub">No in-app preview for this file type.</p><button class="quiet-button" data-action="download">Save a copy</button>';}
host.innerHTML='<div class="preview-title">'+esc(e.name)+'</div><div class="preview-sub">'+fmtSize(f.size)+' · '+fmtDate(f.lastModified)+'</div><div style="height:16px"></div>'+media;
if($('preview-editor'))$('preview-editor').value=await f.text();
}catch(ex){host.innerHTML='<div class="preview-title">'+esc(e.name)+'</div><p class="preview-sub">'+esc(ex.message)+'</p>';}
}
async function saveText(){const e=chosen(),input=$('preview-editor');if(!e||!input)return;try{const writable=await e.handle.createWritable();await writable.write(input.value);await writable.close();toast('Saved '+e.name);await refresh(true);}catch(e){error(e);}}
async function refresh(keep){const saved=keep?[...S.selection]:[];await load(false);S.selection=new Set(saved.filter(n=>S.entries.some(e=>e.name===n)));draw();toolbar();}
async function createNew(type){
if(!S.dir)return;const name=(await modal({title:type==='directory'?'New folder':'New file',value:type==='directory'?'Untitled folder':'Untitled.txt',confirm:'Create'}))?.trim();
if(!name)return;if(badName(name)){toast('Invalid Windows filename');return;}
try{if(type==='directory')await S.dir.getDirectoryHandle(name,{create:true});else await S.dir.getFileHandle(name,{create:true});await refresh(false);toast('Created '+name);}catch(e){error(e);}
}
async function copyEntry(src,dest,name){
if(src.kind==='file'){const input=await src.getFile(),target=await dest.getFileHandle(name,{create:true});const out=await target.createWritable();try{await out.write(input);await out.close();}catch(e){await out.abort().catch(()=>{});throw e;}return;}
const folder=await dest.getDirectoryHandle(name,{create:true});
for await(const [childName,child] of src.entries())await copyEntry(child,folder,childName);
}
async function availableName(d,n){let t=n,at=n.lastIndexOf('.'),stem=at>0?n.slice(0,at):n,ext=at>0?n.slice(at):'';let i=2;
while(true){try{await d.getFileHandle(t); }catch(e){if(e.name==='NotFoundError'){try{await d.getDirectoryHandle(t);}catch(x){if(x.name==='NotFoundError')return t;throw x;}}else if(e.name!=='TypeMismatchError')throw e;}t=stem+' ('+(i++)+')'+ext;}
}
async function rename(){
const items=selected();if(items.length!==1||!S.dir)return;
const e=items[0],next=(await modal({title:'Rename',value:e.name,confirm:'Rename',description:'Folder renaming may copy and then delete the original.'}))?.trim();
if(!next||next===e.name)return;if(badName(next)){toast('Invalid Windows filename');return;}
try{if(await availableName(S.dir,next)!==next){toast('That name already exists');return;}
if(typeof e.handle.move==='function'){try{await e.handle.move(next);await refresh(false);S.selection.add(next);draw();toolbar();return;}catch(x){if(!['NotSupportedError','NotAllowedError','InvalidModificationError'].includes(x.name))throw x;}}
await copyEntry(e.handle,S.dir,next);await S.dir.removeEntry(e.name,{recursive:e.kind==='directory'});await refresh(false);S.selection.add(next);draw();toolbar();toast('Renamed');}catch(x){error(x);}
}
function clip(cut){if(!S.dir)return;const items=selected();if(!items.length)return;S.clipboard={items:items.map(e=>({name:e.name,handle:e.handle,parent:S.dir,rootId:S.activeId,path:[...root().path]})),cut};toast(items.length+(cut?' cut':' copied'));toolbar();}
async function paste(){
if(!S.dir||!S.clipboard)return;let ok=0,failed=[];
for(const item of S.clipboard.items){try{
if(item.cut&&await item.parent.isSameEntry(S.dir))continue;
if(item.handle.kind==='directory'&&item.rootId===S.activeId){
const path=root().path,origin=[...item.path,item.name];
if(origin.every((x,i)=>path[i]===x))throw Error('Cannot paste a folder inside itself');
}
if(await item.handle.isSameEntry(S.dir))throw Error('Cannot paste inside itself');
const n=await availableName(S.dir,item.name);await copyEntry(item.handle,S.dir,n);
if(S.clipboard.cut)await item.parent.removeEntry(item.name,{recursive:item.handle.kind==='directory'});ok++;
}catch(e){failed.push(item.name+': '+e.message);}}
if(S.clipboard.cut&&!failed.length)S.clipboard=null;await refresh(false);toast(failed.length?ok+' pasted, '+failed.length+' failed: '+failed[0]:ok+' pasted');
}
async function remove(){
const items=selected();if(!items.length||!S.dir)return;
const yes=await modal({title:'Permanently delete '+items.length+' item'+(items.length!==1?'s':'')+'?',description:items.slice(0,4).map(e=>e.name).join(', ')+'\nThese files will NOT go to the Windows Recycle Bin. This cannot be undone.',confirm:'Delete permanently',danger:true});if(!yes)return;
let fail=0;for(const e of items){try{await S.dir.removeEntry(e.name,{recursive:e.kind==='directory'});}catch(x){fail++;console.error(x);}}
await refresh(false);toast(fail?fail+' could not be deleted':'Permanently deleted');}
async function importFiles(files){
if(!S.dir)return;let fail=0,success=0;
for(const file of files){try{const name=await availableName(S.dir,file.name),handle=await S.dir.getFileHandle(name,{create:true}),out=await handle.createWritable();await out.write(file);await out.close();success++;}catch(x){console.error(x);fail++;}}
await refresh(false);toast(success+' imported'+(fail?' · '+fail+' failed':''));
}
async function importHandles(handles){if(!S.dir)return;let success=0,fail=0;for(const h of handles){try{const name=await availableName(S.dir,h.name);await copyEntry(h,S.dir,name);success++;}catch(e){console.error(e);fail++;}}await refresh(false);toast(success+' imported'+(fail?' · '+fail+' failed':''));}
async function download(){const e=chosen();if(!e||e.kind!=='file')return;try{const f=await e.handle.getFile(),url=URL.createObjectURL(f),a=document.createElement('a');a.href=url;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(x){error(x);}}
const filesMenu=[['Open / preview','open','Enter'],['Rename','rename','F2'],['Copy','copy','Ctrl+C'],['Cut','cut','Ctrl+X'],['Paste','paste','Ctrl+V'],['Save a copy','download',''],['Delete permanently','delete','Del']];
const blankMenu=[['New folder','new-folder','Ctrl+Shift+N'],['New file','new-file',''],['Import files','import',''],['Paste','paste','Ctrl+V'],['Refresh','refresh','F5']];
function menu(items,x,y){
const c=$('context');
c.innerHTML=items.map(item=>'<button class="menu-item'+(item[1]==='delete'?' danger':'')+'" data-menu="'+item[1]+'"><span>'+esc(item[0])+'</span><kbd>'+esc(item[2])+'</kbd></button>').join('');
c.hidden=false;const rect=c.getBoundingClientRect();c.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';c.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';
}
async function action(a){
$('context').hidden=true;
switch(a){
case 'add-root':return addRoot();
case 'grant':return load(true);
case 'back':return step(-1);
case 'forward':return step(1);
case 'up':if(root()?.path.length)go(root().path.slice(0,-1));return;
case 'refresh':return refresh(true);
case 'theme':return theme(document.documentElement.dataset.theme==='dark'?'light':'dark');
case 'new-folder':return createNew('directory');
case 'new-file':return createNew('file');
case 'rename':return rename();
case 'copy':return clip(false);
case 'cut':return clip(true);
case 'paste':return paste();
case 'delete':return remove();
case 'import':return $('upload-input').click();
case 'download':return download();
case 'save-text':return saveText();
case 'toggle-preview':S.previewOpen=!S.previewOpen;toolbar();return preview();
case 'close-preview':S.previewOpen=false;releasePreview();toolbar();return;
case 'open':{const e=chosen();if(e){const i=S.visible.findIndex(x=>x.name===e.name);return openItem(i);}return;}
case 'more':{const r=$('more-button').getBoundingClientRect();return menu(blankMenu.concat([['Select all','select-all','Ctrl+A']]),r.left,r.bottom+8);}
case 'select-all':S.selection=new Set(S.visible.map(e=>e.name));draw();toolbar();return;
case 'shortcuts':return modal({title:'Keyboard shortcuts',description:'Enter · Open or preview\nSpace · Preview panel\nF2 · Rename\nDelete · Permanently delete\nCtrl+C / Ctrl+X / Ctrl+V · Copy, cut, paste in Fold\nCtrl+A · Select all\nCtrl+Shift+N · New folder\nAlt+← / → / ↑ · Navigate\n/ · Filter\nF5 · Refresh',confirm:'Close'});
}
}
function events(){
document.addEventListener('click',e=>{
const item=e.target.closest('[data-menu]');if(item){void action(item.dataset.menu);return;}
if(!e.target.closest('#context'))$('context').hidden=true;
const close=e.target.closest('[data-close]');if(close){e.stopPropagation();void closeRoot(close.dataset.close);return;}
const tab=e.target.closest('[data-root]');if(tab){void switchRoot(tab.dataset.root,true);return;}
const crumb=e.target.closest('[data-crumb]');if(crumb){go(root().path.slice(0,+crumb.dataset.crumb));return;}
const cmd=e.target.closest('[data-action]');if(cmd){void action(cmd.dataset.action);return;}
const row=e.target.closest('[data-row]');if(row){pick(+row.dataset.row,{ctrl:e.ctrlKey||e.metaKey,shift:e.shiftKey});return;}
if(e.target.closest('#file-scroller')){S.selection.clear();draw();toolbar();}
});
$('file-scroller').addEventListener('dblclick',e=>{const row=e.target.closest('[data-row]');if(row)void openItem(+row.dataset.row);});
document.addEventListener('contextmenu',e=>{
const row=e.target.closest('[data-row]');if(row){e.preventDefault();const idx=+row.dataset.row;if(!S.selection.has(S.visible[idx].name))pick(idx,{});menu(filesMenu,e.clientX,e.clientY);return;}
if(e.target.closest('#files-area')&&S.dir){e.preventDefault();menu(blankMenu,e.clientX,e.clientY);}
});
$('file-scroller').addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule);
$('search').addEventListener('input',e=>{S.query=e.target.value;filter();});
document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',async()=>{
const sort=b.dataset.sort;if(sort===S.sort)S.descending=!S.descending;else{S.sort=sort;S.descending=false;}
if(sort==='size'||sort==='modified'){
const pending=S.entries.filter(x=>x.kind==='file'&&!x.meta);
await Promise.all(pending.map(async e=>{try{const f=await e.handle.getFile();e.meta={size:f.size,modified:f.lastModified};}catch{}}));
}
filter(false);
}));
$('upload-input').addEventListener('change',async e=>{await importFiles([...e.target.files]);e.target.value='';});
document.addEventListener('keydown',e=>{
if($('modal-root').children.length)return;
const target=e.target,editing=target.closest('input,textarea,[contenteditable]');
const key=e.key.toLowerCase();
if(editing){if(e.ctrlKey&&key==='s'&&target.id==='preview-editor'){e.preventDefault();void saveText();}return;}
if(key==='/'&&!e.ctrlKey){e.preventDefault();$('search').focus();return;}
if(e.key==='Escape'){$('context').hidden=true;S.selection.clear();draw();toolbar();return;}
if(!root())return;
const command=e.ctrlKey&&e.shiftKey&&key==='n'?'new-folder':
e.ctrlKey&&key==='a'?'select-all':
e.ctrlKey&&key==='c'?'copy':
e.ctrlKey&&key==='x'?'cut':
e.ctrlKey&&key==='v'?'paste':
e.altKey&&e.key==='ArrowLeft'?'back':
e.altKey&&e.key==='ArrowRight'?'forward':
e.altKey&&e.key==='ArrowUp'?'up':
e.key==='F5'?'refresh':
e.key==='F2'?'rename':
e.key==='Delete'?'delete':
e.key==='Enter'?'open':
e.code==='Space'?'toggle-preview':null;
if(command){e.preventDefault();void action(command);return;}
if(e.key==='ArrowDown'||e.key==='ArrowUp'){
e.preventDefault();const current=S.visible.findIndex(x=>S.selection.has(x.name));const n=Math.max(0,Math.min(S.visible.length-1,current+(e.key==='ArrowDown'?1:-1)));if(n>=0&&S.visible.length){pick(n,{shift:e.shiftKey});const scroll=$('file-scroller');if(n*40<scroll.scrollTop)scroll.scrollTop=n*40;else if(n*40+40>scroll.scrollTop+scroll.clientHeight)scroll.scrollTop=n*40+40-scroll.clientHeight;}
}
});
let dragDepth=0;const area=$('files-area');
area.addEventListener('dragenter',e=>{if(!S.dir)return;e.preventDefault();dragDepth++;area.classList.add('drag-over');});
area.addEventListener('dragover',e=>{if(!S.dir)return;e.preventDefault();e.dataTransfer.dropEffect='copy';});
area.addEventListener('dragleave',()=>{dragDepth=Math.max(0,dragDepth-1);if(!dragDepth)area.classList.remove('drag-over');});
area.addEventListener('drop',async e=>{if(!S.dir)return;e.preventDefault();dragDepth=0;area.classList.remove('drag-over');const items=[...e.dataTransfer.items];const handles=await Promise.all(items.filter(x=>x.kind==='file'&&x.getAsFileSystemHandle).map(x=>x.getAsFileSystemHandle().catch(()=>null)));if(handles.some(Boolean))await importHandles(handles.filter(Boolean));else await importFiles([...e.dataTransfer.files]);});
$('roots').addEventListener('keydown',e=>{const tab=e.target.closest('[data-root]');if(tab&&(e.key==='Enter'||e.key===' ')){e.preventDefault();void switchRoot(tab.dataset.root,true);}});
}
async function init(){
const icons={'back':'back','forward':'forward','up':'up','refresh-button':'refresh','preview-toggle':'preview','more-button':'more','search-icon':'search','folder-plus-icon':'plus','import-icon':'upload'};
for(const [id,name] of Object.entries(icons))$(id).innerHTML=svg(name);
theme(localStorage.getItem('fold-theme')||((matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light'));
events();if(!window.isSecureContext||!window.showDirectoryPicker){$('file-rows').innerHTML='<div class="empty"><div class="empty-title">Chrome or Edge required</div><div class="empty-sub">Open Fold over HTTPS on desktop Windows.</div></div>';return;}
S.roots=(await getSaved('roots')||[]).map(r=>({...r,path:r.path||[],history:r.history||[r.path||[]],pos:r.pos||0}));
S.activeId=await getSaved('active');if(!S.roots.some(r=>r.id===S.activeId))S.activeId=S.roots[0]?.id||null;
await load(false);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
void init();
})();
