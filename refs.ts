import fs from 'fs';
import path from 'path';
import { getCommit } from './commit';

type HeadType = 0 | 1;
const headTypes = [
  'locals',
  'remotes'
];
let refs = 'refs';
let headPath = 'head';
export function refsInit(repositoryPath: string) {
  //if heads, locals, remotes folder not exist, create them
  refs = path.join(repositoryPath, 'refs');
  headPath = path.join(repositoryPath, 'head');

  headTypes.forEach((headType) => {
    fs.mkdirSync(path.join(refs, headType));
  });

  createBranch('main', getCommit());
  setCurrentHeadName('main');
}

export function writeHead(headType: HeadType, headName: string, hash: string) {
  const headPath = path.join(refs, headTypes[headType], headName);
  fs.writeFileSync(headPath, hash, 'utf-8');
}
export function readHead(headType: HeadType, headName: string): string {
  const headPath = path.join(refs, headTypes[headType], headName);
  return fs.readFileSync(headPath, 'utf-8');
}

export function createBranch(branchName: string, currentCommitHash: string){
  const branchPath = path.join(refs, headTypes[0], branchName);
  if (fs.existsSync(branchPath)) {
    console.log('branch already exists');
    return;
  }

  fs.writeFileSync(branchPath, currentCommitHash);
}

export function getCurrentHeadName() {
  const headName = fs.readFileSync(headPath, 'utf-8').toString();
  return headName;
}
export function setCurrentHeadName(headName: string) {
  fs.writeFileSync(headPath, headName);
}

export function refsHandleCommit(hash: string) {
  //get current head name
  const headName = getCurrentHeadName();
  
  //update current ref
}