import path from 'path';
import fs from 'fs';
import { Commit } from './types';
import { readObject } from './object';

type HeadType = 0 | 1;
const headTypes = [
  'local',
  'remote'
];
let commitRefPath = 'commit';
let headRefPath = 'head';
let headsPath = 'heads';

export function refsInit(repositoryPath: string) {
  headRefPath = path.join(repositoryPath, 'head');
  commitRefPath = path.join(repositoryPath, 'commit');
  headsPath = path.join(repositoryPath, 'branches');
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
function setCurrentHeadName(headName: string) {
  fs.writeFileSync(headRefPath, headName, 'utf-8');
}
function findHeadByHash(headType: HeadType, hash: string): string {
  //get list of head-hash and change it to map structure
  const branches = getHeadNames(headType);
  for (let branch of branches) {
    if (readHead(headType, branch) === hash) {
      return branch;
    }
  }
  return "";
}
export function getHeadNames(headType: HeadType) {
  const branches = fs.readdirSync(path.join(headsPath, headTypes[headType]));
  return branches;
}
export function readHead(headType: HeadType, headName: string) { 
  const branchPath = path.join(headsPath, headTypes[headType], headName);
  return fs.readFileSync(branchPath, 'utf-8').toString();
}

// export function removeBranch(headType: HeadType, headName: string) { }

export function setHead(headType: HeadType, headName: string, hash: string) { 
  const branchPath = path.join(headsPath, headTypes[headType], headName);
  if (!fs.existsSync(branchPath)) {
    console.log('(setHead) branch does not exist');
    return;
  }
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
  setCurrentHeadName(findHeadByHash(0, hash));
}