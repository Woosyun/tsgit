import * as path from 'path';
import * as fs from 'fs';
import { handleCheckout, refsInit } from './refs';
import { addIndex, createIndex, getIndex, indexInit, removeIndex, setIndex } from './index';
import { commitInit, handleCommit } from './commit';

export default class Repository {
  WORKDIR = '/'
  REPOSITORY = '.vcs';

  constructor(dir: string) { 
    this.WORKDIR = dir;
    this.REPOSITORY = path.join(dir, this.REPOSITORY);
    this.init();
  }

  public init() { 
    // 1. Check this folder already initialized or not
    if (fs.existsSync(this.REPOSITORY)) {
      console.log('Repository already exists');
    } else {
      fs.mkdirSync(this.REPOSITORY);
      
      //init commit
      commitInit()

      //init refs
      refsInit(this.REPOSITORY);

      //init index
      indexInit(this. WORKDIR, this.REPOSITORY);
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
}