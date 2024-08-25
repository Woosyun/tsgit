import { Hash } from "./types";

export function listXOR<T>(arr1: T[], arr2: T[] | undefined): [T[], T[]] {
  if (!arr2) {
    return [arr1, []];
  } else {
    return [arr1.filter((item) => !arr2.includes(item)), arr2.filter((item) => !arr1.includes(item))];
  }
}

export function listOR<T>(li1: T[], li2: T[], getKey: (t: T) => Hash): T[] {
  const m: Map<Hash, T> = new Map();

  li1.forEach((e: T) => m.set(getKey(e), e));
  li2.forEach((e: T) => {
    const hash: Hash = getKey(e);
    if (!m.has(hash))
      m.set(hash, e);
  });

  return Array.from(m.values());
}

export function listORSorted<T>(li1: T[], li2: T[], getKey: (t: T) => Hash, compareFunc: (a: T, b: T) => number): T[] {
  const unsortedLi: T[] = listOR(li1, li2, getKey);
  const sortedLi = unsortedLi.sort(compareFunc);
  
  return sortedLi;
}