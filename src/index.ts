import { Index, Blob, Entry, Tree } from './types'
import * as fs from 'fs';
import * as path from 'path';
import { isIgnored } from './ignore';
import { hashBlob, hashTree } from './hash';
import { createObject } from './object';

let indexPath = 'index';
export function indexInit(workingPath: string, repositoryPath: string) {
  indexPath = path.join(repositoryPath, 'index');
  setIndex({
    name: path.basename(workingPath),
    type: 'tree',
    entries: []
  });
}

export function getIndex() { 
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (error) {
    console.log('(getIndex)', error);
    return null;
  }
}
export function setIndex(entry: Index): boolean { 
  try {
    fs.writeFileSync(indexPath, JSON.stringify(entry), 'utf-8');
    return true;
  } catch (error) {
    console.log('(setIndex)', error);
    return false;
  }
}

export function addIndex(baseIndex: Index, relativePath: string, newEntry: Index): Index {
  if (!relativePath)
    return newEntry;

  const li = relativePath.split('/');
  const nextDir = li[0];
  if (isIgnored(nextDir)) {
    // console.log('(addIndex) target path: ', nextDir, ' is ignored by .vcsignore');
    return baseIndex;
  }
  // console.log('(addIndex) target path: ', nextDir, ' is not ignored');

  const nextRelativePath = li.slice(1).join('/');

  const m = new Map<string, Index>(baseIndex.entries.map((e: Index) => [e.name, e]));
  const nextBaseEntry: Index | undefined = m.get(nextDir);
  const defaultEntry: Index = {
    name: nextDir,
    type: 'tree',
    entries: []
  };
  if (!nextBaseEntry) {
    m.set(nextDir, addIndex(defaultEntry, nextRelativePath, newEntry));
  } else {
    m.set(nextDir, addIndex(nextBaseEntry, nextRelativePath, newEntry));
  }

  const sorted = [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...baseIndex,
    entries: sorted
  };
}

export function createIndex(absolutePath: string): Index {
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
        if (!isIgnored(s))
          newEntries.push(createIndex(path.join(absolutePath, s)));
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

export function removeIndex(baseIndex: Index, relativePath: string[]): Index {
  let newEntries: Index[] = [];
  if (relativePath.length === 1) {
    newEntries = baseIndex.entries.filter((e) => e.name !== relativePath[0]);
  } else {
    newEntries = baseIndex.entries.map((e) => {
      if (e.name === relativePath[0]) {
        return removeIndex(e, relativePath.slice(1));
      }
      return e;
    });
  }
  return {
    ...baseIndex,
    entries: newEntries
  };
}

export function storeIndex(p: string, index: Index): string {
  if (index.type === 'blob') {
    const blob: Blob = {
      content: fs.readFileSync(p, 'utf-8').toString()
    };
    const blobHash = hashBlob(blob);
    createObject(blobHash, blob);
    return blobHash;
  } else {
    const entries: Entry[] = index.entries.map((e: Index) => {
      return {
        name: e.name,
        type: e.type,
        hash: storeIndex(path.join(p, e.name), e)
      };
    });

    const tree: Tree = { entries };
    const treeHash = hashTree(tree);
    createObject(treeHash, tree);
    return treeHash;
  }
}