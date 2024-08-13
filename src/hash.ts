import * as crypto from 'crypto';
import * as fs from 'fs';
import { Entry, Blob, Tree, Commit } from './types';

export function computeHash(content: string) {
  return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
}
export function hashTreeEntry(entry: Entry) {
  return computeHash(entry.name + entry.type + entry.hash);
}
export function hashTree(tree: Tree): string {
  return computeHash(tree.entries.map(hashTreeEntry).join(''));
}
export function hashBlob(blob: Blob): string {
  return computeHash(blob.content);
}
export function hashCommit(commit: Commit): string {
  return computeHash(commit.message + commit.branch + commit.hash + commit.parentHash);
}