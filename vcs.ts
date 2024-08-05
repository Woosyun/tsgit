import * as path from 'path';
import * as fs from 'fs';
import { computeHash, hashTree, hashBlob, hashTreeEntry, hashCommit } from './hash';
import { Index, Entry, Blob, Tree, Commit } from './types';
import { addIndex, createIndex, getIndex, removeIndex, setIndex, setIndexPath, storeIndex } from './index';
import { getCommit, setCommit, setCommitPath } from './commit';
import { createObject, readObject, setObjectsPath } from './object';
import { setIgnorePath } from './ignore';
import { treeStoreChange } from './entry';
import { setConfig } from './config';
import { createBranch, getCurrentHeadName, refsInit } from './refs';

export default class Repository {
  WORKDIR = '/'
  REPOSITORY = '.vcs';

  constructor(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, this.REPOSITORY);
    setCommitPath(this.REPOSITORY);
    setIndexPath(this.REPOSITORY);
    setObjectsPath(this.REPOSITORY);
    setIgnorePath(this.REPOSITORY);
    setConfig(this.REPOSITORY);

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

      //init commit
      setCommit("");

      // init index
      setIndex({
        name: path.basename(this.WORKDIR),
        type: 'tree',
        entries: []
      });

      //init refs
      refsInit(this.REPOSITORY);
    }
  }

  public commit(message: string) { 
    try {
      if (!getCurrentHeadName()) {
        console.log('you have to create branch to commit in this revision');
        return;
      }
      
      const index: Index = getIndex();
      // console.log('(commit)index: ', index);
      const oldCommitHash: string = getCommit();
      const oldCommit: Commit = readObject(oldCommitHash);
      // console.log('(commit) old commit: ', oldCommit);

      const newTreeHash = treeStoreChange(this.WORKDIR, oldCommit.hash, index);
      const newCommit: Commit = {
        message,
        hash: newTreeHash,
        parentHash: oldCommitHash
      };
      const newCommitHash = hashCommit(newCommit);

      if (newTreeHash !== oldCommit.hash) {
        createObject(newCommitHash, newCommit);
        setCommit(newCommitHash);
        //update hash of current head
      }

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

  public checkout(hash: string) {
    
  }
}