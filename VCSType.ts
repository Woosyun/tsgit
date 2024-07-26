export type Entry = {
  name: string;
  type: 'directory' | 'file';
  hash: string;
  entries: Entry[] | undefined;
};

export type TreeEntry = {
  name: string;
  type: 'tree' | 'blob';
  hash: string;
};
export type Tree = {
  entries: TreeEntry[];
};

export type Commit = {
  
}

export type Hash = string;