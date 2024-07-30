import * as crypto from 'crypto';
import * as fs from 'fs';

export function computeHash(content: string) {
  return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
}

// export function hashEntries(entries: any) {
//   let treeContent = '';
//   entries.forEach((entry: any) => {
//     const type = entry.isFile() ? '100644' : '040000';
//     const header = `${type} ${entry.name}\0`;
//     const entryHash = Buffer.from(entry.hash, 'hex');
//     treeContent += header + entryHash.toString('binary');
//   });
//   const buffer = Buffer.from(treeContent, 'binary');
//   return computeHash(buffer);
// }