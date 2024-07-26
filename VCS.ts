import { Entry, TreeEntry, Tree, Hash } from './VCSType';
import * as path from 'path';
import * as fs from 'fs';
import { hashFile, writeFile, deleteFile, readFile, readDir, hashEntries } from './utils';

interface IRepository { }

export default class Repository {
  workingDirectory = '/'
  repository = '.md-vcs';
  refs = 'refs'; // hash values for local, remote
  branches = 'branches'; // hash values for branches
  objects = 'objects'; // hash value and contents for tree, blob, commit. Folder + file = hash value
  head = 'HEAD'; // pointer for current revision
  origingHead = 'ORIG_HEAD'; // hash value for remote head
  config = 'CONFIG'; // information including url for remote server, name of current branch, etc
  commit = 'commit' // hash value for root tree
  index = 'index'

  constructor(dir: string) { 
    this.workingDirectory = dir;
    this.repository = path.join(dir, this.repository);
  }

  public async init() { 
    // 1. Check this folder already initialized or not
    if (fs.existsSync(this.repository)) {
      console.log('Repository already exists!');
      return;
    } else {
      this.writeCommit("");
    } 
  }

  private createCommit() { 
    
  }
  public add(p: string) {
    let rootEntry: Entry = this.readIndex();
    const relativePath: string[] = path.relative(this.workingDirectory, p).split('/');
    this.addEntry(rootEntry, p);
    
    //add tree under "p" to "tree"
    //store new tree to "index" file
  }
  private addEntry(entry: Entry, p: string) {
    if (p.length === 0)
      return [];

    
  }
  
  private createBlob(p: string) {
    const content = readFile(p).content;
    const hash = hashFile(p);
    this.createObject(hash, content);
    return hash;
  }



  

  private writeCommit(hash: string) {
    const p = path.join(this.repository, this.commit);
    const status = writeFile(p, hash);
    if (!status.status)
      console.log(status.content);
  }
  private readCommit(): string {
    const p = path.join(this.repository, this.commit);
    const status = readFile(p);
    if (!status.status)
      return "";
    return status.content;
  }
  private readIndex(): Entry {
    const status = readFile(path.join(this.repository, this.index));
    if (!status.status)
      return {name: '.', type: 'directory', hash: "", entries: []};
    return JSON.parse(status.content);
  }
  private writeIndex(Entry: Entry) {
    const content = JSON.stringify(Entry);
    writeFile(path.join(this.repository, this.index), content);
  }
  

  


  private hashToObjectPath(hash: string): string {
    return path.join(this.repository, this.objects, hash.slice(0, 2), hash.slice(2));
  }
  private readObject(hash: string) {
    if (!hash)
      return;

    const p = this.hashToObjectPath(hash);
    const status = readFile(p);
    if (status.status)
      return status.content;
  }
  private createObject(hash: string, content: string) {
    if (!hash)
      return;
    
    const p = this.hashToObjectPath(hash);
    const status = writeFile(p, content);
    if (!status.status) {
      console.log('Error creating file through path: ', path);
      console.log(status.content);
    }
  }
  private removeObject(hash: string) {
    if (!hash)
      return;

    const p = this.hashToObjectPath(hash);
    const status = deleteFile(p);
    if (!status.status) {
      console.log('Error deleting file through path: ', path);
      console.log(status.content);
    }
  }


  private getEditScript() { }
  private applyEditScript() { }
  public checkout() { }

  public switchBranch() { }
  public createBranch() { }
  public removeBranch() { }



  public log() { } // this may not needed because of visualized version control system
}