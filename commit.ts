import path from "path";
import fs from 'fs';
import { createObject, readObject } from "./object";
import { Entry, Index, Tree, Blob, Commit } from "./types";
import { getIndex, storeIndex } from "./index";
import { hashBlob, hashCommit, hashTree } from "./hash";
import { getCommitRef, setCommitRef, updateCurrentBranch } from "./refs";

export function commitInit() {
  const tree: Tree = {
    entries: []
  };
  const treeHash = hashTree(tree);
  createObject(treeHash, tree);
  setCommitRef(treeHash); 
}

export function handleCommit(workDir:string, message: string) {
  const index: Index = getIndex();
  // console.log('(commit)index: ', index);
  const oldCommitHash: string = getCommitRef();
  const oldCommit: Commit = readObject(oldCommitHash);
  // console.log('(commit) old commit: ', oldCommit);

  const newTreeHash = treeStoreChange(workDir, oldCommit.hash, index);
  if (newTreeHash !== oldCommit.hash) {// new commit detected!!
    const newCommit: Commit = {
      message,
      hash: newTreeHash,
      parentHash: oldCommitHash
    };
    const newCommitHash = hashCommit(newCommit);
    createObject(newCommitHash, newCommit);
    setCommitRef(newCommitHash);
    //update hash of current branch
    updateCurrentBranch();
  }

  return true;
}

export function treeStoreChange(p: string, treeHash: string, index: Index): string {
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

function blobStoreChange(p: string, blobHash: string): string {
  const newBlob: Blob = {
    content: fs.readFileSync(p).toString()
  };

  const newBlobHash: string = hashBlob(newBlob);
  if (newBlobHash !== blobHash)
    createObject(newBlobHash, newBlob);

  return newBlobHash;
}