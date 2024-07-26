import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export function computeHash(content: Buffer) {
  return crypto.createHash('sha1').update(content).digest('hex');
}
export function hashFile(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(buffer).digest('hex');
}
export function hashEntries(entries: any) {
  let treeContent = '';
  entries.forEach((entry: any) => {
    const type = entry.isFile() ? '100644' : '040000';
    const header = `${type} ${entry.name}\0`;
    const entryHash = Buffer.from(entry.hash, 'hex');
    treeContent += header + entryHash.toString('binary');
  });
  const buffer = Buffer.from(treeContent, 'binary');
  return computeHash(buffer);
}



export function writeFile(p: string, content: string) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
    return {status: true, content: null};
  } catch (error) {
    return {status: false, content: error};
  }
}
export function deleteFile(p: string) {
  try {
    fs.rmSync(p);
    return { status: true, content: null };
  } catch (error) {
    return { status: false, content: error };
  }
}
export function readFile(p: string) {
  try {
    const content = fs.readFileSync(p).toString();
    return { status: true, content: content };
  } catch (error: any) {
    return { status: false, content: error.toString() };
  }
}

export function readDir(p: string) {
  try {
    const stats = fs.readdirSync(p);
    const tree = stats.map((stat: any) => {
      return {
        type: stat.isDirectory() ? 'tree' : 'blob',
        name: stat.name
      };
    })
    return { status: true, content: tree };;
  } catch (error) {
    return { status: false, content: error };
  }
}