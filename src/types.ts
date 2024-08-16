export type Index = {
  name: string;
  type: 'blob' | 'tree';
  entries: Index[];
};
export type Hash = string;
export type Entry = {
  name: string;
  type: 'blob' | 'tree';
  hash: Hash;
};
export type Blob = {
  content: string;
};
export type Tree = {
  entries: Entry[];
};
export type Commit = {
  message: string;
  branch: string;
  hash: Hash; //pointer to root tree
  parentHash: Hash;
};

export type HeadType = 0 | 1;

export type Node = Commit;