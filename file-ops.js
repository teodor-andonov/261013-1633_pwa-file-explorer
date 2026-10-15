// Fold local-file transfer engine. Zero dependencies, no network access.
// Explicit two-stage writes: stage -> verify -> publish -> verify -> (optional) remove source.
// NOTE: the File System Access API cannot make cross-directory moves truly atomic.

export class TransferError extends Error {
  constructor(message, code='TRANSFER_FAILED') {
    super(message);
    this.name='TransferError';
    this.code=code;
  }
}

const failIfAborted = signal => {
  if(signal?.aborted) throw new TransferError('Transfer cancelled','CANCELLED');
};

async function lookup(dir,name) {
  for (const method of ['getFileHandle','getDirectoryHandle']) {
    try { return await dir[method](name); }
    catch(error) {
      if(error?.name==='TypeMismatchError')continue;
      if(error?.name!=='NotFoundError')throw error;
    }
  }
  return null;
}

async function uniqueName(dir,requested) {
  let candidate=requested;
  const p=requested.lastIndexOf('.');
  const split=p>0?[requested.slice(0,p),requested.slice(p)]:[requested,''];
  for(let i=2;i<100001;i++) {
    if(!await lookup(dir,candidate))return candidate;
    candidate=split[0]+' ('+i+')'+split[1];
  }
  throw new TransferError('Could not allocate a unique destination name','CONFLICT');
}

async function compareFiles(source,dest,{signal,blockSize=1024*1024}={}) {
  const [a,b]=await Promise.all([source.getFile(),dest.getFile()]);
  if(a.size!==b.size)return false;
  for(let offset=0;offset<a.size;offset+=blockSize) {
    failIfAborted(signal);
    const end=Math.min(offset+blockSize,a.size);
    const [ab,bb]=await Promise.all([a.slice(offset,end).arrayBuffer(),b.slice(offset,end).arrayBuffer()]);
    const x=new Uint8Array(ab),y=new Uint8Array(bb);
    if(x.length!==y.length)return false;
    for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;
  }
  return true;
}

export async function verifyCopy(source,dest,{signal}={}) {
  failIfAborted(signal);
  if(source.kind!==dest.kind)return false;
  if(source.kind==='file')return compareFiles(source,dest,{signal});
  const sourceNames=[];
  for await(const [name,child] of source.entries()) {
    failIfAborted(signal);
    sourceNames.push(name);
    const copied=await lookup(dest,name);
    if(!copied||!await verifyCopy(child,copied,{signal}))return false;
  }
  let destCount=0;
  for await(const item of dest.entries()) {
    failIfAborted(signal);
    destCount++;
  }
  return sourceNames.length===destCount;
}

async function copyRecursive(source,dir,name,{signal}={}) {
  failIfAborted(signal);
  if(source.kind==='file') {
    const dest=await dir.getFileHandle(name,{create:true});
    const sourceFile=await source.getFile();
    const writer=await dest.createWritable();
    try {
      failIfAborted(signal);
      await writer.write(sourceFile);
      failIfAborted(signal);
      await writer.close();
    }catch(error) {
      try{await writer.abort();}catch{}
      throw error;
    }
    return dest;
  }
  const dest=await dir.getDirectoryHandle(name,{create:true});
  for await(const [childName,child] of source.entries()) {
    failIfAborted(signal);
    await copyRecursive(child,dest,childName,{signal});
  }
  return dest;
}

async function targetIsInside(source,dest) {
  if(source.kind!=='directory')return false;
  if(typeof source.isSameEntry==='function'&&await source.isSameEntry(dest))return true;
  if(typeof source.resolve==='function')return (await source.resolve(dest))!==null;
  return false;
}

function stageName() {
  return '.fold-transfer-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
}

/**
 * @param {object} args
 * @param {{name:string,handle:object}[]} args.items
 * @param {FileSystemDirectoryHandle} args.sourceDir
 * @param {FileSystemDirectoryHandle} args.destinationDir
 * @param {'copy'|'move'} args.mode
 * @param {function} [args.onProgress] Called with (phase,item,total,completed)
 * @param {AbortSignal} [args.signal]
 * @param {string|null} [args.renameTo] Only for a single item; never overwrite.
 */
export async function transferItems({
  items,sourceDir,destinationDir,mode='copy',renameTo=null,onProgress=()=>{},signal=null
}) {
  if(!['copy','move'].includes(mode))throw new TypeError('Transfer mode must be copy or move.');
  if(!Array.isArray(items)||!sourceDir||!destinationDir)throw new TypeError('Missing transfer handles.');
  if(renameTo!==null&&items.length!==1)throw new TypeError('Rename is only supported for one item.');
  if(renameTo!==null&&(!renameTo.trim()||/[/\\]/.test(renameTo)))throw new TypeError('Invalid destination filename.');
  const report={completed:0,copied:0,moved:0,failed:[],warnings:[],cancelled:false,outputs:[],total:items.length};
  const emit=(phase,item)=>onProgress({phase,item,total:items.length,completed:report.completed,mode});
  for(const item of items) {
    let stage=null,createdFinal=null,stageFolderName=null;
    const notifyFailure=(error)=>{
      const code=error?.code||error?.name||'ERROR';
      report.failed.push({name:item.name,code,message:error?.message||String(error)});
      emit('failed',item.name);
    };
    try {
      failIfAborted(signal);
      if(!item.handle||!item.name)throw new TransferError('Invalid source entry','INVALID_SOURCE');
      if(await targetIsInside(item.handle,destinationDir))
        throw new TransferError('Cannot transfer a folder into itself or a descendant','SELF_TRANSFER');
      const sameParent=typeof sourceDir.isSameEntry==='function'&&await sourceDir.isSameEntry(destinationDir);
      if(sameParent&&mode==='move'&&(!renameTo||renameTo===item.name)) {
        report.completed++;emit('skipped',item.name);continue;
      }
      const desired=renameTo??item.name;
      const target=renameTo!==null?desired:await uniqueName(destinationDir,desired);
      if(renameTo!==null&&await lookup(destinationDir,target))
        throw new TransferError('The destination name already exists','CONFLICT');
      emit('copying',item.name);
      stageFolderName=stageName();
      // The temporary folder is the only object created before the full source copy verifies.
      stage=await destinationDir.getDirectoryHandle(stageFolderName,{create:true});
      const temporary=await copyRecursive(item.handle,stage,item.name,{signal});
      emit('verifying',item.name);
      if(!await verifyCopy(item.handle,temporary,{signal}))
        throw new TransferError('Staged copy failed byte verification','VERIFY_FAILED');
      failIfAborted(signal);
      if(await lookup(destinationDir,target))
        throw new TransferError('Destination was created during the transfer','CONFLICT');
      emit('publishing',item.name);
      // .move() can exist for file handles but is not guaranteed for directories.
      let published=null;
      if(typeof temporary.move==='function') {
        try {
          await temporary.move(destinationDir,target);
          published=await lookup(destinationDir,target);
        }catch(error) {
          if(!['NotSupportedError','InvalidModificationError','NotAllowedError'].includes(error?.name))
            throw error;
        }
      }
      if(!published) {
        createdFinal=target;
        published=await copyRecursive(temporary,destinationDir,target,{signal});
      }
      // The source may be modified while copying; confirm final contents match current source.
      emit('verifying-final',item.name);
      if(!await verifyCopy(item.handle,published,{signal}))
        throw new TransferError('Final copy failed byte verification; source kept','VERIFY_FAILED');
      if(mode==='move') {
        failIfAborted(signal);
        emit('removing-source',item.name);
        try {
          await sourceDir.removeEntry(item.name,{recursive:item.handle.kind==='directory'});
          report.moved++;
        }catch(error) {
          report.failed.push({name:item.name,code:'COPIED_NOT_REMOVED',
            message:'Copy verified, but original could not be removed: '+error.message});
          report.outputs.push({name:item.name,target,kind:'copy',retainedSource:true});
          report.copied++;
          report.completed++;
          continue;
        }
      }else report.copied++;
      report.outputs.push({name:item.name,target,kind:mode});
      report.completed++;
      emit('completed',item.name);
    }catch(error) {
      if(error?.code==='CANCELLED')report.cancelled=true;
      notifyFailure(error);
      // A file we created as final but could not verify must not be left looking successful.
      if(createdFinal!==null) {
        try { await destinationDir.removeEntry(createdFinal,{recursive:true}); }
        catch(cleanError) {
          report.warnings.push({name:item.name,message:'Could not remove partial target "'+createdFinal+'": '+cleanError.message});
        }
      }
      if(report.cancelled)break;
    }finally {
      if(stageFolderName!==null) {
        try {await destinationDir.removeEntry(stageFolderName,{recursive:true});}
        catch(error) {report.warnings.push({name:item.name,message:'Temporary staging cleanup failed: '+error.message});}
      }
    }
  }
  emit('finished','');
  return report;
}
