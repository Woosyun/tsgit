import path from "path";
import fs from 'fs';
import { createObject, readObject } from "./object";
import { Entry, Index, Tree, Blob } from "./types";
import { storeIndex } from "./index";
import { hashBlob, hashTree } from "./hash";

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

// function compareTreeEntry(p: string, treeEntry: Entry, index: Index): string {
//   if (treeEntry.type !== index.type) {
//     //create whole index
//     return storeTreeEntry(p, index);
    
//   } else if (index.type === 'blob') {
//     // console.log(1, ' ', p);
//     //get information of blob
//     const content = fs.readFileSync(p, 'utf-8');
//     const blobHash = computeHash(content);
//     const blob: Blob = {
//       content: content
//     };
//     //get information of tree entry
//     const entry: Entry = {
//       name: index.name,
//       type: 'blob',
//       hash: blobHash,
//     };
//     const entryHash = hashTreeEntry(entry);
//     //store new blob
//     if ( entryHash !== treeEntry.hash) {
//       createObject(blobHash, blob);
//       createObject(entryHash, entry);
//     }
//     return entryHash;

//   } else { // both entries are tree type
//     // console.log(2, ' ', p);
//     const oldTree: Tree = readObject(treeEntry.hash);
//     // console.log('(compareTreeEntry) index: ', index);
//     console.log('(compareTreeEntry) tree entry: ', treeEntry);
//     console.log('(compareTreeEntry) tree: ', oldTree);
//     const oldM = new Map<string, Entry>(oldTree.entries.map((e: Entry) => [e.name, e]));
//     const entries: Entry[] = index.entries.map((e: Index) => {
//       const oldEntry: Entry | undefined = oldM.get(e.name);
//       const newPath = path.join(p, e.name);
//       // console.log('(compareTreeEntry) sub entry: ', e);
//       // console.log('(compareTreeEntry) new path: ', newPath);
//       let newHash = '';
//       if (!oldEntry) {
//         newHash = storeTreeEntry(newPath, e)
//       } else {
//         newHash = compareTreeEntry(newPath, oldEntry, e);
//       }
//       return {
//         name: e.name,
//         type: e.type,
//         hash: newHash
//       };
//     });
//     const newTree: Tree = { entries: entries };
//     const newTreeHash = hashTree(newTree);
//     const newTreeEntry: Entry = {
//       name: index.name,
//       type: 'tree',
//       hash: newTreeHash
//     };
//     const newTreeEntryHash = hashTreeEntry(newTreeEntry);
//     if (newTreeEntryHash !== treeEntry.hash) {
//       createObject(newTreeHash, newTree);
//       createObject(newTreeEntryHash, newTreeEntry);
//     }
//     return newTreeEntryHash;

//   }
// }

// export function storeTreeEntry(p: string, entry: Index): string {
//   if (entry.type === 'blob') {
//     const content: string = fs.readFileSync(p, 'utf-8');
//     const blobHash = computeHash(content);
//     const blob: Blob = { content: content };
//     createObject(blobHash, blob);
//     return blobHash;
//     // const treeEntry: Entry = {
//     //   ...entry,
//     //   hash: blobHash
//     // };
//     // const treeEntryHash = this.hashTreeEntry(treeEntry);
//     // this.createObject(treeEntryHash, treeEntry);
//     // return treeEntryHash;
//   } else {
//     const entries: Entry[] = entry.entries.map((e: Index) => {
//       return {
//         name: e.name,
//         type: e.type,
//         hash: storeTreeEntry(path.join(p, e.name), e)
//       };
//     })
//     const tree: Tree = { entries: entries };
//     const treeHash = hashTree(tree);
//     createObject(treeHash, tree);
//     return treeHash;
//     // const treeEntry: Entry = {
//     //   name: entry.name,
//     //   type: 'tree',
//     //   hash: treeHash
//     // };
//     // const treeEntryHash = this.hashTreeEntry(treeEntry);
//     // this.createObject(treeEntryHash, treeEntry);
//     // return treeEntryHash;
//   }
// }