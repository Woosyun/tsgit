import * as path from 'path';
import * as fs from 'fs';
import { computeHash, hashTree, hashBlob, hashTreeEntry } from './hash';
import { Index, Entry, Blob, Tree, Commit } from './types';
import { addIndex, createIndex, getIndex, removeIndex, setIndex, setIndexPath, storeIndex } from './index';
import { getCommit, setCommit, setCommitPath } from './commit';
import { createObject, readObject, setObjectsPath } from './object';
import { setIgnorePath } from './ignore';
import { treeStoreChange } from './entry';
import { sensitiveHeaders } from 'http2';

export default class Repository {
  WORKDIR = '/'
  REPOSITORY = '.vcs';
  // refs = 'refs'; // hash values for local, remote
  branches = 'branches'; // hash values for branches
  OBJECTS = 'objects'; // hash value and contents for tree, blob, commit. Folder + file = hash value
  head = 'HEAD'; // pointer for current revision
  // origingHead = 'ORIG_HEAD'; // hash value for remote head
  // config = 'CONFIG'; // information including url for remote server, name of current branch, etc
  COMMIT = 'COMMIT' // hash value for commit object
  INDEX = 'INDEX'
  vcsignore = '.vcsignore'

  constructor(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, this.REPOSITORY);
    this.COMMIT = path.join(this.REPOSITORY, this.COMMIT);
    setCommitPath(this.COMMIT);
    this.INDEX = path.join(this.REPOSITORY, this.INDEX);
    setIndexPath(this.INDEX);
    this.OBJECTS = path.join(this.REPOSITORY, this.OBJECTS);
    setObjectsPath(this.OBJECTS);
    this.vcsignore = path.join(this.WORKDIR, this.vcsignore);
    setIgnorePath(this.vcsignore);
    this.head = path.join(this.REPOSITORY, this.head);

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
      const treeHash = hashTree(tree);
      createObject(treeHash, tree);
      setCommit({message: "initial commit", hash:treeHash, parentHash: ""});

      // init index
      setIndex({
        name: path.basename(this.WORKDIR),
        type: 'tree',
        entries: []
      });
    }
  }

  public commit(message: string) { 
    try {
      const index: Index = getIndex();
      // console.log('(commit)index: ', index);
      const oldCommit: Commit = getCommit();
      // console.log('(commit) old commit: ', oldCommit);
      const newCommitHash = treeStoreChange(this.WORKDIR, oldCommit.hash, index);
      if (newCommitHash !== oldCommit.hash)
        setCommit({message: message, hash: newCommitHash, parentHash: oldCommit.hash});

      return true;
    } catch (error) {
      console.log('(commit)', error);
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
      // console.log('(add) absolutePath: ', absolutePath);

      const newEntry = createIndex(absolutePath);
      // console.log('(add) new entry: ', newEntry);

      const index = getIndex();
      // console.log('(add) index: ', index);
      // console.log('(add) relativePath: ', path.relative(path.dirname(this.WORKDIR), absolutePath));
      const newIndex = addIndex(index, path.relative(this.WORKDIR, absolutePath), newEntry);

      setIndex(newIndex);
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
      const newIndex = removeIndex(getIndex(), relativePath);
      setIndex(newIndex);
      return true;
    } catch (error) {
      console.log('(remove)', error);
      return false;
    }
  }

  public reset(targetHash: string) {
    let p: Commit = getCommit();
    while (p.hash !== targetHash) {
      if (!p.parentHash) {
        console.log('There is no such commit object');
        return;
      }
      p = readObject(p.parentHash);
    }
    setCommit(p);
  }
}