import * as fs from 'fs';
import * as path from 'path';
import { Commit } from './types';

let commitPath = 'commit';
export function setCommitPath(newPath: string){
  commitPath = newPath;
}

export function getCommit(): Commit {
  return JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
}
export function setCommit(commit: Commit) {
  try {
    fs.writeFileSync(commitPath, JSON.stringify(commit), 'utf-8');
    return true;
  } catch (error) {
    console.log('(setCommit)', error);
    return false;
  }
}