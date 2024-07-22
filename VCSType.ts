export type Blob = {
  hash: string; // id for file
  content: string;
};

export type TreeEntry = {
  name: string;
  type: 'blob' | 'tree';
  hash: string; // pointer
};

export type Tree = {
  hash: string; // id for this tree
  entries: TreeEntry[];
};

export type Commit = {
  hash: string; // id for commit
  message: string;
  author: Person;
  timestamp: Date;
  parentHash: string | null; //hash value for parent commit. If null, this commit is root(initial) commit
  treeHash: string; // pointer hash value for root tree. 왜 필요한지는 아직 모르겠음
};

export type Person = {
  name: string;
  id: string;
};