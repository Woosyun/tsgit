export type Index = {
  name: string;
  type: 'blob' | 'tree';
  entries: Index[];
};

export type Entry = {
  name: string;
  type: 'blob' | 'tree';
  hash: string;
}
export type Blob = {
  content: string;
};
export type Tree = {
  entries: Entry[];
}

export type Commit = {
  message: string;
  hash: string; //pointer to root tree
  parentHash: string;
}

export type Branch = {
  name: string,
  hash: string
}