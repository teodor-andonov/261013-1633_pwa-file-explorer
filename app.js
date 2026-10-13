// Fold — a dependency-free desktop Chromium file explorer.
// Files remain on the user's computer. Only approved directory handles are retained in IndexedDB.
const $ = (id) => document.getElementById(id);
const icons = {
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  file:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  code:'<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-13-2 18"/>',
  pdf:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7M8 16h8"/>',
  video:'<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/>',
  audio:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  back:'<path d="m15 18-6-6 6-6"/>',forward:'<path d="m9 18 6-6-6-6"/>',up:'<path d="m6 14 6-6 6 6"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14-5L4 8m0-5v5h5M4 13a8 8 0 0 0 14 5l2-2m0 5v-5h-5"/>',
  preview:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14 4v16"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  plusFolder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v3M3 10v8a2 2 0 0 0 2 2h7"/><path d="M18 15v8m-4-4h8"/>',
  upload:'<path d="m12 16 0-12m-5 5 5-5 5 5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20.8 13a9 9 0 1 1-9.8-9.8 7 7 0 0 0 9.8 9.8"/>',
  rename:'<path d="M4 20h16M6 15l10-10 3 3-10 10-4 1z"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.1 8.1 12 12M14 10l6-6M8 15l3-3"/>',paste:'<rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/>',
  trash:'<path d="M3 6h18m-2 0-1 14H6L5 6m4 0V4h6v2m-5 4v7m4-7v7"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  check:'<path d="m4 12 5 5L20 6"/>', newFile:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7M12 13v6m-3-3h6"/>'
};
const svg=(name,extra='')=>`<svg aria-hidden="true" viewBox="0 0 24 24" ${extra}>${icons[name]||icons.file}</svg>`;
const escapeHTML=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext=(s)=>s.includes('.')?s.split('.').pop().toLowerCase():'';
const kind=(entry)=>{
  if(entry.handle.kind==='directory') return 'Folder';
  const extension=ext(entry.name);
  const known={pdf:'PDF document',txt:'Text',md:'Markdown',json:'JSON',js:'JavaScript',mjs:'JavaScript',ts:'TypeScript',py:'Python',html:'HTML',css:'CSS',svg:'SVG',jpg:'Image',jpeg:'Image',png:'Image',webp:'Image',gif:'Image',bmp:'Image',avif:'Image',mp3:'Audio',wav:'Audio',ogg:'Audio',flac:'Audio',mp4:'Video',webm:'Video',mov:'Video',zip:'Archive', '7z':'Archive',rar:'Archive'};
  return known[extension] || (extension ? `${extension.toUpperCase()} file` : 'File');
};
const fileIcon=(entry)=>entry.handle.kind==='directory'?'folder': ['jpg','jpeg','png','gif','webp','svg','bmp','avif'].includes(ext(entry.name))?'image':['js','mjs','ts','tsx','jsx','py','json','css','html','md','xml','yaml','yml','toml','sh','bat'].includes(ext(entry.name))?'code':ext(entry.name)==='pdf'?'pdf':['mp4','mov','webm','mkv'].includes(ext(entry.name))?'video':['mp3','wav','ogg','flac','m4a'].includes(ext(entry.name))?'audio':'file';
const formatSize=(n)=>n==null?'—':n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(n<10240?1:0)} KB`:n<1073741824?`${(n/1048576).toFixed(n<10485760?1:0)} MB`:`${(n/1073741824).toFixed(2)} GB`;
const formatDate=(n)=>n?new Date(n).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'—';
const state={roots:[],activeId:null,dir:null,entries:[],visible:[],selected:new Set(),anchor:0,clipboard:null,previewOpen:false,previewName:null,previewSeq:0,previewUrl:null,sort:'name',direction:1,query:'',navSeq:0,permissionNeeded:false,toastTimer:null,renderPending:false,stats:new Map()};
const active=()=>state.roots.find(r=>r.id===state.activeId);
const nativeSupported=()=>Boolean(window.showDirectoryPicker&&window.indexedDB&&window.isSecureContext);
const fileList=$('file-scroller');
let dbPromise;
function storage(){return dbPromise??=new Promise((resolve,reject)=>{const q=indexedDB.open('fold-workspaces',1);q.onupgradeneeded=()=>q.result.createObjectStore('prefs');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function getStored(key){try{const db=await storage();return await new Promise((resolve,reject)=>{const q=db.transaction('prefs').objectStore('prefs').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}catch(e){console.warn('Storage read:',e);return null;}}
async function setStored(key,value){try{const db=await storage();await new Promise((resolve,reject)=>{const q=db.transaction('prefs','readwrite').objectStore('prefs').put(value,key);q.onsuccess=()=>resolve();q.onerror=()=>reject(q.error);});}catch(e){console.warn('Storage write:',e);notify('Could not save this workspace.');}}
function persist(){void setStored('roots',state.roots.map(r=>({id:r.id,name:r.name,handle:r.handle,path:r.path,history:r.history,pos:r.pos})));void setStored('active',state.activeId);}
function notify(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>t.classList.remove('show'),3400);}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('fold-theme',theme);$('theme-button').innerHTML=`${svg(theme==='dark'?'sun':'moon')}<span>${theme==='dark'?'Light appearance':'Dark appearance'}</span>`;$('theme-button').title=`Switch to ${theme==='dark'?'light':'dark'} mode`;$('preview-toggle').classList.toggle('pressed',state.previewOpen);document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#191b1e':'#f7f7f5';}
function setIcons(){const mappings={'back':'back','forward':'forward','up':'up','refresh-button':'refresh','preview-toggle':'preview','more-button':'more','search-icon':'search','folder-plus-icon':'plusFolder','import-icon':'upload'};for(const [key,value] of Object.entries(mappings)){const el=$(key);if(el){if(el.id==='back'||el.id==='forward'||el.id==='up')el.innerHTML=svg(value);else el.innerHTML=svg(value);}}document.querySelector('[data-action="back"]').innerHTML=svg('back');document.querySelector('[data-action="forward"]').innerHTML=svg('forward');document.querySelector('[data-action="up"]').innerHTML=svg('up');}
function renderRoots(){const rootList=$('roots');rootList.innerHTML=state.roots.map(r=>`<div class="root-tab ${r.id===state.activeId?'active':''}" data-root="${r.id}" title="${escapeHTML(r.name)}" role="button" tabindex="0">${svg('folder','class="tab-icon"')}<span class="tab-label">${escapeHTML(r.name)}</span><button data-close="${r.id}" class="tab-close" aria-label="Close ${escapeHTML(r.name)} tab" title="Remove tab (files stay on disk)">×</button></div>`).join('');}
function clearPreviewUrl(){if(state.previewUrl){URL.revokeObjectURL(state.previewUrl);state.previewUrl=null;}}
async function ensurePermission(handle,request=false){if(!handle?.queryPermission)return false;const opts={mode:'readwrite'};try{let p=await handle.queryPermission(opts);if(p!=='granted'&&request)p=await handle.requestPermission(opts);return p==='granted';}catch(e){console.warn('Permission:',e);return false;}}
async function openNewRoot(){if(!nativeSupported()){notify('Install/open this app over HTTPS in Chrome or Edge.');return;}try{const handle=await window.showDirectoryPicker({mode:'readwrite',id:'fold-folder'});const existing=state.roots.find(r=>r.handle.name===handle.name);if(existing&&await existing.handle.isSameEntry(handle)){await switchRoot(existing.id,true);return;}const id=crypto.randomUUID();state.roots.push({id,name:handle.name,handle,path:[],history:[[]],pos:0});state.activeId=id;persist();renderRoots();await showDirectory(true);}catch(e){if(e.name!=='AbortError'){console.error(e);notify(`Could not open folder: ${e.message}`);}}}
async function switchRoot(id,request=true){if(!state.roots.some(r=>r.id===id))return;state.activeId=id;persist();renderRoots();await showDirectory(request);}
async function closeRoot(id){const root=state.roots.find(r=>r.id===id);if(!root)return;state.roots=state.roots.filter(r=>r.id!==id);if(state.activeId===id)state.activeId=state.roots[0]?.id??null;persist();renderRoots();await showDirectory(false);}
async function getDir(root){let handle=root.handle;for(const part of root.path)handle=await handle.getDirectoryHandle(part);return handle;}
function historyTo(path){const root=active();if(!root)return;const here=JSON.stringify(root.path),there=JSON.stringify(path);if(here===there)return;root.history=root.history.slice(0,root.pos+1);root.history.push([...path]);root.pos=root.history.length-1;root.path=[...path];persist();void showDirectory(false);}
function navigateDelta(delta){const root=active();if(!root)return;const position=root.pos+delta;if(position<0||position>=root.history.length)return;root.pos=position;root.path=[...root.history[position]];persist();void showDirectory(false);}
async function showDirectory(requestPermission=false){const sequence=++state.navSeq;state.selected.clear();state.previewName=null;state.query='';$('search').value='';state.stats=new Map();state.entries=[];state.visible=[];state.permissionNeeded=false;fileList.scrollTop=0;clearPreviewUrl();$('preview-content').innerHTML='';const root=active();state.dir=null;renderToolbar();renderRoots();if(!root){$('folder-title').textContent='Your files, minus the noise.';$('file-count').textContent='';$('file-rows').innerHTML=`<div class="empty"><div class="empty-icon">${svg('folder')}</div><div class="empty-title">Start with a folder</div><div class="empty-sub">Add one or more Windows folders as tabs. Nothing is uploaded; files stay where they are.</div><button data-action="add-root">Add a folder</button></div>`;$('list-head').style.display='none';updateStatus();return;}
$('folder-title').textContent=root.path.at(-1)||root.name;$('file-count').textContent='';$('list-head').style.display='grid';$('file-rows').innerHTML='<div class="empty"><div class="empty-sub">Opening folder…</div></div>';
if(!await ensurePermission(root.handle,requestPermission)){if(sequence!==state.navSeq)return;state.permissionNeeded=true;$('file-rows').innerHTML=`<div class="empty"><div class="empty-icon">${svg('folder')}</div><div class="empty-title">Folder access required</div><div class="empty-sub">Chrome or Edge may ask you to renew access after reopening the app.</div><button data-action="grant">Allow access</button></div>`;updateStatus();return;}
try{const dir=await getDir(root);if(sequence!==state.navSeq)return;state.dir=dir;const rows=[];for await(const [name,handle] of dir.entries()){if(sequence!==state.navSeq)return;rows.push({name,handle,size:null,modified:null});}state.entries=rows;sortEntries();renderToolbar();renderList(true);updateStatus();void loadStats(sequence,rows);}catch(e){if(sequence!==state.navSeq)return;console.error(e);$('file-rows').innerHTML=`<div class="empty"><div class="empty-title">Couldn't open this folder</div><div class="empty-sub">${escapeHTML(e.message)}</div><button data-action="refresh">Try again</button></div>`;notify('Folder unavailable or permission expired.');}}
async function loadStats(seq,rows){let cursor=0;async function worker(){while(cursor<rows.length&&seq===state.navSeq){const entry=rows[cursor++];if(entry.handle.kind==='directory')continue;try{const file=await entry.handle.getFile();entry.size=file.size;entry.modified=file.lastModified;}catch{}if(cursor%15===0&&seq===state.navSeq&&['size','modified'].includes(state.sort)){sortEntries();renderList();}else if(seq===state.navSeq)requestRender();}}await Promise.all(Array.from({length:Math.min(8,rows.length)},()=>worker()));if(seq===state.navSeq){if(['size','modified'].includes(state.sort))sortEntries();renderList();}}
function sortEntries(){const dir=state.direction,key=state.sort;state.entries.sort((a,b)=>{if(a.handle.kind!==b.handle.kind)return a.handle.kind==='directory'?-1:1;let cmp=0;if(key==='size'||key==='modified')cmp=(a[key]??-1)-(b[key]??-1);else if(key==='type')cmp=kind(a).localeCompare(kind(b),undefined,{numeric:true,sensitivity:'base'});else cmp=a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});return cmp*dir||a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});});}
function renderToolbar(){const root=active();const path=root?.path??[];$('breadcrumbs').innerHTML=!root?'<span class="crumb">No folder</span>':[`<button class="crumb" data-crumb="0" title="${escapeHTML(root.name)}">${escapeHTML(root.name)}</button>`,...path.flatMap((part,i)=>[svg('chevron','class="crumb-chevron"'),`<button class="crumb" data-crumb="${i+1}" title="${escapeHTML(part)}">${escapeHTML(part)}</button>`])].join('');const disabled=!root;for(const key of ['refresh','toggle-preview','new-folder','import','more','up']){const el=document.querySelector(`[data-action="${key}"]`);if(el)el.disabled=disabled||(key==='up'&&!path.length);}const pos=root?.pos??0;document.querySelector('[data-action="back"]').disabled=!root||pos<=0;document.querySelector('[data-action="forward"]').disabled=!root||pos>=root.history.length-1;}
function renderList(reset=false){const query=state.query.toLocaleLowerCase();state.visible=query?state.entries.filter(e=>e.name.toLocaleLowerCase().includes(query)):[...state.entries];if(reset)fileList.scrollTop=0;document.querySelectorAll('[data-sort-arrow]').forEach(el=>el.textContent=el.dataset.sortArrow===state.sort?(state.direction===1?'↑':'↓'):'');$('file-count').textContent=`${state.visible.length}${query?' matching':''} item${state.visible.length===1?'':'s'}`;if(!state.visible.length){$('file-rows').innerHTML=`<div class="empty"><div class="empty-icon">${svg(query?'search':'folder')}</div><div class="empty-title">${query?'No matching files':'This folder is empty'}</div><div class="empty-sub">${query?'Try a different filter.':'Right-click to create a file or folder, or drop files here.'}</div></div>`;updateStatus();return;}renderVirtual();updateStatus();}
function renderVirtual(){if(!state.visible.length||!state.dir)return;const h=fileList.clientHeight||600,top=fileList.scrollTop;const start=Math.max(0,Math.floor(top/40)-7),end=Math.min(state.visible.length,Math.ceil((top+h)/40)+7);const rows=[];rows.push(`<div style="height:${start*40}px"></div>`);for(let i=start;i<end;i++){const e=state.visible[i],selected=state.selected.has(e.name);rows.push(`<div class="file-row${selected?' selected':''}" data-row="${i}" role="row" aria-selected="${selected}"><div class="filename">${svg(fileIcon(e))}<span class="name" title="${escapeHTML(e.name)}">${escapeHTML(e.name)}</span></div><div class="detail">${escapeHTML(kind(e))}</div><div class="detail right">${e.handle.kind==='directory'?'—':formatSize(e.size)}</div><div class="detail right">${formatDate(e.modified)}</div></div>`);}rows.push(`<div style="height:${(state.visible.length-end)*40}px"></div>`);$('file-rows').innerHTML=rows.join('');}
function requestRender(){if(state.renderPending)return;state.renderPending=true;requestAnimationFrame(()=>{state.renderPending=false;renderVirtual();});}
function updateStatus(){const total=state.visible.length,n=state.selected.size;const root=active();$('status-left').textContent=n?`${n} selected`:(root?`${total} item${total===1?'':'s'}${state.permissionNeeded?' · access needed':''}`:'Local files only · nothing uploaded');$('status-right').textContent=state.clipboard?`${state.clipboard.items.length} ${state.clipboard.cut?'cut':'copied'} · Ctrl+V to paste`:(root?'Ctrl+Shift+N · new folder':'Chrome / Edge · Windows');}
function selectIndex(i,opts={}){const entry=state.visible[i];if(!entry)return;if(opts.shift){const from=Math.max(0,Math.min(state.anchor,i)),to=Math.max(state.anchor,i);if(!opts.ctrl)state.selected.clear();for(let x=from;x<=to;x++)state.selected.add(state.visible[x].name);}else if(opts.ctrl){if(state.selected.has(entry.name))state.selected.delete(entry.name);else state.selected.add(entry.name);state.anchor=i;}else{state.selected.clear();state.selected.add(entry.name);state.anchor=i;}state.previewName=state.selected.size===1?[...state.selected][0]:null;renderVirtual();updateStatus();if(state.previewOpen)void renderPreview();}
function getSelected(){return state.entries.filter(e=>state.selected.has(e.name));}
function chosen(){return getSelected()[0]??null;}
async function openIndex(i){const e=state.visible[i];if(!e)return;if(e.handle.kind==='directory'){const root=active();historyTo([...root.path,e.name]);return;}state.selected=new Set([e.name]);state.previewName=e.name;state.previewOpen=true;updatePreviewState();renderVirtual();updateStatus();await renderPreview();}
function updatePreviewState(){$('preview').classList.toggle('open',state.previewOpen);$('preview-toggle').setAttribute('aria-pressed',String(state.previewOpen));if(state.previewOpen)void renderPreview();}
async function renderPreview(){const seq=++state.previewSeq;clearPreviewUrl();const el=$('preview-content');el.innerHTML='';if(!state.previewOpen)return;const selections=getSelected();if(selections.length!==1){el.innerHTML=`<div class="empty"><div class="empty-icon">${svg('preview')}</div><div class="empty-sub">${selections.length?'Select a single file to preview it.':'Select a file to see a preview.'}</div></div>`;return;}const entry=selections[0];if(entry.handle.kind==='directory'){el.innerHTML=`<div class="preview-visual file-symbol">${svg('folder')}</div><div class="preview-name">${escapeHTML(entry.name)}</div><div class="preview-meta">Folder</div><div class="preview-actions"><button data-action="open-selected">Open folder</button></div>`;return;}
try{const f=await entry.handle.getFile();if(seq!==state.previewSeq||!state.previewOpen)return;const type=ext(f.name);const isImage=['jpg','jpeg','png','gif','svg','webp','avif','bmp'].includes(type);const isVideo=['mp4','webm','mov'].includes(type);const isAudio=['mp3','wav','ogg','flac','m4a'].includes(type);const isPdf=type==='pdf';const isText=['txt','md','json','js','mjs','ts','tsx','jsx','css','html','htm','xml','yml','yaml','toml','py','csv','svg','log','ini','bat','ps1','sh','sql','rs','go','java','cpp','h'].includes(type);let visual='';if(isImage||isVideo||isAudio||isPdf){const blobUrl=URL.createObjectURL(f);state.previewUrl=blobUrl;if(isImage)visual=`<div class="preview-visual"><img alt="${escapeHTML(f.name)}" src="${blobUrl}"></div>`;else if(isVideo)visual=`<div class="preview-visual"><video controls preload="metadata" src="${blobUrl}"></video></div>`;else if(isAudio)visual=`<div class="preview-visual"><audio controls preload="metadata" src="${blobUrl}"></audio></div>`;else visual=`<div class="preview-visual pdf"><iframe title="PDF preview" src="${blobUrl}#toolbar=0"></iframe></div>`;}
else if(isText&&f.size<=2*1024*1024){visual=`<textarea id="preview-editor" class="preview-text" aria-label="Edit file" spellcheck="false"></textarea><button class="preview-save" id="preview-save" data-action="save-text" disabled>Save changes</button>`;}
else visual=`<div class="preview-visual file-symbol">${svg(fileIcon(entry))}</div>`;
el.innerHTML=`${visual}<div class="preview-name">${escapeHTML(f.name)}</div><div class="preview-meta">${escapeHTML(kind(entry))}</div><dl class="preview-details"><dt>Size</dt><dd>${formatSize(f.size)}</dd><dt>Modified</dt><dd>${formatDate(f.lastModified)}</dd><dt>Location</dt><dd>${escapeHTML([active()?.name,...(active()?.path??[])].join(' / '))}</dd></dl><div class="preview-actions"><button data-action="download">Save a copy</button><button data-action="rename">Rename</button></div>`;
if(isText&&f.size<=2*1024*1024&&!isImage){const editor=$('preview-editor');if(editor){const contents=await f.text();if(seq!==state.previewSeq)return;editor.value=contents;editor.addEventListener('input',()=>{$('preview-save').disabled=editor.value===contents;});}}}
catch(e){if(seq===state.previewSeq)el.innerHTML=`<div class="empty">Could not preview: ${escapeHTML(e.message)}</div>`;}}
async function saveText(){const entry=chosen(),editor=$('preview-editor');if(!entry||!editor)return;try{const writer=await entry.handle.createWritable();await writer.write(editor.value);await writer.close();$('preview-save').disabled=true;notify('Saved');await refreshCurrent(true);}catch(e){console.error(e);notify(`Save failed: ${e.message}`);}}
const filenameOK=(name)=>Boolean(name&&name!=='.'&&name!=='..'&&!/[\\/:*?"<>|\x00-\x1f]/.test(name)&&!/[. ]$/.test(name)&&!/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(name));
function modal({title,description='',value=null,confirm='Create',danger=false}){return new Promise(resolve=>{const host=$('modal-root');host.innerHTML=`<div class="modal-backdrop"><form class="modal"><h2>${escapeHTML(title)}</h2>${description?`<p>${escapeHTML(description)}</p>`:''}${value!==null?`<input id="modal-input" type="text" autocomplete="off" spellcheck="false" required>`:''}<div class="modal-buttons"><button type="button" data-modal-cancel>Cancel</button><button type="submit" class="${danger?'danger':'primary'}">${escapeHTML(confirm)}</button></div></form></div>`;const input=$('modal-input');if(input){input.value=value;input.focus();input.select();}else host.querySelector('[type="submit"]').focus();const close=(v)=>{document.removeEventListener('keydown',esc,true);host.innerHTML='';resolve(v);};host.querySelector('[data-modal-cancel]').onclick=()=>close(null);host.querySelector('.modal-backdrop').onclick=e=>{if(e.target.classList.contains('modal-backdrop'))close(null);};const esc=e=>{if(e.key==='Escape'){e.stopPropagation();close(null);}};document.addEventListener('keydown',esc,true);host.querySelector('form').onsubmit=e=>{e.preventDefault();close(input?input.value:true);};});}
async function uniqueName(dir,requested){
  let name=requested,index=2;
  const point=requested.lastIndexOf('.');
  const [stem,suffix]=point>0?[requested.slice(0,point),requested.slice(point)]:[requested,''];
  while(true){
    let found=false;
    for(const method of ['getFileHandle','getDirectoryHandle']){
      try { await dir[method](name); found=true; break; }
      catch(e){
        if(e.name==='TypeMismatchError'){found=true;break;}
        if(e.name!=='NotFoundError') throw e;
      }
    }
    if(!found)return name;
    name=`${stem} (${index++})${suffix}`;
  }
}
async function createNew(kindToCreate){if(!state.dir)return;const initial=kindToCreate==='directory'?'New folder':'Untitled.md';const name=(await modal({title:`New ${kindToCreate==='directory'?'folder':'file'}`,value:initial}))?.trim();if(name==null)return;if(!filenameOK(name)){notify('Invalid Windows filename.');return;}try{if(await uniqueName(state.dir,name)!==name){notify('A file or folder already has that name.');return;}if(kindToCreate==='directory')await state.dir.getDirectoryHandle(name,{create:true});else{const handle=await state.dir.getFileHandle(name,{create:true});const writer=await handle.createWritable();await writer.close();}await refreshCurrent();state.selected=new Set([name]);renderVirtual();updateStatus();}catch(e){notify(`Creation failed: ${e.message}`);}}
async function copyEntry(source,dest,name){if(source.kind==='file'){const srcFile=await source.getFile();const output=await dest.getFileHandle(name,{create:true});const stream=await output.createWritable();try{await stream.write(srcFile);await stream.close();}catch(e){await stream.abort().catch(()=>{});throw e;}return;}const target=await dest.getDirectoryHandle(name,{create:true});for await(const [childName,child] of source.entries())await copyEntry(child,target,childName);}
async function isDescendantOf(dest,source){if(source.kind!=='directory')return false;try{return (await source.resolve(dest))!==null;}catch{return false;}}
async function renameSelected(){const entry=chosen();if(!entry||!state.dir)return;const old=entry.name;const name=(await modal({title:'Rename',value:old,confirm:'Rename',description:'Folder renaming may copy then remove the original. Larger folders can take time.'}))?.trim();if(name==null||name===old)return;if(!filenameOK(name)){notify('Invalid Windows filename.');return;}try{if(await uniqueName(state.dir,name)!==name){notify('That name is already in use.');return;}if(typeof entry.handle.move==='function'){try{await entry.handle.move(name);await refreshCurrent();state.selected=new Set([name]);renderVirtual();updateStatus();notify('Renamed');return;}catch(e){if(!['NotSupportedError','InvalidModificationError','NotAllowedError'].includes(e.name))throw e;}}
await copyEntry(entry.handle,state.dir,name);await state.dir.removeEntry(old,{recursive:entry.handle.kind==='directory'});await refreshCurrent();state.selected=new Set([name]);renderVirtual();updateStatus();notify('Renamed');}catch(e){console.error(e);notify(`Rename failed: ${e.message}`);}}
function prepareClipboard(cut){const sel=getSelected();if(!sel.length||!state.dir)return;state.clipboard={items:sel.map(e=>({name:e.name,handle:e.handle,parent:state.dir,rootId:active().id,path:[...active().path]})),cut};notify(`${sel.length} item${sel.length>1?'s':''} ${cut?'cut':'copied'}`);updateStatus();}
async function pasteClipboard(){if(!state.clipboard||!state.dir)return;const clipboard=state.clipboard,destination=state.dir;let count=0,errors=[];for(const item of clipboard.items){try{if(clipboard.cut&&await item.parent.isSameEntry(destination))continue;if(await isDescendantOf(destination,item.handle))throw Error('Cannot copy a folder into itself.');const name=await uniqueName(destination,item.name);await copyEntry(item.handle,destination,name);if(clipboard.cut)await item.parent.removeEntry(item.name,{recursive:item.handle.kind==='directory'});count++;}catch(e){console.error(e);errors.push(`${item.name}: ${e.message}`);}}if(clipboard.cut&&!errors.length)state.clipboard=null;await refreshCurrent();notify(errors.length?`${count} completed · ${errors.length} failed. ${errors[0]}`:`${count} item${count===1?'':'s'} pasted`);updateStatus();}
async function deleteSelected(){const items=getSelected();if(!items.length||!state.dir)return;const names=items.slice(0,3).map(e=>e.name).join(', ')+(items.length>3?'…':'');const agreed=await modal({title:`Permanently delete ${items.length} item${items.length>1?'s':''}?`,description:`${names}\n\nThis does NOT go to the Windows Recycle Bin and cannot be undone.`,value:null,confirm:'Delete permanently',danger:true});if(!agreed)return;let failed=0;for(const e of items){try{await state.dir.removeEntry(e.name,{recursive:e.handle.kind==='directory'});}catch(err){console.error(err);failed++;}}await refreshCurrent();notify(failed?`${failed} item(s) could not be deleted`:'Deleted permanently');}
async function importFiles(files){if(!state.dir||!files?.length)return;let done=0,failed=0;for(const file of files){try{const name=await uniqueName(state.dir,file.name);const handle=await state.dir.getFileHandle(name,{create:true});const writer=await handle.createWritable();await writer.write(file);await writer.close();done++;}catch(e){console.error(e);failed++;}}await refreshCurrent();notify(`${done} file${done===1?'':'s'} imported${failed?`, ${failed} failed`:''}`);}
async function importHandles(handles){if(!state.dir||!handles.length)return;let done=0,failed=0;for(const handle of handles){try{if(await isDescendantOf(state.dir,handle))throw Error('Cannot copy folder into itself.');const name=await uniqueName(state.dir,handle.name);await copyEntry(handle,state.dir,name);done++;}catch(e){console.error(e);failed++;}}await refreshCurrent();notify(`${done} item${done===1?'':'s'} imported${failed?`, ${failed} failed`:''}`);}
async function downloadSelected(){const entry=chosen();if(!entry||entry.handle.kind!=='file')return;try{const file=await entry.handle.getFile();const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){notify(`Download failed: ${e.message}`);}}
async function refreshCurrent(keepSelection=false){const selected=keepSelection?[...state.selected]:[];await showDirectory(false);if(keepSelection){state.selected=new Set(selected.filter(n=>state.entries.some(e=>e.name===n)));renderVirtual();updateStatus();}}
function menu(items,x,y){const ctx=$('context');ctx.innerHTML=items.map(item=>item.divider?'<div class="menu-divider"></div>':`<button role="menuitem" class="menu-item ${item.danger?'danger':''}" data-menu="${item.action}" ${item.disabled?'disabled':''}>${svg(item.icon||'file')}<span>${escapeHTML(item.label)}</span>${item.key?`<kbd>${escapeHTML(item.key)}</kbd>`:''}</button>`).join('');ctx.hidden=false;const rect=ctx.getBoundingClientRect();ctx.style.left=`${Math.max(8,Math.min(x,innerWidth-rect.width-8))}px`;ctx.style.top=`${Math.max(8,Math.min(y,innerHeight-rect.height-8))}px`;}
const fileMenu=()=>[{action:'open-selected',icon:'preview',label:'Open / preview',key:'Enter'},{action:'rename',icon:'rename',label:'Rename',key:'F2'}, {divider:true},{action:'copy',icon:'copy',label:'Copy',key:'Ctrl+C'},{action:'cut',icon:'scissors',label:'Cut',key:'Ctrl+X'},{action:'paste',icon:'paste',label:'Paste into current folder',key:'Ctrl+V',disabled:!state.clipboard},{divider:true},{action:'download',icon:'download',label:'Save a copy',disabled:getSelected().length!==1||chosen()?.handle.kind!=='file'},{action:'delete',icon:'trash',label:'Delete permanently',key:'Del',danger:true}];
const blankMenu=()=>[{action:'new-folder',icon:'plusFolder',label:'New folder',key:'Ctrl+Shift+N'},{action:'new-file',icon:'newFile',label:'New Markdown file'}, {action:'import',icon:'upload',label:'Import files'},{divider:true},{action:'paste',icon:'paste',label:'Paste',key:'Ctrl+V',disabled:!state.clipboard},{action:'refresh',icon:'refresh',label:'Refresh',key:'F5'}];
async function act(action){$('context').hidden=true;switch(action){case 'add-root':return openNewRoot();case 'theme':return setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');case 'grant':return showDirectory(true);case 'refresh':return refreshCurrent(true);case 'back':return navigateDelta(-1);case 'forward':return navigateDelta(1);case 'up':{const r=active();if(r?.path.length)historyTo(r.path.slice(0,-1));return;}case 'new-folder':return createNew('directory');case 'new-file':return createNew('file');case 'import':return $('upload-input').click();case 'rename':return renameSelected();case 'copy':return prepareClipboard(false);case 'cut':return prepareClipboard(true);case 'paste':return pasteClipboard();case 'delete':return deleteSelected();case 'download':return downloadSelected();case 'save-text':return saveText();case 'toggle-preview':state.previewOpen=!state.previewOpen;updatePreviewState();return;case 'close-preview':state.previewOpen=false;updatePreviewState();return;case 'open-selected':{const e=chosen();if(!e)return;const i=state.visible.findIndex(x=>x.name===e.name);if(i>=0)return openIndex(i);return;}case 'more':{const r=$('more-button').getBoundingClientRect();return menu(blankMenu().concat([{divider:true},{action:'select-all',icon:'check',label:'Select all',key:'Ctrl+A'}]),r.left,r.bottom+7);}case 'select-all':state.selected=new Set(state.visible.map(e=>e.name));state.previewName=null;renderVirtual();updateStatus();if(state.previewOpen)void renderPreview();return;case 'shortcuts':return modal({title:'Keyboard shortcuts',description:'Enter: Open / preview\nSpace: Toggle preview\nF2: Rename\nDelete: Delete permanently\nCtrl+C / X / V: Internal copy, cut, paste\nCtrl+A: Select all\nCtrl+Shift+N: New folder\nAlt+Left / Right / Up: Navigate\n/: Focus filter\nF5: Refresh\nEsc: Clear selection',value:null,confirm:'Close'});}}
function bindEvents(){document.addEventListener('click',e=>{const menuItem=e.target.closest('[data-menu]');if(menuItem){void act(menuItem.dataset.menu);return;}if(!$('context').contains(e.target))$('context').hidden=true;const close=e.target.closest('[data-close]');if(close){e.stopPropagation();void closeRoot(close.dataset.close);return;}const root=e.target.closest('[data-root]');if(root){void switchRoot(root.dataset.root,true);return;}const crumb=e.target.closest('[data-crumb]');if(crumb){const r=active();if(r)historyTo(r.path.slice(0,Number(crumb.dataset.crumb)));return;}const action=e.target.closest('[data-action]');if(action){void act(action.dataset.action);return;}const row=e.target.closest('[data-row]');if(row){selectIndex(Number(row.dataset.row),{ctrl:e.ctrlKey||e.metaKey,shift:e.shiftKey});return;}if(e.target.closest('#file-scroller')&&state.dir){state.selected.clear();state.previewName=null;renderVirtual();updateStatus();if(state.previewOpen)void renderPreview();}});
fileList.addEventListener('dblclick',e=>{const row=e.target.closest('[data-row]');if(row)void openIndex(Number(row.dataset.row));});
document.addEventListener('contextmenu',e=>{const root=e.target.closest('[data-root]');if(root){e.preventDefault();menu([{action:'close-root',icon:'trash',label:'Close folder tab'}],e.clientX,e.clientY);const closeId=root.dataset.root;$('context').querySelector('[data-menu="close-root"]').onclick=()=>{ $('context').hidden=true;void closeRoot(closeId);};return;}const row=e.target.closest('[data-row]');if(row){e.preventDefault();const i=Number(row.dataset.row);if(!state.selected.has(state.visible[i].name))selectIndex(i);menu(fileMenu(),e.clientX,e.clientY);return;}if(e.target.closest('#files-area')&&state.dir){e.preventDefault();menu(blankMenu(),e.clientX,e.clientY);}});
fileList.addEventListener('scroll',requestRender,{passive:true});window.addEventListener('resize',requestRender);$('search').addEventListener('input',e=>{state.query=e.target.value;renderList(true);});$('upload-input').addEventListener('change',async e=>{await importFiles([...e.target.files]);e.target.value='';});document.querySelectorAll('[data-sort]').forEach(el=>el.addEventListener('click',()=>{const sort=el.dataset.sort;if(state.sort===sort)state.direction*=-1;else{state.sort=sort;state.direction=1;}sortEntries();renderList();}));
document.addEventListener('keydown',e=>{const key=e.key.toLowerCase();const editing=e.target.closest('input,textarea,[contenteditable="true"]');if($('modal-root').children.length)return;if(e.key==='Escape'){$('context').hidden=true;if(editing){if(e.target===$('search')){$('search').value='';state.query='';renderList(true);}return;}state.selected.clear();renderVirtual();updateStatus();return;}if(editing){if(e.ctrlKey&&key==='s'&&e.target.id==='preview-editor'){e.preventDefault();void saveText();}return;}if(key==='/'&&!e.ctrlKey&&!e.altKey){e.preventDefault();$('search').focus();return;}if(!active())return;if(e.key==='F5'){e.preventDefault();void act('refresh');return;}if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();void act('back');return;}if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();void act('forward');return;}if(e.altKey&&e.key==='ArrowUp'){e.preventDefault();void act('up');return;}if(e.ctrlKey&&e.shiftKey&&key==='n'){e.preventDefault();void act('new-folder');return;}if(e.ctrlKey&&key==='a'){e.preventDefault();void act('select-all');return;}if(e.ctrlKey&&['c','x','v'].includes(key)){e.preventDefault();void act(key==='c'?'copy':key==='x'?'cut':'paste');return;}if(e.key==='F2'){e.preventDefault();void act('rename');return;}if(e.key==='Delete'){e.preventDefault();void act('delete');return;}if(e.key==='Enter'){e.preventDefault();void act('open-selected');return;}if(e.code==='Space'){e.preventDefault();void act('toggle-preview');return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const index=state.visible.findIndex(x=>x.name===[...state.selected][0]);const next=Math.max(0,Math.min(state.visible.length-1,index+(e.key==='ArrowDown'?1:-1)));selectIndex(next,{shift:e.shiftKey});const target=next*40;if(target<fileList.scrollTop)fileList.scrollTop=target;else if(target+40>fileList.scrollTop+fileList.clientHeight)fileList.scrollTop=target-fileList.clientHeight+40;}});
let dragLevel=0;const area=$('files-area');area.addEventListener('dragenter',e=>{if(!state.dir)return;e.preventDefault();dragLevel++;area.classList.add('drag-over');});area.addEventListener('dragover',e=>{if(!state.dir)return;e.preventDefault();e.dataTransfer.dropEffect='copy';});area.addEventListener('dragleave',e=>{dragLevel=Math.max(0,dragLevel-1);if(!dragLevel)area.classList.remove('drag-over');});area.addEventListener('drop',async e=>{if(!state.dir)return;e.preventDefault();dragLevel=0;area.classList.remove('drag-over');const items=[...e.dataTransfer.items];if(items.some(item=>typeof item.getAsFileSystemHandle==='function')){const pending=items.filter(i=>i.kind==='file').map(i=>i.getAsFileSystemHandle());const handles=(await Promise.all(pending)).filter(Boolean);if(handles.length){await importHandles(handles);return;}}await importFiles([...e.dataTransfer.files]);});
document.querySelector('.roots').addEventListener('keydown',e=>{const root=e.target.closest('[data-root]');if(root&&(e.key==='Enter'||e.key===' ')){e.preventDefault();void switchRoot(root.dataset.root,true);}});
}
async function init(){setIcons();let theme=localStorage.getItem('fold-theme');if(!['light','dark'].includes(theme))theme=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';setTheme(theme);bindEvents();if(!nativeSupported()){$('folder-title').textContent='Browser access unavailable';$('file-rows').innerHTML=`<div class="empty"><div class="empty-title">Chrome or Edge is required</div><div class="empty-sub">Use this app on Windows over HTTPS (or localhost). Browser file access is not available in this context.</div></div>`;notify('Folder access is not supported in this browser or context.');return;}state.roots=(await getStored('roots')||[]).map(r=>({...r,path:r.path??[],history:r.history??[r.path??[]],pos:r.pos??0}));state.activeId=await getStored('active');if(!state.roots.some(r=>r.id===state.activeId))state.activeId=state.roots[0]?.id??null;await showDirectory(false);if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn);}
(function installFoldFeatures(){
  // Fold v2: small, composable upgrades to the existing explorer, no runtime dependencies.
  const views = new Set(['list','table','gallery']);
  const groups = new Set(['none','type','date']);
  state.view = views.has(localStorage.getItem('fold-view')) ? localStorage.getItem('fold-view') : 'list';
  state.group = groups.has(localStorage.getItem('fold-group')) ? localStorage.getItem('fold-group') : 'none';
  state.galleryLimit = 160;
  state.thumbnailUrls = new Map();
  state.layout = null;
  state.thumbnailObserver = null;
  icons.list = '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>';
  icons.table = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M10 4v16"/>';
  icons.gallery = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.4"/><path d="m3 17 6-6 4 4 3-3 5 5"/>';
  icons.group = '<path d="M3 5h8v5H3zM13 5h8v5h-8zM3 14h8v5H3zM13 14h8v5h-8z"/>';
  icons.pen = '<path d="m4 20 4.5-1 11-11-3.5-3.5-11 11L4 20zM14 6l3.5 3.5"/>';
  icons.marker = '<path d="M4 20h16M6 16 17 5l3 3-11 11H6z"/>';
  icons.rectangle = '<rect x="4" y="5" width="16" height="14" rx="1"/>';
  icons.line = '<path d="M4 20 20 4"/>';
  icons.text = '<path d="M4 6V4h16v2M12 4v16M8 20h8"/>';
  icons.undo = '<path d="M9 14 4 9l5-5M4 9h10a7 7 0 0 1 0 14"/>';
  icons.edit = icons.rename;
  icons.photoPlus = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 17 6-6 3 3m2-5h6m-3-3v6"/>';
  const extensionImage = n => ['png','jpg','jpeg','webp','gif','bmp','avif','svg'].includes(ext(n));
  const markableImage = n => ['png','jpg','jpeg','webp','bmp','avif'].includes(ext(n));
  const clearThumbnailCache = () => {
    state.thumbnailObserver?.disconnect();
    state.thumbnailObserver=null;
    for(const url of state.thumbnailUrls.values()) URL.revokeObjectURL(url);
    state.thumbnailUrls.clear();
    state.layout=null;
  };
  const baseShowDirectory = showDirectory;
  showDirectory = async function(...args){
    clearThumbnailCache();
    state.galleryLimit=160;
    return baseShowDirectory(...args);
  };
  const baseRenderList = renderList;
  renderList = function(...args){state.layout=null;state.galleryEpoch=(state.galleryEpoch||0)+1;return baseRenderList(...args);};
  const bucket = e => {
    if(e.handle.kind === 'directory') return 'Folders';
    if(state.group === 'type') {
      if(extensionImage(e.name)) return 'Images';
      const icon = fileIcon(e);
      if(icon==='code') return 'Code & text';
      if(icon==='pdf') return 'PDF';
      if(icon==='video') return 'Video';
      if(icon==='audio') return 'Audio';
      return kind(e)==='Archive'?'Archives':'Other files';
    }
    const t=e.modified;
    if(!t) return 'No date';
    const now=new Date(),day=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
    const week=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).getTime();
    const month=new Date(now.getFullYear(),now.getMonth(),1).getTime();
    const year=new Date(now.getFullYear(),0,1).getTime();
    if(t>=day)return 'Today';
    if(t>=day-86400000)return 'Yesterday';
    if(t>=week)return 'Last 7 days';
    if(t>=month)return 'This month';
    if(t>=year)return 'This year';
    return 'Older';
  };
  function layoutRows(){
    if(state.layout?.visible === state.visible && state.layout.group === state.group) return state.layout.rows;
    const rows=[];
    if(state.group==='none'){
      state.visible.forEach((e,index)=>rows.push({index}));
    } else {
      const bins=new Map();
      state.visible.forEach((e,index)=>{
        const key=bucket(e);
        if(!bins.has(key)) bins.set(key,[]);
        bins.get(key).push(index);
      });
      const order=state.group==='type'
        ? ['Folders','Images','Code & text','PDF','Video','Audio','Archives','Other files']
        : ['Folders','Today','Yesterday','Last 7 days','This month','This year','Older','No date'];
      for(const label of order) if(bins.has(label)){
        rows.push({header:label});
        for(const index of bins.get(label))rows.push({index});
      }
    }
    state.layout={visible:state.visible,group:state.group,rows};
    return rows;
  }
  function fileRow(item){
    const e=state.visible[item.index],sel=state.selected.has(e.name);
    return `<div class="file-row${sel?' selected':''}" data-row="${item.index}" role="row" aria-selected="${sel}"><div class="filename">${svg(fileIcon(e))}<span class="name" title="${escapeHTML(e.name)}">${escapeHTML(e.name)}</span></div><div class="detail">${escapeHTML(kind(e))}</div><div class="detail right">${e.handle.kind==='directory'?'—':formatSize(e.size)}</div><div class="detail right">${formatDate(e.modified)}</div></div>`;
  }
  function galleryCard(item){
    const e=state.visible[item.index],sel=state.selected.has(e.name);
    const showThumb=e.handle.kind==='file'&&extensionImage(e.name);
    const url=state.thumbnailUrls.get(e.name);
    return `<div class="gallery-card${sel?' selected':''}" data-row="${item.index}" role="option" aria-selected="${sel}" title="${escapeHTML(e.name)}"><div class="gallery-visual"${showThumb&&!url?` data-thumb="${item.index}"`:''}>${url?`<img alt="" src="${url}" loading="lazy">`:svg(fileIcon(e))}</div><div class="gallery-name">${escapeHTML(e.name)}</div></div>`;
  }
  function loadThumbnails(){
    state.thumbnailObserver?.disconnect();
    if(state.view!=='gallery')return;
    const nodes=[...document.querySelectorAll('[data-thumb]')];
    if(!nodes.length)return;
    const rootId=state.activeId,dir=state.dir;
    const observer=new IntersectionObserver(items=>{
      for(const intersection of items){
        if(!intersection.isIntersecting)continue;
        const element=intersection.target;
        observer.unobserve(element);
        const index=Number(element.dataset.thumb);
        const entry=state.visible[index];
        if(!entry)return;
        void (async()=>{
          try {
            if(state.thumbnailUrls.has(entry.name)){
              const url=state.thumbnailUrls.get(entry.name);
              if(element.isConnected)element.innerHTML=`<img alt="" src="${url}" loading="lazy">`;
              return;
            }
            const file=await entry.handle.getFile();
            if(state.activeId!==rootId||state.dir!==dir||state.view!=='gallery'||!element.isConnected)return;
            const url=URL.createObjectURL(file);
            state.thumbnailUrls.set(entry.name,url);
            element.innerHTML=`<img alt="" src="${url}" loading="lazy">`;
          }catch(err){console.warn('Thumbnail unavailable',err);}
        })();
      }
    },{root:fileList,rootMargin:'350px'});
    state.thumbnailObserver=observer;
    nodes.forEach(el=>observer.observe(el));
  }
  function updateViewButtons(){
    $('files-area').dataset.view=state.view;
    for(const view of views){
      const b=document.querySelector(`[data-action="view-${view}"]`);
      if(b){if(!b.querySelector('svg'))b.innerHTML=svg(view);b.classList.toggle('pressed',state.view===view);b.setAttribute('aria-pressed',String(state.view===view));}
    }
    const b=document.querySelector('[data-action="group-menu"]');
    if(b){if(!b.querySelector('svg'))b.innerHTML=svg('group');b.classList.toggle('pressed',state.group!=='none');b.title=`Group: ${state.group}`;}
  }
  renderVirtual = function(){
    updateViewButtons();
    if(!state.visible.length||!state.dir)return;
    const rows=layoutRows(),host=$('file-rows');
    if(state.view==='gallery'){
      const stamp=[state.galleryEpoch,state.group,state.galleryLimit,[...state.selected].sort().join('|')].join(';');
      if(host.dataset.mode==='gallery'&&state.galleryStamp===stamp)return;
      host.dataset.mode='gallery';state.galleryStamp=stamp;
      const count=Math.min(state.galleryLimit,state.visible.length);
      const parts=['<div class="gallery-layout">'];
      let opened=false,shown=0;
      for(const item of rows){
        if(item.header){
          if(shown>=count)break;
          if(opened){parts.push('</div>');opened=false;}
          parts.push(`<div class="group-title">${escapeHTML(item.header)}</div>`);
        } else {
          if(shown>=count)break;
          if(!opened){parts.push('<div class="gallery-grid">');opened=true;}
          parts.push(galleryCard(item));shown++;
        }
      }
      if(opened)parts.push('</div>');
      if(shown<state.visible.length)parts.push(`<div class="gallery-more">${svg('gallery')} ${state.visible.length-shown} more</div>`);
      parts.push('</div>');
      host.innerHTML=parts.join('');
      loadThumbnails();
      return;
    }
    host.dataset.mode='rows';
    const rowHeight=40,top=fileList.scrollTop,h=fileList.clientHeight||600;
    const start=Math.max(0,Math.floor(top/rowHeight)-8);
    const end=Math.min(rows.length,Math.ceil((top+h)/rowHeight)+8);
    const html=[`<div style="height:${start*rowHeight}px"></div>`];
    for(let i=start;i<end;i++){
      const item=rows[i];
      html.push(item.header?`<div class="group-row">${escapeHTML(item.header)}</div>`:fileRow(item));
    }
    html.push(`<div style="height:${(rows.length-end)*rowHeight}px"></div>`);
    host.innerHTML=html.join('');
  };
  // Reuse Fold's existing, permission-aware text editor and media preview.
  const baseRenderPreview = renderPreview;
  renderPreview = async function(){
    await baseRenderPreview();
    if(!state.previewOpen)return;
    const e=chosen();
    if(!e||e.handle.kind!=='file')return;
    const host=$('preview-content');
    if(!host.querySelector('.preview-name'))return;
    const visual=host.querySelector('.preview-visual');
    if(markableImage(e.name)&&visual){
      visual.insertAdjacentHTML('afterend',`<div class="preview-toolstrip"><button class="tool-button" data-action="annotate-image" title="Sketch or annotate image" aria-label="Annotate image">${svg('pen')}</button></div>`);
    }
    if(ext(e.name)==='svg'&&visual){
      visual.insertAdjacentHTML('afterend',`<div class="preview-toolstrip"><button class="tool-button" data-action="edit-svg" title="Edit SVG source" aria-label="Edit SVG source">${svg('code')}</button></div>`);
    }
    if(ext(e.name)==='md'&&$('preview-editor')){
      const editor=$('preview-editor');
      const button=document.createElement('button');
      button.className='tool-button';
      button.title='Toggle rendered Markdown';
      button.setAttribute('aria-label','Toggle rendered Markdown');
      button.innerHTML=svg('preview');
      button.onclick=()=>{
        const existing=host.querySelector('.markdown-render');
        if(existing){existing.remove();editor.hidden=false;button.classList.remove('pressed');return;}
        const viewer=document.createElement('div');
        viewer.className='markdown-render';
        viewer.innerHTML=renderSimpleMarkdown(editor.value);
        editor.after(viewer);editor.hidden=true;button.classList.add('pressed');
      };
      const bar=document.createElement('div');bar.className='preview-toolstrip';bar.append(button);editor.before(bar);
    }
    if($('preview-editor')&&ext(e.name)!=='md'){
      const editor=$('preview-editor'),bar=document.createElement('div');
      bar.className='preview-toolstrip';
      const button=document.createElement('button');
      button.className='tool-button';button.innerHTML=svg('preview');
      button.title='Toggle code preview';button.setAttribute('aria-label','Toggle code preview');
      button.onclick=()=>{
        const previous=host.querySelector('.code-render');
        if(previous){previous.remove();editor.hidden=false;button.classList.remove('pressed');return;}
        const pre=document.createElement('pre');pre.className='code-render';
        pre.innerHTML=highlightSource(editor.value);
        editor.after(pre);editor.hidden=true;button.classList.add('pressed');
      };
      bar.append(button);editor.before(bar);
    }
  };
  function highlightSource(text){
    const source=text.length>250000?text.slice(0,250000)+'\n… preview truncated':text;
    const re=/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|#[^\n]*|\b(?:const|let|var|function|return|class|import|from|export|def|if|else|elif|for|while|in|try|except|async|await|true|false|null|None|True|False)\b|\b\d+(?:\.\d+)?\b)/g;
    let out='',last=0,match;
    while((match=re.exec(source))){
      out+=escapeHTML(source.slice(last,match.index));
      const part=match[0];
      const cls=part.startsWith('//')||part.startsWith('#')?'comment':
        part.startsWith('"')||part.startsWith("'")?'string':/^\d/.test(part)?'number':'keyword';
      out+='<span class="token-'+cls+'">'+escapeHTML(part)+'</span>';
      last=re.lastIndex;
    }
    return out+escapeHTML(source.slice(last));
  }
  function renderSimpleMarkdown(input){
    const lines=escapeHTML(input).split(/\r?\n/);
    let code=false;
    const out=[];
    const inline=s=>s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
    for(const line of lines){
      if(/^```/.test(line)){out.push(code?'</code></pre>':'<pre><code>');code=!code;continue;}
      if(code){out.push(`${line}\n`);continue;}
      const heading=line.match(/^(#{1,6})\s+(.+)$/);
      if(heading){const n=heading[1].length;out.push(`<h${n}>${inline(heading[2])}</h${n}>`);continue;}
      if(/^[-*]\s+/.test(line)){out.push(`<p class="md-bullet">• ${inline(line.slice(2))}</p>`);continue;}
      if(/^>\s?/.test(line)){out.push(`<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`);continue;}
      out.push(line.trim()?`<p>${inline(line)}</p>`:'<div class="md-space"></div>');
    }
    if(code)out.push('</code></pre>');
    return out.join('');
  }
  const baseSaveText = saveText;
  saveText = async function(){
    const selectedName=chosen()?.name;
    await baseSaveText();
    if(state.previewOpen && selectedName && chosen()?.name===selectedName)await renderPreview();
  };
  async function editSvg(){
    const entry=chosen();if(!entry||ext(entry.name)!=='svg')return;
    const host=$('preview-content');
    const file=await entry.handle.getFile();
    if(file.size>5*1024*1024){notify('SVG too large to edit in preview.');return;}
    const raw=await file.text();
    const original=host.innerHTML;
    host.innerHTML=`<textarea id="preview-editor" class="preview-text" spellcheck="false" aria-label="Edit SVG source"></textarea><div class="preview-toolstrip"><button class="tool-button" id="preview-save" data-action="save-text" title="Save SVG" aria-label="Save SVG" disabled>${svg('check')}</button><button class="tool-button" id="close-code-editor" title="Cancel source editing" aria-label="Cancel source editing">${svg('trash')}</button></div>`;
    $('preview-editor').value=raw;
    $('preview-editor').addEventListener('input',()=>{$('preview-save').disabled=$('preview-editor').value===raw;});
    $('close-code-editor').addEventListener('click',()=>{host.innerHTML=original;});
  }
  async function createBlankImage(){
    if(!state.dir){notify('Open a writable folder first.');return;}
    let name=await modal({title:'New white image · 1600 × 900',value:'Untitled.jpg',confirm:'Create'});
    if(name===null)return;
    name=name.trim();
    if(!/\.jpe?g$/i.test(name)||!filenameOK(name)){notify('Use a valid .jpg filename.');return;}
    if(await uniqueName(state.dir,name)!==name){notify('That name already exists.');return;}
    try{
      const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
      const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.95));
      if(!blob)throw Error('Could not encode JPEG.');
      const handle=await state.dir.getFileHandle(name,{create:true});
      const writer=await handle.createWritable();await writer.write(blob);await writer.close();
      await refreshCurrent();const index=state.visible.findIndex(e=>e.name===name);if(index>=0)await openIndex(index);
      notify('Blank JPG created');
    }catch(err){console.error(err);notify(`Could not create image: ${err.message}`);}
  }
  let annotation=null;
  async function openAnnotator(){
    const entry=chosen();
    if(!entry||!markableImage(entry.name)||!state.dir)return;
    let url=null;
    try{
      const file=await entry.handle.getFile();
      url=URL.createObjectURL(file);
      const image=new Image();image.src=url;await image.decode();
      if(!image.naturalWidth||!image.naturalHeight)throw Error('Could not decode this image.');
      const maxSide=14000;if(image.naturalWidth>maxSide||image.naturalHeight>maxSide)throw Error('Image is too large for the annotation canvas.');
      const host=$('modal-root');
      host.innerHTML=`<div class="annotation-modal" role="dialog" aria-label="Image annotation editor">
        <div class="annotation-toolbar">
          <div class="annotation-name" title="${escapeHTML(entry.name)}">${escapeHTML(entry.name)}</div>
          <div class="annotation-tools">
            ${[['pen','pen','Pen'],['marker','marker','Highlighter'],['line','line','Line'],['rectangle','rectangle','Rectangle'],['text','text','Text'],['eraser','trash','Erase annotations']].map(([a,icon,label])=>`<button class="tool-button anno-tool ${a==='pen'?'pressed':''}" data-anno-tool="${a}" title="${label}" aria-label="${label}">${svg(icon)}</button>`).join('')}
            <input id="anno-color" title="Ink colour" aria-label="Ink colour" type="color" value="#ee5145">
            <input id="anno-width" type="range" min="1" max="18" value="4" title="Pen thickness" aria-label="Pen thickness">
            <button class="tool-button" data-anno-action="undo" title="Undo (Ctrl+Z)" aria-label="Undo">${svg('undo')}</button>
          </div>
          <div class="annotation-controls"><button class="anno-save" data-anno-action="save" title="Save as new PNG">Save copy</button><button class="tool-button" data-anno-action="close" title="Close" aria-label="Close">${svg('trash')}</button></div>
        </div>
        <div class="annotation-body"><div class="annotation-frame" id="anno-frame"><img id="anno-image" alt="" src="${url}"><canvas id="anno-canvas" aria-label="Sketch layer"></canvas></div></div>
        <div class="annotation-hint">Original preserved · saved as PNG</div>
      </div>`;
      const sourceImg=$('anno-image');await sourceImg.decode();
      const canvas=$('anno-canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d');
      const ratio=canvas.width/canvas.height;
      const frame=$('anno-frame');
      frame.style.aspectRatio=String(ratio);
      frame.style.width=`min(100%, ${Math.round((window.innerHeight-155)*ratio)}px, ${image.naturalWidth}px)`;
      annotation={host,canvas,ctx,image,entry,dir:state.dir,tool:'pen',strokes:[],current:null,color:'#ee5145',width:4,url};
      canvas.addEventListener('pointerdown',annotationPointerDown);
      canvas.addEventListener('pointermove',annotationPointerMove);
      canvas.addEventListener('pointerup',annotationPointerUp);
      canvas.addEventListener('pointercancel',annotationPointerUp);
      document.addEventListener('keydown',annotationKeys,true);
    }catch(err){if(url)URL.revokeObjectURL(url);notify(`Annotation unavailable: ${err.message}`);console.error(err);}
  }
  function annotationPoint(ev){
    const rect=annotation.canvas.getBoundingClientRect();
    return {x:Math.min(annotation.canvas.width,Math.max(0,(ev.clientX-rect.left)*annotation.canvas.width/rect.width)),
      y:Math.min(annotation.canvas.height,Math.max(0,(ev.clientY-rect.top)*annotation.canvas.height/rect.height))};
  }
  function annotationPaint(ctx,s){
    const scale=Math.max(1,annotation.canvas.width/800);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.width*scale;
    if(s.tool==='marker')ctx.globalAlpha=.28;
    if(s.tool==='eraser')ctx.globalCompositeOperation='destination-out';
    if(s.tool==='text'){ctx.font=`${Math.round(18*s.width*scale/4)}px "Segoe UI",sans-serif`;ctx.fillText(s.text,s.points[0].x,s.points[0].y);ctx.restore();return;}
    const p=s.points;if(!p.length){ctx.restore();return;}
    if(s.tool==='rectangle'){const a=p[0],b=p.at(-1);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
    else if(s.tool==='line'){ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);ctx.lineTo(p.at(-1).x,p.at(-1).y);ctx.stroke();}
    else {ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);if(p.length===1){ctx.lineTo(p[0].x+.01,p[0].y+.01);}else for(const v of p.slice(1))ctx.lineTo(v.x,v.y);ctx.stroke();}
    ctx.restore();
  }
  function annotationRedraw(){
    if(!annotation)return;
    const {ctx,canvas}=annotation;ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const stroke of annotation.strokes)annotationPaint(ctx,stroke);
    if(annotation.current)annotationPaint(ctx,annotation.current);
  }
  async function annotationPointerDown(ev){
    if(!annotation||ev.button!==0)return;
    const p=annotationPoint(ev);
    const a=annotation;
    if(a.tool==='text'){
      const text=window.prompt('Annotation text');
      if(text?.trim()){a.strokes.push({tool:'text',points:[p],color:a.color,width:a.width,text:text.slice(0,250)});annotationRedraw();}
      return;
    }
    a.current={tool:a.tool,color:a.color,width:a.width,points:[p]};
    a.canvas.setPointerCapture(ev.pointerId);
    annotationRedraw();
  }
  function annotationPointerMove(ev){
    const a=annotation;
    if(!a?.current)return;
    const p=annotationPoint(ev);
    if(['line','rectangle'].includes(a.current.tool))a.current.points=[a.current.points[0],p];
    else a.current.points.push(p);
    annotationRedraw();
  }
  function annotationPointerUp(ev){
    const a=annotation;if(!a?.current)return;
    a.strokes.push(a.current);a.current=null;annotationRedraw();
    if(a.canvas.hasPointerCapture(ev.pointerId))a.canvas.releasePointerCapture(ev.pointerId);
  }
  function closeAnnotator(){
    if(!annotation)return;
    annotation.host.innerHTML='';
    document.removeEventListener('keydown',annotationKeys,true);
    URL.revokeObjectURL(annotation.url);
    annotation=null;
  }
  function annotationKeys(e){
    if(!annotation)return;
    if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();closeAnnotator();}
    else if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.stopImmediatePropagation();e.preventDefault();annotation.strokes.pop();annotationRedraw();}
  }
  async function saveAnnotation(){
    const a=annotation;if(!a||!a.strokes.length){notify('Nothing to save yet.');return;}
    try{
      const output=document.createElement('canvas');output.width=a.canvas.width;output.height=a.canvas.height;
      const ctx=output.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,output.width,output.height);
      ctx.drawImage(a.image,0,0);ctx.drawImage(a.canvas,0,0);
      const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
      if(!blob)throw Error('Could not export annotation.');
      const original=a.entry.name.replace(/\.[^.]+$/,'');
      const name=await uniqueName(a.dir,`${original}-annotated.png`);
      const handle=await a.dir.getFileHandle(name,{create:true});
      const writer=await handle.createWritable();await writer.write(blob);await writer.close();
      closeAnnotator();
      await refreshCurrent();const idx=state.visible.findIndex(e=>e.name===name);if(idx>=0)await openIndex(idx);
      notify(`Saved ${name}`);
    }catch(err){console.error(err);notify(`Annotation save failed: ${err.message}`);}
  }
  const baseAct=act;
  act=async function(action){
    if(action==='new-menu'){
      const button=document.querySelector('[data-action="new-menu"]'),r=button.getBoundingClientRect();
      return menu([{action:'new-folder',icon:'plusFolder',label:'Folder'},{action:'new-file',icon:'newFile',label:'Markdown / text'},{action:'new-image',icon:'photoPlus',label:'White JPG · 1600 × 900'}],r.left,r.bottom+8);
    }
    if(action==='new-image'){ $('context').hidden=true;return createBlankImage(); }
    if(action==='annotate-image')return openAnnotator();
    if(action==='edit-svg')return editSvg();
    if(action==='group-menu'){
      const r=document.querySelector('[data-action="group-menu"]').getBoundingClientRect();
      return menu([{action:'group-none',icon:'list',label:'No grouping'},{action:'group-type',icon:'group',label:'By type'},{action:'group-date',icon:'group',label:'By date'}],r.left,r.bottom+8);
    }
    if(action.startsWith('view-')){
      const view=action.slice(5);if(!views.has(view))return;
      state.view=view;localStorage.setItem('fold-view',view);state.galleryLimit=160;
      $('file-scroller').scrollTop=0;renderVirtual();return;
    }
    if(action.startsWith('group-')){
      const group=action.slice(6);if(!groups.has(group))return;
      $('context').hidden=true;state.group=group;localStorage.setItem('fold-group',group);
      state.layout=null;fileList.scrollTop=0;renderVirtual();return;
    }
    if(action==='more'){
      const r=$('more-button').getBoundingClientRect();
      return menu([{action:'new-folder',icon:'plusFolder',label:'New folder'},{action:'new-file',icon:'newFile',label:'New Markdown file'},{action:'new-image',icon:'photoPlus',label:'New white JPG'},{action:'import',icon:'upload',label:'Import files'},{divider:true},{action:'paste',icon:'paste',label:'Paste',disabled:!state.clipboard},{action:'select-all',icon:'check',label:'Select all'}],r.left,r.bottom+7);
    }
    return baseAct(action);
  };
  document.addEventListener('click',e=>{
    const tool=e.target.closest('[data-anno-tool]');
    if(tool&&annotation){
      annotation.tool=tool.dataset.annoTool;
      annotation.host.querySelectorAll('.anno-tool').forEach(b=>b.classList.toggle('pressed',b===tool));
      return;
    }
    const a=e.target.closest('[data-anno-action]');
    if(a&&annotation){
      if(a.dataset.annoAction==='close')closeAnnotator();
      if(a.dataset.annoAction==='undo'){annotation.strokes.pop();annotationRedraw();}
      if(a.dataset.annoAction==='save')void saveAnnotation();
    }
  });
  document.addEventListener('input',e=>{
    if(!annotation)return;
    if(e.target.id==='anno-color')annotation.color=e.target.value;
    if(e.target.id==='anno-width')annotation.width=Number(e.target.value);
  });
  document.addEventListener('keydown',e=>{
    if(e.target.id==='preview-editor'&&e.key==='Tab'){
      e.preventDefault();const el=e.target,p=el.selectionStart,q=el.selectionEnd;
      el.value=el.value.slice(0,p)+'  '+el.value.slice(q);el.selectionStart=el.selectionEnd=p+2;
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });
  fileList.addEventListener('scroll',()=>{
    if(state.view!=='gallery'||state.galleryLimit>=state.visible.length)return;
    if(fileList.scrollTop+fileList.clientHeight>=fileList.scrollHeight-700){
      state.galleryLimit+=160;renderVirtual();
    }
  },{passive:true});
  // Restore footer-free UI and the chosen view immediately.
  updateViewButtons();
})();
void init();
