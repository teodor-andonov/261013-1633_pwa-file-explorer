// Deterministic in-memory File System Access adapter for data-safety tests.
const fsError=(name,message)=>Object.assign(new Error(message||name),{name});
const bytesOf=async value=>{
  if(typeof value==='string')return new TextEncoder().encode(value);
  if(value instanceof Uint8Array)return new Uint8Array(value);
  if(typeof value?.arrayBuffer==='function')return new Uint8Array(await value.arrayBuffer());
  throw new Error('Unsupported test file data');
};

export class MockFile {
  kind='file';
  constructor(name,content='',parent=null){
    this.name=name;this.parent=parent;
    this.bytes=typeof content==='string'?new TextEncoder().encode(content):new Uint8Array(content);
  }
  async isSameEntry(other){return this===other;}
  async getFile(){
    const blob=new Blob([this.bytes]);
    return Object.assign(blob,{name:this.name,lastModified:1730000000000});
  }
  async createWritable(){
    const node=this;let pending=null;
    return {
      async write(value){pending=await bytesOf(value);},
      async close(){
        node.bytes=pending||new Uint8Array();
        if(node.parent?.corruptWrites){
          node.bytes=new TextEncoder().encode('CORRUPTED');
        }
      },
      async abort(){pending=null;}
    };
  }
}

export class MockDirectory {
  kind='directory';
  constructor(name,parent=null){
    this.name=name;this.parent=parent;this.children=new Map();this.corruptWrites=false;
    this.denyRemoval=new Set();
  }
  async isSameEntry(other){return this===other;}
  async getFileHandle(name,{create=false}={}){
    const found=this.children.get(name);
    if(found){
      if(found.kind!=='file')throw fsError('TypeMismatchError');
      return found;
    }
    if(!create)throw fsError('NotFoundError');
    const file=new MockFile(name,'',this);this.children.set(name,file);return file;
  }
  async getDirectoryHandle(name,{create=false}={}){
    const found=this.children.get(name);
    if(found){
      if(found.kind!=='directory')throw fsError('TypeMismatchError');
      return found;
    }
    if(!create)throw fsError('NotFoundError');
    const dir=new MockDirectory(name,this);
    dir.corruptWrites=this.corruptWrites;
    this.children.set(name,dir);return dir;
  }
  async removeEntry(name,{recursive=false}={}){
    if(this.denyRemoval.has(name))throw fsError('NotAllowedError','Simulated delete permission denied');
    const found=this.children.get(name);if(!found)throw fsError('NotFoundError');
    if(found.kind==='directory'&&!recursive&&found.children.size)
      throw fsError('InvalidModificationError');
    this.children.delete(name);
  }
  async *entries(){for(const item of [...this.children])yield item;}
  async resolve(other){
    let current=other;const parts=[];
    while(current&&current!==this){parts.unshift(current.name);current=current.parent;}
    return current===this?parts:null;
  }
  async addFile(name,content=''){
    const handle=await this.getFileHandle(name,{create:true});
    const writer=await handle.createWritable();await writer.write(content);await writer.close();
    return handle;
  }
  async addFolder(name){return this.getDirectoryHandle(name,{create:true});}
}
