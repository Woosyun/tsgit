import * as fs from 'fs';
import * as path from 'path';

let commitPath = 'commit';
export function setCommitPath(repoPath: string){
  commitPath = path.join(repoPath, 'commit');
}

export function getCommit(): string {
  return fs.readFileSync(commitPath, 'utf-8').toString();
}
export function setCommit(hash: string) {
  try {
    fs.writeFileSync(commitPath, hash, 'utf-8');
    return true;
  } catch (error) {
    console.log('(setCommit)', error);
    return false;
  }
}

export function handleCommit() {
  
}