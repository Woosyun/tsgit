import * as path from 'path';
import * as fs from 'fs';
import { HeadType } from './types';
import { readObject } from './object';

const headTypes = [
  'local',
  'remote'
];
let commitRefPath = 'COMMIT';
let headRefPath = 'HEAD';
let headsPath = 'heads';

export function refSetPath(repositoryPath: string) {
  headRefPath = path.join(repositoryPath, 'HEAD');
  commitRefPath = path.join(repositoryPath, 'COMMIT');
  headsPath = path.join(repositoryPath, 'heads');
}

export function getCurrentCommitHash(): string {
  return fs.readFileSync(commitRefPath, 'utf-8').toString();
}
export function setCurrentCommitHash(hash: string) {
  fs.writeFileSync(commitRefPath, hash, 'utf-8');
}

export function getCurrentHeadName() {
  return fs.readFileSync(headRefPath, 'utf-8').toString();
}
export function setCurrentHeadName(headName: string) {
  fs.writeFileSync(headRefPath, headName, 'utf-8');
}
function findHeadNameByHash(headType: HeadType, hash: string): string {
  //get list of head-hash and change it to map structure
  const branches = getHeadNames(headType);
  for (let branch of branches) {
    if (getHead(headType, branch) === hash) {
      return branch;
    }
  }
  return "";
}
export function getHeadNames(headType: HeadType) {
  const branches = fs.readdirSync(path.join(headsPath, headTypes[headType]));
  return branches;
}
export function getHead(headType: HeadType, headName: string) { 
  const branchPath = path.join(headsPath, headTypes[headType], headName);
  return fs.readFileSync(branchPath, 'utf-8').toString();
}

// export function removeBranch(headType: HeadType, headName: string) { }

export function setHead(headType: HeadType, headName: string, hash: string) { 
  const branchPath = path.join(headsPath, headTypes[headType], headName);
  fs.mkdirSync(path.dirname(branchPath), { recursive: true });
  fs.writeFileSync(branchPath, hash);
}

export function updateCurrentHead() {
  const commitHash = getCurrentCommitHash();
  let head = getCurrentHeadName();

  if (!head) {
    //create new branch. If there isn't branch, that means commit hash is unique, so it can be used as branch name
    setHead(0, commitHash, commitHash);
    setCurrentHeadName(commitHash);
    head = commitHash;
  } else {
    setHead(0, head, commitHash);
  }
}

export function handleCheckout(hash: string) { 
  //find commit hash value that match with hash
  if (!readObject(hash)) {
    console.log('target commit object does not exist');
    return;
  }
  setCurrentCommitHash(hash);
  //find branch for this hash
  setCurrentHeadName(findHeadNameByHash(0, hash));
}