import fs from 'fs';
import { Branch } from './types';

let branchesPath = 'branches';
export function setBranchesPath(newPath: string) {
  branchesPath = newPath;
}

export function setBranch(branchName: string, commitHash: string) {
  const branchArray: Branch[] = getBranches();
  const branches: Map<string, string> = new Map(branchArray.map((b: Branch) => [b.name, b.hash]));
  branches.set(branchName, commitHash);

  const newBranches: Branch[] = [...branches.entries()].map((e) => {
    return {
      name: e[0],
      hash: e[1]
    };
  });
  fs.writeFileSync(branchesPath, JSON.stringify(newBranches));
}

export function getBranches() {
  const content: string = fs.readFileSync(branchesPath, 'utf-8').toString();
  return JSON.parse(content);
}