import * as path from 'path';
import * as fs from 'fs';
import { computeHash } from './hash';

type Index = {
  name: string;
  type: 'blob' | 'tree';
  entries: Index[];
};

type Entry = {
  name: string;
  type: 'blob' | 'tree';
  hash: string;
}
type Blob = {
  content: string;
};
type Tree = {
  entries: Entry[];
}

type Commit = {
  message: string;
  hash: string; //pointer to root tree
}

export default class Repository {
  WORKDIR = '/'
  REPOSITORY = '.vcs';
  // refs = 'refs'; // hash values for local, remote
  // branches = 'branches'; // hash values for branches
  OBJECTS = 'objects'; // hash value and contents for tree, blob, commit. Folder + file = hash value
  // head = 'HEAD'; // pointer for current revision
  // origingHead = 'ORIG_HEAD'; // hash value for remote head
  // config = 'CONFIG'; // information including url for remote server, name of current branch, etc
  COMMIT = 'COMMIT' // hash value for commit object
  INDEX = 'INDEX'
  vcsignore = '.vcsignore'

  constructor(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, this.REPOSITORY);
    this.COMMIT = path.join(this.REPOSITORY, this.COMMIT);
    this.INDEX = path.join(this.REPOSITORY, this.INDEX);
    this.OBJECTS = path.join(this.REPOSITORY, this.OBJECTS);
    this.vcsignore = path.join(this.WORKDIR, this.vcsignore);

    this.init();
  }

  public init() { 
    // 1. Check this folder already initialized or not
    if (fs.existsSync(this.REPOSITORY)) {
      console.log('Repository already exists');
    } else {
      fs.mkdirSync(this.REPOSITORY);
      
      // store default tree object
      const tree: Tree = {
        entries: []
      };
      const treeHash = this.hashTree(tree);
      this.createObject(treeHash, tree);
      this.setCommit({message: "initial commit", hash:treeHash});

      // init index
      this.setIndex({
        name: path.basename(this.WORKDIR),
        type: 'tree',
        entries: []
      });
    }
  }

  public commit(message: string) { 
    try {
      const index: Index = this.getIndex();
      console.log('(commit)index: ', index);
      const oldCommit: Commit = this.getCommit();
      console.log('(commit) old commit: ', oldCommit);
      const newCommitHash = this.treeStoreChange(this.WORKDIR, oldCommit.hash, index);
      if (newCommitHash !== oldCommit.hash)
        this.setCommit({message: message, hash: newCommitHash});

      return true;
    } catch (error) {
      console.log('(commit)', error);
      return false;
    }
  }

  private treeStoreChange(p: string, treeHash: string, index: Index): string {
    const oldTree: Tree = this.readObject(treeHash);
    console.log('(treeStoreChange) oldTree: ', oldTree);
    const oldM = new Map<string, Entry>(oldTree.entries.map((e: Entry) => [e.name, e]));

    const entries: Entry[] = index.entries.map((e: Index) => {
      const oldEntry: Entry | undefined = oldM.get(e.name);
      const newPath = path.join(p, e.name);
      //oldEntry가 Tree type이 아닐 수도 있음
      const isComparingPossible = oldEntry && oldEntry.type === e.type;
      if (e.type === 'blob') {
        return {
          name: e.name,
          type: 'blob',
          hash: isComparingPossible ? this.blobStoreChange(newPath, oldEntry.hash) : this.storeIndex(newPath, e)
        };
      } else { // type === 'tree'
        return {
          name: e.name,
          type: 'tree',
          hash: isComparingPossible ? this.treeStoreChange(newPath, oldEntry.hash, e) : this.storeIndex(newPath, e)
        };
      }
    });
    
    const newTree: Tree = { entries };
    const newTreeHash = this.hashTree(newTree);
    if (newTreeHash !== treeHash)
      this.createObject(newTreeHash, newTree);

    return newTreeHash;
  }
  private blobStoreChange(p: string, blobHash: string): string {
    const newBlob: Blob = {
      content: fs.readFileSync(p).toString()
    };

    const newBlobHash: string = this.hashBlob(newBlob);
    if (newBlobHash !== blobHash)
      this.createObject(newBlobHash, newBlob);

    return newBlobHash;
  }

  private storeIndex(p: string, index: Index): string {
    if (index.type === 'blob') {
      const Blob: Blob = {
        content: fs.readFileSync(p, 'utf-8').toString()
      };
      const blobHash = this.hashBlob(Blob);
      this.createObject(blobHash, Blob);
      return blobHash;
    } else {
      const entries: Entry[] = index.entries.map((e: Index) => {
        return {
          name: e.name,
          type: e.type,
          hash: this.storeIndex(path.join(p, e.name), e)
        };
      });

      const tree: Tree = { entries };
      const treeHash = this.hashTree(tree);
      this.createObject(treeHash, tree);
      return treeHash;
    }
  }

  private compareTreeEntry(p: string, treeEntry: Entry, index: Index): string {
    if (treeEntry.type !== index.type) {
      //create whole index
      return this.storeTreeEntry(p, index);
      
    } else if (index.type === 'blob') {
      // console.log(1, ' ', p);
      //get information of blob
      const content = fs.readFileSync(p, 'utf-8');
      const blobHash = computeHash(content);
      const blob: Blob = {
        content: content
      };
      //get information of tree entry
      const entry: Entry = {
        name: index.name,
        type: 'blob',
        hash: blobHash,
      };
      const entryHash = this.hashTreeEntry(entry);
      //store new blob
      if ( entryHash !== treeEntry.hash) {
        this.createObject(blobHash, blob);
        this.createObject(entryHash, entry);
      }
      return entryHash;

    } else { // both entries are tree type
      // console.log(2, ' ', p);
      const oldTree: Tree = this.readObject(treeEntry.hash);
      // console.log('(compareTreeEntry) index: ', index);
      console.log('(compareTreeEntry) tree entry: ', treeEntry);
      console.log('(compareTreeEntry) tree: ', oldTree);
      const oldM = new Map<string, Entry>(oldTree.entries.map((e: Entry) => [e.name, e]));
      const entries: Entry[] = index.entries.map((e: Index) => {
        const oldEntry: Entry | undefined = oldM.get(e.name);
        const newPath = path.join(p, e.name);
        // console.log('(compareTreeEntry) sub entry: ', e);
        // console.log('(compareTreeEntry) new path: ', newPath);
        let newHash = '';
        if (!oldEntry) {
          newHash = this.storeTreeEntry(newPath, e)
        } else {
          newHash = this.compareTreeEntry(newPath, oldEntry, e);
        }
        return {
          name: e.name,
          type: e.type,
          hash: newHash
        };
      });
      const newTree: Tree = { entries: entries };
      const newTreeHash = this.hashTree(newTree);
      const newTreeEntry: Entry = {
        name: index.name,
        type: 'tree',
        hash: newTreeHash
      };
      const newTreeEntryHash = this.hashTreeEntry(newTreeEntry);
      if (newTreeEntryHash !== treeEntry.hash) {
        this.createObject(newTreeHash, newTree);
        this.createObject(newTreeEntryHash, newTreeEntry);
      }
      return newTreeEntryHash;

    }
  }

  private storeTreeEntry(p: string, entry: Index): string {
    if (entry.type === 'blob') {
      const content: string = fs.readFileSync(p, 'utf-8');
      const blobHash = computeHash(content);
      const blob: Blob = { content: content };
      this.createObject(blobHash, blob);
      return blobHash;
      // const treeEntry: Entry = {
      //   ...entry,
      //   hash: blobHash
      // };
      // const treeEntryHash = this.hashTreeEntry(treeEntry);
      // this.createObject(treeEntryHash, treeEntry);
      // return treeEntryHash;
    } else {
      const entries: Entry[] = entry.entries.map((e: Index) => {
        return {
          name: e.name,
          type: e.type,
          hash: this.storeTreeEntry(path.join(p, e.name), e)
        };
      })
      const tree: Tree = { entries: entries };
      const treeHash = this.hashTree(tree);
      this.createObject(treeHash, tree);
      return treeHash;
      // const treeEntry: Entry = {
      //   name: entry.name,
      //   type: 'tree',
      //   hash: treeHash
      // };
      // const treeEntryHash = this.hashTreeEntry(treeEntry);
      // this.createObject(treeEntryHash, treeEntry);
      // return treeEntryHash;
    }
  }
  
  private getCommit(): Commit {
    return JSON.parse(fs.readFileSync(this.COMMIT, 'utf-8'));
  }
  private setCommit(commit: Commit) {
    try {
      fs.writeFileSync(this.COMMIT, JSON.stringify(commit), 'utf-8');
      return true;
    } catch (error) {
      console.log('(setCommit)', error);
      return false;
    }
  }

  public add(p: string) { 
    try {
      const absolutePath = path.join(__dirname, p);
      if (!fs.existsSync(absolutePath)) {
        console.log(absolutePath, ' does not exist.');
        return false;
      }
      console.log('(add) absolutePath: ', absolutePath);

      const newEntry = this.createEntry(absolutePath);
      console.log('(add) new entry: ', newEntry);

      const index = this.getIndex();
      console.log('(add) index: ', index);
      console.log('(add) relativePath: ', path.relative(path.dirname(this.WORKDIR), absolutePath));
      const newIndex = this.addEntry(index, path.relative(this.WORKDIR, absolutePath), newEntry);

      this.setIndex(newIndex);
      return true;
    } catch (error) {
      console.log('(add)', error);
      return false;
    }
  }
  private addEntry(baseEntry: Index, relativePath: string, newEntry: Index): Index {
    if (!relativePath)
      return newEntry;

    const li = relativePath.split('/');
    const nextDir = li[0];
    if (this.isIgnored(nextDir)) {
      console.log('(addEntry) target path: ', nextDir, ' is ignored by .vcsignore');
      return baseEntry;
    }
    console.log('(addEntry) target path: ', nextDir, ' is not ignored');

    const nextRelativePath = li.slice(1).join('/');

    const m = new Map<string, Index>(baseEntry.entries.map((e: Index) => [e.name, e]));
    const nextBaseEntry: Index | undefined = m.get(nextDir);
    const defaultEntry: Index = {
      name: nextDir,
      type: 'tree',
      entries: []
    };
    if (!nextBaseEntry) {
      m.set(nextDir, this.addEntry(defaultEntry, nextRelativePath, newEntry));
    } else {
      m.set(nextDir, this.addEntry(nextBaseEntry, nextRelativePath, newEntry));
    }

    const sorted = [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
    return {
      ...baseEntry,
      entries: sorted
    };
  }
  private isIgnored(name: string) {
    try {
      const ignoredContents = fs.readFileSync(this.vcsignore, 'utf-8').split('\n');
      console.log('(isIgnored): ', ignoredContents);

      if (ignoredContents.includes(name)) {
        console.log(name, ' is included in .vcsignore');
        return true;
      } else {
        console.log(name, ' is not included in .vcsignore');
        return false;
      }
      // return ignoredContents.includes(name);
    } catch (error) {
      console.log('(isIgnored)', error);
    }
  }
  

  private createEntry(absolutePath: string): Index {
    try {
      const stat = fs.statSync(absolutePath);
      if (stat.isFile()) {
        return {
          name: path.basename(absolutePath),
          type: 'blob',
          entries: []
        };
      } else {
        const stats = fs.readdirSync(absolutePath);
        const newEntries: Index[] = [];
        stats.forEach((s) => {
          if (!this.isIgnored(s))
            newEntries.push(this.createEntry(path.join(absolutePath, s)));
        });
        return {
          name: path.basename(absolutePath),
          type: 'tree',
          entries: newEntries
        };
      }
    } catch (error) {
      console.log('(creatEntry)', error);
      return {
        name: 'null',
        type: 'tree',
        entries: []
      };
    }
  }

  public remove(p: string) {
    try {
      const absolutePath = path.join(__dirname, p);
      const relativePath = path.relative(this.WORKDIR, absolutePath).split('/');
      const newIndex = this.removeEntry(this.getIndex(), relativePath);
      this.setIndex(newIndex);
      return true;
    } catch (error) {
      console.log('(remove)', error);
      return false;
    }
  }

  private removeEntry(baseEntry: Index, relativePath: string[]): Index {
    let newEntries: Index[] = [];
    if (relativePath.length === 1) {
      newEntries = baseEntry.entries.filter((e) => e.name !== relativePath[0]);
    } else {
      newEntries = baseEntry.entries.map((e) => {
        if (e.name === relativePath[0]) {
          return this.removeEntry(e, relativePath.slice(1));
        }
        return e;
      });
    }
    return {
      ...baseEntry,
      entries: newEntries
    };
  }
  
  private getIndex() { 
    try {
      return JSON.parse(fs.readFileSync(this.INDEX, 'utf-8'));
    } catch (error) {
      console.log('(getIndex)', error);
      return null;
    }
  }
  private setIndex(entry: Index): boolean { 
    try {
      fs.writeFileSync(this.INDEX, JSON.stringify(entry), 'utf-8');
      return true;
    } catch (error) {
      console.log('(setIndex)', error);
      return false;
    }
  }

  private hashToObjectPath(hash: string): string {
    return path.join(this.OBJECTS, hash.slice(0, 2), hash.slice(2));
  }
  private createObject(hash: string, content: any): boolean {
    try {
      const p = this.hashToObjectPath(hash);
      const dir = path.dirname(p);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(content), 'utf-8');
      return true;
    } catch (error) {
      console.log('(createObject)', error);
      return false;
    }
  }
  private readObject(hash: string) {
    try {
      const p = this.hashToObjectPath(hash);
      const content: string = fs.readFileSync(p, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.log('(readObject)', error);
      return null;
    }
  }

  private hashTreeEntry(entry: Entry) {
    return computeHash(entry.name + entry.type + entry.hash);
  }
  private hashTree(tree: Tree): string {
    return computeHash(tree.entries.map(this.hashTreeEntry).join(''));
  }
  private hashBlob(blob: Blob): string {
    return computeHash(blob.content);
  }
}