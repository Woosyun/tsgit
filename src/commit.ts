import * as path from "path";
import * as fs from 'fs';
import { createObject, readObject } from "./object";
import { Entry, Index, Tree, Blob, Commit, Hash } from "./types";
import { getIndex, setIndex, storeIndex } from "./index";
import { hashBlob, hashCommit, hashTree } from "./hash";
import { getCurrentCommitHash, getCurrentHeadName, setCurrentCommitHash, updateCurrentHead, setHead, setCurrentHeadName } from "./refs";

export function commitInit() {
  const tree: Tree = {
    entries: []
  };
  const treeHash = hashTree(tree);
  createObject(treeHash, tree);
  const entry: Entry = {
    name: '.',
    type: 'tree',
    hash: treeHash
  };
  const commit: Commit = {
    message: 'init commit',
    branch: 'main',
    entry,
    parentHash: ''
  };
  const commitHash = hashCommit(commit);
  createObject(commitHash, commit);
  setCurrentCommitHash(commitHash); 
  setHead(0, 'main', commitHash);
  setCurrentHeadName('main');
}

export function handleCommit(workDir:string, message: string) {
  const index: Index = getIndex();
  // console.log('(commit)index: ', index);
  const oldCommitHash: string = getCurrentCommitHash();
  const oldCommit: Commit = readObject(oldCommitHash);
  // console.log('(commit) old commit: ', oldCommit);

  const newEntry = compareEntry(workDir, oldCommit.entry, index);
  if (newEntry.hash !== oldCommit.entry.hash) {// new commit
    const newCommit: Commit = {
      message,
      branch: oldCommit.branch,
      entry: newEntry,
      parentHash: oldCommitHash
    };
    const newCommitHash = hashCommit(newCommit);
    createObject(newCommitHash, newCommit);
    setCurrentCommitHash(newCommitHash);
    //update hash of current branch
    updateCurrentHead(newCommitHash); //TODO: checkout으로 바꾸기
  }

  setIndex(index);
}

function compareEntry(p: string, oldEntry: Entry, index: Index): Entry {
  const stat = fs.statSync(p);
  let newEntry: Entry = {
    name: index.name,
    type: stat.isDirectory() ? 'tree' : 'blob',
    hash: '',
  };
  
  if (newEntry.type === 'blob') {
    index.type = 'blob';

    const newBlob: Blob = { content: fs.readFileSync(p, 'utf-8') };
    const newBlobHash: Hash = hashBlob(newBlob);
    if (newBlobHash !== oldEntry.hash)
      createObject(newBlobHash, newBlob);

    newEntry.hash = newBlobHash;
    return newEntry;
  } else { // type === 'tree'
    index.type = 'tree';
    
    const subIndices: Map<string, Index> = new Map(index.entries.map((e: Index) => [e.name, e]));
    const names: string[] = fs.readdirSync(p).filter((name: string) => subIndices.has(name));
    const entries: Entry[] = names.map((name: string) => compareEntry(path.join(p, name), oldEntry, subIndices.get(name)!));
    const newTree: Tree = { entries };
    const newTreeHash: Hash = hashTree(newTree);
    if (newTreeHash !== oldEntry.hash)
      createObject(newTreeHash, newTree);
    
    newEntry.hash = newTreeHash;
    return newEntry;
  }
}


/**
 * deprecated
 * @param p 
 * @param treeHash 
 * @param index 
 * @returns 
 */
function treeStoreChange(p: string, treeHash: string, index: Index): Hash {
  const oldTree: Tree = readObject(treeHash);
  // console.log('(treeStoreChange) oldTree: ', oldTree);
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
        hash: isComparingPossible ? blobStoreChange(newPath, oldEntry.hash) : storeIndex(newPath, e)
      };
    } else { // type === 'tree'
      return {
        name: e.name,
        type: 'tree',
        hash: isComparingPossible ? treeStoreChange(newPath, oldEntry.hash, e) : storeIndex(newPath, e)
      };
    }
  });
  
  const newTree: Tree = { entries };
  const newTreeHash = hashTree(newTree);
  if (newTreeHash !== treeHash)
    createObject(newTreeHash, newTree);

  return newTreeHash;
}

/**
 * deprecated
 * @param p 
 * @param blobHash 
 * @returns 
 */
function blobStoreChange(p: string, blobHash: string): string {
  const newBlob: Blob = {
    content: fs.readFileSync(p).toString()
  };

  const newBlobHash: string = hashBlob(newBlob);
  if (newBlobHash !== blobHash)
    createObject(newBlobHash, newBlob);

  return newBlobHash;
}