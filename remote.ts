import http from 'http';
import { getHeadNames, readHead, setHead } from './refs';
import { Commit, Hash } from './types';
import { getEntireCommit, readObject } from './object';
import { listXOR } from './list';


let hostname = "";
export function setRemoteRepositoryUrl(newHostname: string) {
  hostname = newHostname;
}

async function upload(body: string) {
  try {
    const response = await fetch('https://example.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

function readBranch(head: string): Hash[] {
  let hashArray: Hash[] = [];
  let hash = readHead(0, head);
  let commit = readObject(hash) as Commit;

  while (commit.parentHash && commit.branch === head) {
    hashArray.push(hash);
    hash = commit.parentHash;
    commit = readObject(hash) as Commit;
  }

  return hashArray;
}

/**
 * 1. fetch
 * 2. compare refs/remotes with refs/locals and find revisions those are not presented in refs/remotes
 * 3. update refs/remotes and upload to remote repository
 */
export function push() { 
  //fetch
  if (!fetch()) {
    console.log('(push) fetch failed');
    return;
  }

  //compare
  const localHeads = getHeadNames(0);
  const localBranches = new Map<string, Hash[]>(localHeads.map((head: string) => [head, readBranch(head)]));
  const remoteHeads = getHeadNames(1);
  const remoteBranches = new Map<string, Hash[]>(remoteHeads.map((head: string) => [head, readBranch(head)]));

  const newBranches = new Map<string, Hash[]>();
  for (const [head, localHashes] of localBranches) {
    const [newLocalHashes, newRemoteHashes] = listXOR(localHashes, remoteBranches.get(head));
    if (newLocalHashes.length !== 0) {
      if (newRemoteHashes.length !== 0) {
        console.log('(push) conflict detected');
        return;
      }
      newBranches.set(head, newLocalHashes);
    }
  }

  //update refs/remote
  for (const [head, _] of localBranches) {
    if (newBranches.has(head))
      setHead(1, head, readHead(0, head));
  }
  
  //upload newObjects and newBranches
  const commitHashes = [...newBranches.values()].flat();
  const newHashAndContentMap: Map<Hash, string> = new Map(commitHashes.map((hash: Hash) => getEntireCommit(hash)).flat());
  const obj = {
    objects: [...newHashAndContentMap],
    branches: [...newBranches]
  };
  const body = JSON.stringify(obj);
  upload(body);
}

/**
 * fetch remote repository to refs/remote
 */
function fetchRemote() { }

/**
 * 1. fetch remote repository
 * 2. compare refs/locals with refs/remotes and find revisions those are not presented in locals
 */
export function pull() { 
  //fetch
  if (!fetch()) {
    console.log('(pull) fetch failed');
    return;
  }
  //compare
  //if no conflict, update refs/local
}