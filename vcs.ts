import * as path from 'path';
import * as fs from 'fs';
import { computeHash } from './hash';

type Entry = {
  name: string;
  type: 'blob' | 'tree';
  hash: string;
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
      const defaultTree: Tree = {
        entries: []
      };
      const defaultTreeHash = this.hashTree(defaultTree);
      this.createObject(defaultTreeHash, defaultTree);

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
        ...defaultEntry,
        entries: []
      });
    } 
  }

  public commit(message: string) { 
    try {
      const index: Entry = this.getIndex();
      const prevRootEntryHash = this.getCommit();
      const prevRootEntry: TreeEntry = this.readObject(prevRootEntryHash);
      this.compareTreeEntry(this.WORKDIR, prevRootEntry, index);

      return true;
    } catch (error) {
      console.log('(commit)', error);
      return false;
    }
  }
  private compareTreeEntry(p: string, treeEntry: TreeEntry, index: Entry): TreeEntry {
    if (treeEntry.hash !== index.hash) {
      if (index.type === 'blob') {
        //create new blob
        const content: string = fs.readFileSync(p, 'utf-8');
        const newBlobHash = computeHash(content);
        const newBlob: Blob = { content: content };
        this.createObject(newBlobHash, newBlob);
        //create new tree entry
        const newTreeEntry: TreeEntry = {
          name: index.name,
          type: 'blob',
          hash: newBlobHash
        };
        const newTreeEntryHash = this.hashTreeEntry(newTreeEntry);
        this.createObject(newTreeEntryHash, newTreeEntry);
        return newTreeEntry;
      } else {
        const tree: Tree = this.readObject(treeEntry.hash);
        const oldM = new Map(tree.entries.map((e: TreeEntry) => [e.name, e]));
        //create new tree entry
        const newEntries: TreeEntry[] = index.entries.map((e: Entry) => {
          const oldEntry = oldM.get(e.name);

          return this.compareTreeEntry(path.join(p, e.name), oldM.get(e.name), e);
        });
        const newTree: Tree = { entries: newEntries };
        
        for (const e of index.entries) {
          const oldEntry = oldM.get(e.name);
          if (!oldEntry || oldEntry.type !== index.type) {
            //create tree entry
            
          } else if (oldEntry.hash !== index.hash) {
            //modify tree entry
          } else {
            // do nothing
          }
        }
        //create new tree and new tree entry
      }
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
      hash: computeHash(newEntries.map((e: Entry) => e.hash).join('')),
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
          hash: '',
          entries: []
        };
        this.addEntry(subEntry, relativePath.slice(1), newEntry);
        baseEntry.entries.push(subEntry);
      } else {
        this.addEntry(baseEntry.entries[idx], relativePath.slice(1), newEntry);
      }
    }
    //update this hash
    baseEntry.hash = baseEntry.entries.map((e) => e.hash).join('');
  }
  private createEntry(absolutePath: string): Entry {
    try {
      const stat = fs.statSync(absolutePath);
      if (stat.isFile()) {
        return {
          name: path.basename(absolutePath),
          type: 'blob',
          hash: computeHash(fs.readFileSync(absolutePath, 'utf-8')),
          entries: []
        };
      } else {
        const stats = fs.readdirSync(absolutePath);
        const newEntries = stats.map((s) => this.createEntry(path.join(absolutePath, s)));
        return {
          name: path.basename(absolutePath),
          type: 'tree',
          hash: computeHash(newEntries.map((e: Entry) => e.hash).join('')),
          entries: newEntries
        };
      }
    } catch (error) {
      console.log('(creatEntry)', error);
      return {
        name: 'null',
        hash: 'null',
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