import * as path from 'path';
import * as fs from 'fs';
import { getCurrentCommitHash, handleCheckout, refsInit } from './refs';
import { addIndex, createIndex, getIndex, indexInit, removeIndex, setIndex } from './index';
import { commitInit, handleCommit } from './commit';
import { objectInit } from './object';
import { createGraph } from './graph'
import { HeadType } from './types'

export default class VCS {
  WORKDIR = '/'
  REPOSITORY = '.vcs';

  constructor() { }

  public init(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, '.vcs');
    
    if (fs.existsSync(this.REPOSITORY)) {
      console.log('Repository already exists');
    } else {
      fs.mkdirSync(this.REPOSITORY, { recursive: true });

      //init refs
      refsInit(this.REPOSITORY);

      //init index
      indexInit(this.WORKDIR, this.REPOSITORY);

      //init objects
      objectInit(this.REPOSITORY);
      
      //init commit
      commitInit();
    }
  }

  public commit(message: string) { 
    handleCommit(this.WORKDIR, message);
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
    handleCheckout(hash);
  }

  public getGraph(headType: HeadType) {
    return createGraph(headType);
  }

  public whereAmI() {
    return getCurrentCommitHash();
  }
}