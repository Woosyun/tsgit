import path from 'path';
import { Blob, Entry, EntryStatus, Hash, Index, StatusType, Tree } from './types';
import fs from 'fs';
import { hashBlob } from './hash';
import { readObject } from './object';
import { isIgnored } from './ignore';

export function getStatus(targetDir: string, entry: Entry | null): EntryStatus[] {
  try {
    if (entry === null) {
      return [getStatusFromPath(targetDir, 'unstaged')];
    }

    const type = fs.statSync(targetDir).isDirectory() ? 'tree' : 'blob';
    if (type !== entry.type) {
      return [getStatusFromEntry(entry, 'deleted'), getStatusFromPath(targetDir, 'added')];
    }

    if (type === 'blob') {
      //how to compare?
      const blob: Blob = { content: fs.readFileSync(targetDir, 'utf-8') };
      const blobHash: Hash = hashBlob(blob);
      return [getStatusFromPath(targetDir, blobHash === entry.hash ? 'unmodified' : 'modified')];
    }

    //type is tree
    const oldTree = readObject(entry.hash) as Tree;
    const entryM: Map<string, Entry> = new Map(oldTree.entries.map((e: Entry) => [e.name, e]));

    const names: string[] = fs.readdirSync(targetDir).filter((name) => !isIgnored(name));
    const newChildren: EntryStatus[] = names.map((name: string) => getStatus(path.join(targetDir, name), entryM.get(name) || null)).flat();

    const newS: Set<string> = new Set(names);
    const deletedEntries: Entry[] = oldTree.entries.filter((e: Entry) => !newS.has(e.name));
    const deletedChildren: EntryStatus[] = deletedEntries.map((e: Entry) => getStatusFromEntry(e, 'deleted'));
    const children = newChildren.concat(deletedChildren).sort((a: EntryStatus, b: EntryStatus) => a.name.localeCompare(b.name));
    return [{
      ...entry,
      status: children.some((s: EntryStatus) => s.status !== 'unmodified') ? 'modified' : 'unmodified',
      children
    }];
  } catch (error: any) {
    throw new Error('(getStatus)->' + error.message);
  }
}

function getStatusFromPath(p: string, statusType: StatusType): EntryStatus {
  try {
    let entryStatus: EntryStatus = {
      name: path.basename(p),
      type: 'blob',
      hash: '',
      status: statusType,
      children: []
    };
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      entryStatus.type = 'tree';
      const names: string[] = fs.readdirSync(p).filter((name) => !isIgnored(name));
      entryStatus.children = names.map((name: string) => getStatusFromPath(path.join(p, name), statusType));
    }
  
    return entryStatus;
  } catch (error: any) {
    throw new Error('(getStatusFromPath)->' + error.message);
  }
}

function getStatusFromEntry(entry: Entry, statusType: StatusType): EntryStatus {
  try {
    let entryStatus: EntryStatus = {
      ...entry,
      status: statusType,
      children: []
    };
    
    if (entry.type === 'tree') {
      const tree = readObject(entry.hash) as Tree;
      entryStatus.children = tree.entries.map((childEntry: Entry) => getStatusFromEntry(childEntry, statusType));
    }
  
    return entryStatus;
  } catch (error: any) {
    throw new Error('(getStatusFromEntry)->' + error.message);
  }
}