import { readObject } from "./object";
import { getHeadNames, getHead } from "./refs"
import { HeadType, Hash, Commit } from './types'

/**
 * Create graph for commits and edges connecting those commits in the repository
 * @param localOrRemote 0 for local, 1 for remote
 * @returns commitMap: Map<Hash, Commit> and edgeMap: Map<Hash, Hash[]>
 */
export function createGraph(localOrRemote: HeadType) {
  const headNames: string[] = getHeadNames(localOrRemote);
  const commitMap: Map<Hash, Commit> = new Map();
  const edgeMap: Map<Hash, Hash[]> = new Map();
  headNames.forEach((headName: string) => setGraph(getHead(localOrRemote, headName), commitMap, edgeMap));

  return { commitMap, edgeMap };
}

function setGraph(hash: Hash, commitMap: Map<Hash, Commit>, edgeMap: Map<Hash, Hash[]>) {
  const commit: Commit = readObject(hash);
  commitMap.set(hash, commit);
  if (commit.parentHash !== '') {
    if (!edgeMap.has(commit.parentHash)) {
      edgeMap.set(commit.parentHash, []);
    }
    edgeMap.get(commit.parentHash)?.push(hash);
    setGraph(commit.parentHash, commitMap, edgeMap);
  }
}