import * as fs from 'fs';
import * as path from 'path';

let objectsPath = 'objects';
export function setObjectsPath(repoPath: string) {
  objectsPath = path.join(repoPath, 'objects');
}

export function hashToObjectPath(hash: string): string {
  return path.join(objectsPath, hash.slice(0, 2), hash.slice(2));
}
export function createObject(hash: string, content: any): boolean {
  try {
    const p = hashToObjectPath(hash);
    const dir = path.dirname(p);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(content), 'utf-8');
    return true;
  } catch (error) {
    console.log('(createObject)', error);
    return false;
  }
}
export function readObject(hash: string) {
  try {
    const p = hashToObjectPath(hash);
    const content: string = fs.readFileSync(p, 'utf-8').toString();
    return JSON.parse(content);
  } catch (error) {
    console.log('(readObject)', error);
    return null;
  }
}