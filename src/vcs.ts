import * as path from 'path';
import * as fs from 'fs';
import { getCurrentCommitHash, getHead, getHeadNames, handleCheckout, refSetPath } from './refs';
import { addIndex, createIndex, getIndex, indexInit, indexSetPath, removeIndex, setIndex } from './index';
import { commitInit, handleCommit } from './commit';
import { objectSetPath, readObject } from './object';
import { Hash, HeadType } from './types'

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
      const absolutePath = p;
      // const absolutePath = path.join(__dirname, p);
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
      const absolutePath = p;
      // const absolutePath = path.join(__dirname, p);
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
    handleCheckout(hash);
  }

  public whereAmI() {
    return getCurrentCommitHash();
  }

  public readObject(hash: Hash) {
    return readObject(hash);
  }

  public mapHeads(headType: HeadType, f: (head: Hash) => void): void {
    const headNames: string[] = getHeadNames(headType);
    const heads: Hash[] = headNames.map((headName: string) => getHead(headType, headName));
    heads.forEach(f);
  }
}