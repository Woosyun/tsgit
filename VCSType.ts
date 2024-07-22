// Interface representing a Git Blob (file content)
interface Blob {
  type: 'blob';
  content: string; // Raw content of the file
}

// Interface representing a Git Tree (directory)
interface Tree {
  type: 'tree';
  entries: TreeEntry[]; // Array of entries (files and subdirectories)
}

// Interface representing a tree entry (file or subdirectory in a tree)
interface TreeEntry {
  mode: string; // File mode (e.g., '100644' for a file, '40000' for a directory)
  type: 'blob' | 'tree'; // Type of the entry
  hash: string; // SHA-1 hash of the blob or tree
  name: string; // Name of the file or directory
}

// Interface representing a Git Commit
interface Commit {
  type: 'commit';
  treeHash: string; // SHA-1 hash of the root tree object
  parentHashes: string[]; // Array of SHA-1 hashes of parent commits
  author: Person; // Information about the author
  committer: Person; // Information about the committer
  message: string; // Commit message
}

// Interface representing a person (author or committer)
interface Person {
  name: string;
  email: string;
  timestamp: number; // Unix timestamp
  timezone: string; // Timezone offset
}

// Interface representing a Git Tag
interface Tag {
  type: 'tag';
  objectHash: string; // SHA-1 hash of the tagged object (usually a commit)
  tagger: Person; // Information about the tagger
  message: string; // Tag message
}