// Fold v3: interface enhancements, file-type language, drag/drop and splitters.
// Files stay local; the drag payload is never serialized to a URL or sent over the network.
const typeHues = {
  md:155,txt:206,json:278,js:44,mjs:47,jsx:36,ts:212,tsx:214,py:194,
  html:12,htm:14,css:227,scss:310,svg:330,xml:20,yaml:85,yml:85,toml:85,
  pdf:355,doc:211,docx:211,xls:145,xlsx:145,csv:160,ppt:23,pptx:23,
  png:315,jpg:326,jpeg:326,webp:300,gif:288,bmp:280,avif:290,
  mp4:270,mov:261,webm:263,mp3:195,wav:193,flac:183,
  zip:26,rar:31,'7z':36,blend:29,'3dm':203,ifc:161,glb:200,gltf:202,obj:205,stl:207,fbx:199,
  rs:22,go:184,java:28,cpp:222,h:224,cs:261,sql:152,sh:124,bat:110,ps1:215
};
const displayExt={markdown:'MD',javascript:'JS',typescript:'TS',jpeg:'JPG',docx:'DOC',xlsx:'XLS',pptx:'PPT'};
export function typeIcon(entry,svg,fileIcon,ext) {
  if(entry.handle.kind==='directory')return '<span class="type-folder" aria-hidden="true">'+svg('folder')+'</span>';
  const suffix=ext(entry.name)||'file',short=displayExt[suffix]||suffix.toUpperCase().slice(0,4);
  const hue=typeHues[suffix]??((Array.from(suffix).reduce((n,c)=>n*31+c.charCodeAt(0),7)>>>0)%360);
  const icon=svg(fileIcon(entry));
  return '<span class="type-icon" style="--type-h:'+hue+'" aria-hidden="true"><span class="type-symbol">'+icon+'</span><span class="type-ext">'+short+'</span></span>';
}
export function enhancePreview({$,svg,chosen,ext,act}) {
  const host=$('preview-content'),entry=chosen();
  if(!entry||entry.handle.kind!=='file')return;
  const editor=$('preview-editor');
  if(editor && !host.querySelector('[data-edit-toggle]')){
    const toolbar=[...host.querySelectorAll('.preview-toolstrip')].find(bar=>bar.querySelector('button[title^="Toggle"]'));
    const originalToggle=toolbar?.querySelector('button[title^="Toggle"]');
    if(originalToggle){
      // Reuse v2's rendered Markdown/code reader. Editing is opt-in, never the initial state.
      originalToggle.click();
      originalToggle.hidden=true;
      const saveButton=$('preview-save');
      if(saveButton)saveButton.hidden=true;
      const control=document.createElement('button');
      control.type='button';control.className='tool-button';control.dataset.editToggle='true';
      control.title='Edit file';control.setAttribute('aria-label','Edit file');
      control.innerHTML=svg('edit');
      toolbar.prepend(control);
      let editing=false;
      const switchMode=(force)=>{
        const desired=typeof force==='boolean'?force:!editing;
        if(editing===desired)return;
        originalToggle.click();
        if(!desired)host.querySelector('.code-render,.markdown-render')?.addEventListener('dblclick',()=>switchMode(true));
        editing=desired;
        control.title=editing?'Preview file':'Edit file';
        control.setAttribute('aria-label',control.title);
        control.innerHTML=svg(editing?'preview':'edit');
        control.classList.toggle('pressed',editing);
        if(saveButton)saveButton.hidden=!editing;
        if(editing){editor.focus();}
      };
      control.addEventListener('click',()=>switchMode());
      host.querySelector('.code-render,.markdown-render')?.addEventListener('dblclick',()=>switchMode(true));
    }
  }
  if(host.querySelector('.preview-visual img')&&!host.dataset.previewDblBound){
    host.dataset.previewDblBound='1';
    // Listener on the stable host survives the asynchronous preview rebuilds.
  }
}
export function installV3(api){
  const {state,$,fileList,notify,svg,active,getSelected,selectIndex,ensurePermission,getDir,
    uniqueName,copyEntry,isDescendantOf,refreshCurrent,chosen,act,ext}=api;
  const left=$('sidebar-resizer'),right=$('preview-resizer');
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const railSetting=Number(localStorage.getItem('fold-rail-width'));
  const previewSetting=Number(localStorage.getItem('fold-preview-width'));
  if(railSetting>=120&&railSetting<=440)document.documentElement.style.setProperty('--fold-rail-width',railSetting+'px');
  if(previewSetting>=260&&previewSetting<=920)document.documentElement.style.setProperty('--fold-preview-width',previewSetting+'px');
  function resizer(element,side){
    if(!element)return;
    const property=side==='left'?'--fold-rail-width':'--fold-preview-width';
    const key=side==='left'?'fold-rail-width':'fold-preview-width';
    const defaultValue=side==='left'?174:410;
    const panel=side==='left'?document.querySelector('.sidebar'):$('preview');
    let gesture=null;
    function constrain(value){
      const min=side==='left'?120:260;
      const max=side==='left'?Math.min(420,innerWidth-360):Math.min(820,innerWidth-320);
      return clamp(Math.round(value),min,Math.max(min,max));
    }
    function apply(value,persist=false){
      const next=constrain(value);
      document.documentElement.style.setProperty(property,next+'px');
      element.setAttribute('aria-valuenow',String(next));
      if(persist)localStorage.setItem(key,String(next));
    }
    function move(e){
      if(!gesture||e.pointerId!==gesture.pointerId)return;
      const multiplier=side==='left'?1:-1;
      apply(gesture.width+multiplier*(e.clientX-gesture.x));
    }
    function endDrag(e){
      if(!gesture||e.pointerId!==gesture.pointerId)return;
      e.preventDefault();
      gesture=null;
      document.documentElement.classList.remove('fold-resizing');
      window.removeEventListener('pointermove',move,true);
      window.removeEventListener('pointerup',endDrag,true);
      window.removeEventListener('pointercancel',endDrag,true);
      apply(panel.getBoundingClientRect().width,true);
    }
    element.addEventListener('pointerdown',e=>{
      if(e.button!==0||gesture)return;
      e.preventDefault();e.stopPropagation();
      gesture={pointerId:e.pointerId,x:e.clientX,width:panel.getBoundingClientRect().width};
      document.documentElement.classList.add('fold-resizing');
      window.addEventListener('pointermove',move,true);
      window.addEventListener('pointerup',endDrag,true);
      window.addEventListener('pointercancel',endDrag,true);
    });
    element.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;
      e.preventDefault();
      const direction=e.key==='ArrowRight'?1:-1;
      const width=e.key==='Home'?defaultValue:panel.getBoundingClientRect().width+direction*(side==='left'?1:-1)*(e.shiftKey?40:12);
      apply(width,true);
    });
    element.addEventListener('dblclick',()=>{
      apply(defaultValue,true);
    });
    element.setAttribute('aria-valuemin',side==='left'?'120':'260');
    element.setAttribute('aria-valuemax',side==='left'?'420':'820');
    apply(panel.getBoundingClientRect().width);
  }
  resizer(left,'left');
  resizer(right,'right');

  // One compact scale control; each view remembers its own item size.
  const sizeInput=$('item-size');
  const sizeDefaults={list:40,table:40,gallery:142};
  const sizeBounds={list:[30,74,2],table:[30,74,2],gallery:[100,300,2]};
  function setSizeForView(){
    if(!sizeInput)return;
    const view=state.view||'list';
    const [min,max,step]=sizeBounds[view]||sizeBounds.list;
    const stored=Number(localStorage.getItem('fold-item-size-'+view));
    const value=Number.isFinite(stored)&&stored>=min&&stored<=max?stored:sizeDefaults[view];
    sizeInput.min=String(min);sizeInput.max=String(max);
    sizeInput.step=String(step);sizeInput.value=String(value);
    updateSize(value,false);
  }
  function updateSize(value,remember=true){
    const view=state.view||'list';
    const [min,max]=sizeBounds[view]||sizeBounds.list;
    const n=clamp(Math.round(value),min,max);
    sizeInput.value=String(n);
    sizeInput.title='Item size: '+n+'px';
    sizeInput.setAttribute('aria-valuetext',view==='gallery'?n+' pixel gallery tiles':n+' pixel rows');
    if(view==='gallery'){
      document.documentElement.style.setProperty('--fold-tile-min',n+'px');
      document.documentElement.style.setProperty('--fold-tile-height',Math.round(n*.91)+'px');
    }else{
      state.itemSize=n;
      document.documentElement.style.setProperty('--row',n+'px');
    }
    if(remember)localStorage.setItem('fold-item-size-'+view,String(n));
    api.renderVirtual();
  }
  sizeInput?.addEventListener('input',e=>updateSize(Number(e.target.value)));
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-action^="view-"]'))requestAnimationFrame(setSizeForView);
  });
  setSizeForView();

  // Native drag/drop is used only as a UI gesture. Actual moves are permission-aware.
  let drag=null,hover=null;
  const highlight=el=>{
    if(hover===el)return;
    hover?.classList.remove('fold-drop-target');
    hover=el;hover?.classList.add('fold-drop-target');
  };
  const rowEntry=target=>{
    const row=target.closest('[data-row]');
    if(!row)return null;
    const index=Number(row.dataset.row);
    if(!Number.isInteger(index))return null;
    return {row,entry:state.visible[index],index};
  };
  function destinationTarget(target) {
    const tab=target.closest('[data-root]');
    if(tab){
      const root=state.roots.find(r=>r.id===tab.dataset.root);
      return root?{element:tab,root,path:[...root.path]}:null;
    }
    const crumb=target.closest('[data-crumb]');
    if(crumb&&active())return {element:crumb,root:active(),path:active().path.slice(0,Number(crumb.dataset.crumb))};
    const row=rowEntry(target);
    if(row){
      if(row.entry?.handle.kind!=='directory')return null;
      return {element:row.row,root:active(),path:[...active().path,row.entry.name]};
    }
    if(target.closest('#file-scroller')&&active())return {element:fileList,root:active(),path:[...active().path]};
    return null;
  }
  document.addEventListener('dragstart',e=>{
    const row=rowEntry(e.target);
    if(!row||!state.dir)return;
    const selected=state.selected.has(row.entry.name)?getSelected():[row.entry];
    if(!state.selected.has(row.entry.name)){
      state.selected=new Set([row.entry.name]);
      state.anchor=row.index;
      // Avoid re-rendering synchronously while the drag starts.
    }
    drag={root:active(),parent:state.dir,path:[...active().path],items:selected.map(x=>({name:x.name,handle:x.handle}))};
    e.dataTransfer.effectAllowed='copyMove';
    e.dataTransfer.setData('application/x-fold-internal','fold');
    e.dataTransfer.setData('text/plain',selected.map(x=>x.name).join('\n'));
  });
  document.addEventListener('dragenter',e=>{
    if(!drag)return;
    e.preventDefault();e.stopPropagation();
  },true);
  document.addEventListener('dragover',e=>{
    if(!drag)return;
    e.preventDefault();e.stopPropagation();
    const dest=destinationTarget(e.target);
    highlight(dest?.element||null);
    e.dataTransfer.dropEffect=dest?(e.ctrlKey?'copy':'move'):'none';
  },true);
  document.addEventListener('dragleave',e=>{
    if(!drag)return;
    if(!document.elementFromPoint(e.clientX,e.clientY))highlight(null);
    e.stopPropagation();
  },true);
  document.addEventListener('dragend',()=>{
    drag=null;highlight(null);
  },true);
  document.addEventListener('drop',e=>{
    if(!drag)return;
    e.preventDefault();e.stopPropagation();
    const job=drag,copy=Boolean(e.ctrlKey),dest=destinationTarget(e.target);
    drag=null;highlight(null);
    if(!dest){notify('Drop onto a folder, sidebar tab or breadcrumb.');return;}
    void performDrop(job,dest,copy);
  },true);
  async function performDrop(job,target,copy){
    try{
      const {root,path}=target;
      if(!await ensurePermission(root.handle,true))throw Error('Destination folder permission required.');
      const dir=await getDir({...root,path});
      if(!copy&&await job.parent.isSameEntry(dir)){notify('Already in this folder.');return;}
      let finished=0;const errors=[];
      for(const item of job.items){
        let destinationName=null;
        try{
          if(await isDescendantOf(dir,item.handle))throw Error('Cannot place a folder inside itself.');
          destinationName=await uniqueName(dir,item.name);
          await copyEntry(item.handle,dir,destinationName);
          if(!copy)await job.parent.removeEntry(item.name,{recursive:item.handle.kind==='directory'});
          finished++;
        }catch(error){
          // Copies can fail midway. Do not remove the source on error.
          errors.push(item.name+': '+error.message);
          // A partial target may exist. Leave it untouched for inspection rather than erasing data.
        }
      }
      await refreshCurrent(true);
      notify(errors.length?finished+' transferred · '+errors.length+' failed ('+errors[0]+')':finished+' item'+(finished===1?'':'s')+(copy?' copied':' moved'));
    }catch(err){console.error('Fold drop',err);notify('Transfer failed: '+err.message);}
  }
  // A read-only image preview is double-clicked to start image editing/sketching.
  $('preview-content').addEventListener('dblclick',e=>{
    if(!e.target.closest('.preview-visual img'))return;
    const entry=chosen();if(!entry)return;
    if(ext(entry.name)==='svg')void act('edit-svg');
    else if(['png','jpg','jpeg'].includes(ext(entry.name)))void act('annotate-image');
  });
}
