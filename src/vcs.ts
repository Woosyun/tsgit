import * as path from 'path';
import * as fs from 'fs';
import { getCurrentCommitHash, getHead, getHeadNames, handleCheckout, refSetPath } from './refs';
import { addIndex, createIndex, getIndex, indexInit, indexSetPath, removeIndex, setIndex } from './index';
import { commitInit, handleCommit } from './commit';
import { objectSetPath, readObject } from './object';
import { Commit, Entry, EntryStatus, Hash, HeadType } from './types'
import { getStatus } from './status';
import { readIgnore, ignore, setIgnorePath } from './ignore';

export default class VCS {
  WORKDIR = '/'
  REPOSITORY = '.vcs';

  constructor() { }

  public init(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, '.vcs');
    refSetPath(this.REPOSITORY);
    indexSetPath(this.REPOSITORY);
    objectSetPath(this.REPOSITORY);
    setIgnorePath(this.REPOSITORY);

    if (fs.existsSync(this.REPOSITORY)) {
      console.log('Repository already exists');
    } else {
      fs.mkdirSync(this.REPOSITORY, { recursive: true });
      commitInit();
      indexInit(this.WORKDIR);
    }
  }

  public commit(message: string) { 
    handleCommit(this.WORKDIR, message);
  }

  public add(p: string) { 
    try {
      const newEntry = createIndex(p);

      const index = getIndex();
      const newIndex = addIndex(index, path.relative(this.WORKDIR, p), newEntry);

      setIndex(newIndex);
    } catch (error: any) {
      throw new Error('(add)->' + error.message);
    }
  }
  

  public remove(p: string) {
    try {
      const relativePath = path.relative(this.WORKDIR, p).split('/');
      const newIndex = removeIndex(getIndex(), relativePath);
      setIndex(newIndex);
      return true;
    } catch (error) {
      console.log('(remove)', error);
      return false;
    }
  }

  public checkout(hash: string) {
    handleCheckout(hash);
  }

  public whereAmI() {
    return getCurrentCommitHash();
  }

  public status(): EntryStatus[] {
    try {
      const commitHash: Hash = getCurrentCommitHash();
      const commit = readObject(commitHash) as Commit;
      return getStatus(this.WORKDIR, commit.entry);
    } catch (error: any) {
      throw new Error('(status)->' + error.message);
    }
  }

  public getIgnoredNames() {
    return readIgnore();
  }
  public ignore(name: string) {
    try {
      ignore(name);
    } catch (error: any) {
      throw new Error('(ignore)->' + error.message);
    }
  }


  public readObject(hash: Hash) {
    return readObject(hash);
  }
  public getHeadNames(headType: HeadType) {
    return getHeadNames(headType);
  }
  public getHead(headType: HeadType, headName: string) {
    return getHead(headType, headName);
  }
}