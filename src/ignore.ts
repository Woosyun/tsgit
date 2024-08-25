import * as fs from 'fs';
import * as path from 'path';

let ignorePath: string = '.vcsignore';
export function setIgnorePath(repoPath: string): void {
  ignorePath = path.join(repoPath, '.vcsignore');
}

export function isIgnored(name: string): any {
  try {
    const content: string[] = readIgnore();
    const s: Set<string> = new Set(content);
    // console.log('(isIgnored): ', ignoredContents);

    if (s.has(name)) {
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

export function ignore(name: string): void {
  const s: Set<string> = new Set(readIgnore());
  s.add(name);
  fs.writeFileSync(ignorePath, JSON.stringify(Array.from(s)), 'utf-8');
}

export function readIgnore(): string[] {
  try {
    if (!fs.existsSync(ignorePath)) {
      fs.writeFileSync(ignorePath, '[]', 'utf-8');
      return [];      
    }
    return JSON.parse(fs.readFileSync(ignorePath, 'utf-8'));
  } catch (error) {
    console.log('(readIgnore)', error);
    return [];
  }
}