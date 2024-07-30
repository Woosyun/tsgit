import * as path from 'path';
import * as fs from 'fs';
import { computeHash } from './hash';

type Entry = {
  name: string;
  type: 'blob' | 'tree';
  entries: Entry[];
};

type TreeEntry = {
  name: string;
  type: 'blob' | 'tree';
  hash: string;
}
type Blob = {
  content: string;
};
type Tree = {
  entries: TreeEntry[];
}

type Commit = {
  message: string;
  hash: string; //pointer to root tree entry
}

export default class Repository {
  WORKDIR = '/'
  REPOSITORY = '.md-vcs';
  // refs = 'refs'; // hash values for local, remote
  // branches = 'branches'; // hash values for branches
  OBJECTS = 'objects'; // hash value and contents for tree, blob, commit. Folder + file = hash value
  // head = 'HEAD'; // pointer for current revision
  // origingHead = 'ORIG_HEAD'; // hash value for remote head
  // config = 'CONFIG'; // information including url for remote server, name of current branch, etc
  COMMIT = 'COMMIT' // hash value for commit object
  INDEX = 'INDEX'

  constructor(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, this.REPOSITORY);
    this.COMMIT = path.join(this.REPOSITORY, this.COMMIT);
    this.INDEX = path.join(this.REPOSITORY, this.INDEX);
    this.OBJECTS = path.join(this.REPOSITORY, this.OBJECTS);

    this.init();
  }

  public init() { 
    // 1. Check this folder already initialized or not
    if (fs.existsSync(this.REPOSITORY)) {
      console.log('Repository already exists');
    } else {
      fs.mkdirSync(this.REPOSITORY);
      
      // store default tree object
      const defaultTree: Tree = {
        entries: []
      };
      const defaultTreeHash = this.hashTree(defaultTree);
      this.createObject(defaultTreeHash, defaultTree);

      // store default tree entry object
      const defaultEntry: TreeEntry = {
        name: '.',
        type: 'tree',
        hash: defaultTreeHash
      };
      const defaultEntryHash = this.hashTreeEntry(defaultEntry);
      this.createObject(defaultEntryHash, defaultEntry);

      //init commit
      this.setCommit(defaultEntryHash);

      // init index
      this.setIndex({
        name: '.',
        type: 'tree',
        entries: []
      });
    } 
  }

  public commit(message: string) { 
    try {
      const index: Entry = this.getIndex();
      const oldCommitHash = this.getCommit();
      const oldIndex: TreeEntry = this.readObject(oldCommitHash);
      const newCommitHash = this.compareTreeEntry(this.WORKDIR, oldIndex, index);
      if (newCommitHash !== oldCommitHash)
        this.setCommit(newCommitHash);

      return true;
    } catch (error) {
      console.log('(commit)', error);
      return false;
    }
  }
  private compareTreeEntry(p: string, treeEntry: TreeEntry, index: Entry): string {
    if (treeEntry.type !== index.type) {
      
      //create whole index
      return this.storeTreeEntry(p, index);
      
    } else if (index.type === 'blob') {
      
      //get information of blob
      const content = fs.readFileSync(p, 'utf-8');
      const blobHash = computeHash(content);
      const blob: Blob = {
        content: content
      };
      //get information of tree entry
      const entry: TreeEntry = {
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

    } else {

      const oldTree: Tree = this.readObject(treeEntry.hash);
      const oldM = new Map<string, TreeEntry>(oldTree.entries.map((e: TreeEntry) => [e.name, e]));
      const entries: TreeEntry[] = index.entries.map((e: Entry) => {
        const oldEntry: TreeEntry | undefined = oldM.get(e.name);
        const newPath = path.join(p, e.name);
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
        }
      });
      const newTree: Tree = { entries: entries };
      const newTreeHash = this.hashTree(newTree);
      const newTreeEntry: TreeEntry = {
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

  private storeTreeEntry(p: string, entry: Entry): string {
    if (entry.type === 'blob') {
      const content: string = fs.readFileSync(p, 'utf-8');
      const blobHash = computeHash(content);
      const blob: Blob = { content: content };
      this.createObject(blobHash, blob);

      const treeEntry: TreeEntry = {
        name: entry.name,
        type: 'blob',
        hash: blobHash
      };
      const treeEntryHash = this.hashTreeEntry(treeEntry);
      this.createObject(treeEntryHash, treeEntry);
      return treeEntryHash;
    } else {
      const entries: TreeEntry[] = entry.entries.map((e: Entry) => {
        return {
          name: e.name,
          type: e.type,
          hash: this.storeTreeEntry(path.join(p, e.name), e)
        };
      })
      const tree: Tree = {
        entries: entries
      };
      const treeHash = this.hashTree(tree);
      this.createObject(treeHash, tree);
      const treeEntry: TreeEntry = {
        name: entry.name,
        type: 'tree',
        hash: treeHash
      };
      const treeEntryHash = this.hashTreeEntry(treeEntry);
      this.createObject(treeEntryHash, treeEntry);
      return treeEntryHash;
    }
  }
  
  private getCommit() {
    try {
      return fs.readFileSync(this.COMMIT, 'utf-8');
    } catch (error) {
      console.log('(getCommit)', error);
      return "";
    }
  }
  private setCommit(hash: string) {
    try {
      fs.writeFileSync(this.COMMIT, hash, 'utf-8');
      return true;
    } catch (error) {
      console.log('(setCommit)', error);
      return false;
    }
  }

  public add(p: string) { 
    try {
      const absolutePath = path.join(__dirname, p);
      //if file or directory does not exist, return false;
      if (!fs.existsSync(absolutePath)) {
        console.log(absolutePath, ' does not exist.');
        return false;
      }

      const newEntry = this.createEntry(absolutePath);
      const index = this.getIndex();
      this.addEntry(index, path.relative(this.WORKDIR, absolutePath).split('/'), newEntry);

      this.setIndex(index);
      return true;
    } catch (error) {
      console.log('(add)', error);
      return false;
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

  private removeEntry(baseEntry: Entry, relativePath: string[]): Entry {
    let newEntries: Entry[] = [];
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
  private addEntry(baseEntry: Entry, relativePath: string[], newEntry: Entry): void {
    if (relativePath.length === 1) {
      const idx = baseEntry.entries.findIndex((e) => e.name === relativePath[0]);
      if (idx === -1) {
        baseEntry.entries.push(newEntry);
      } else {
        baseEntry.entries[idx] = newEntry;
      }
    } else {
      const idx = baseEntry.entries.findIndex((e) => e.name === relativePath[0]);
      if (idx === -1) {
        const subEntry: Entry = {
          name: relativePath[0],
          type: 'tree',
          entries: []
        };
        this.addEntry(subEntry, relativePath.slice(1), newEntry);
        baseEntry.entries.push(subEntry);
      } else {
        this.addEntry(baseEntry.entries[idx], relativePath.slice(1), newEntry);
      }
    }
    //update this hash
    // baseEntry.hash = baseEntry.entries.map((e) => e.hash).join('');
  }
  private createEntry(absolutePath: string): Entry {
    try {
      const stat = fs.statSync(absolutePath);
      if (stat.isFile()) {
        return {
          name: path.basename(absolutePath),
          type: 'blob',
          // hash: computeHash(fs.readFileSync(absolutePath, 'utf-8')),
          entries: []
        };
      } else {
        const stats = fs.readdirSync(absolutePath);
        const newEntries = stats.map((s) => this.createEntry(path.join(absolutePath, s)));
        return {
          name: path.basename(absolutePath),
          type: 'tree',
          // hash: computeHash(newEntries.map((e: Entry) => e.hash).join('')),
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
  
  private getIndex() { 
    try {
      return JSON.parse(fs.readFileSync(this.INDEX, 'utf-8'));
    } catch (error) {
      console.log('(getIndex)', error);
      return null;
    }
  }
  private setIndex(entry: Entry): boolean { 
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

  private hashTreeEntry(entry: TreeEntry) {
    return computeHash(entry.name + entry.type + entry.hash);
  }
  private hashTree(tree: Tree) {
    return computeHash(tree.entries.map(this.hashTreeEntry).join(''));
  }
}