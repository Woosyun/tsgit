// Example usage
const exampleBlob: Blob = {
  type: 'blob',
  content: 'console.log("Hello, Git!");'
};

const exampleTree: Tree = {
  type: 'tree',
  entries: [
      {
          mode: '100644',
          type: 'blob',
          hash: 'b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0',
          name: 'example.js'
      }
  ]
};

const exampleCommit: Commit = {
  type: 'commit',
  treeHash: 'd670460b4b4aece5915caf5c68d12f560a9fe3e4',
  parentHashes: [],
  author: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      timestamp: 1625600000,
      timezone: '+0000'
  },
  committer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      timestamp: 1625600000,
      timezone: '+0000'
  },
  message: 'Initial commit'
};

const exampleTag: Tag = {
  type: 'tag',
  objectHash: 'd670460b4b4aece5915caf5c68d12f560a9fe3e4',
  tagger: {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      timestamp: 1625600000,
      timezone: '+0000'
  },
  message: 'v1.0.0'
};

// Function to create a new commit
function createCommit(
  treeHash: string,
  parentHashes: string[],
  author: Person,
  committer: Person,
  message: string
): Commit {
  return {
      type: 'commit',
      treeHash,
      parentHashes,
      author,
      committer,
      message
  };
}

// Example commit creation
const newCommit = createCommit(
  'd670460b4b4aece5915caf5c68d12f560a9fe3e4',
  ['a3c1e2f6d1a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7'],
  {
      name: 'Alice',
      email: 'alice@example.com',
      timestamp: 1625601234,
      timezone: '+0000'
  },
  {
      name: 'Alice',
      email: 'alice@example.com',
      timestamp: 1625601234,
      timezone: '+0000'
  },
  'Added new feature'
);

console.log(newCommit);


















interface IVCS {
  historyDir: string;
  fileName: string;
  commit: () => void;
  getHistory: () => void;
  changeRevision: () => void;
};

class VCS implements IVCS {
  historyDir = "";
  fileName = "";

  constructor(filePath: string) {
    this.fileName = filePath;
    //get current working directory
  }

  commit() {
    //1. diff with lastest version of history and create new revision. if there is no history before, create one
  }
  getHistory() {
    
  }
  changeRevision() {

  }
}