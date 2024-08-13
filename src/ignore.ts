import * as fs from 'fs';
import * as path from 'path';

let ignorePath: string = '.vcsignore';
export function setIgnorePath(repoPath: string): void {
  ignorePath = path.join(repoPath, '.vcsignore');
}

export function isIgnored(name: string) {
  try {
    const ignoredContents = fs.readFileSync(ignorePath, 'utf-8').split('\n');
    // console.log('(isIgnored): ', ignoredContents);

    if (ignoredContents.includes(name)) {
      // console.log(name, ' is included in .vcsignore');
      return true;
    } else {
      // console.log(name, ' is not included in .vcsignore');
      return false;
    }
    // return ignoredContents.includes(name);
  } catch (error) {
    console.log('(isIgnored)', error);
  }
}