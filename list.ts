export function listXOR<T>(arr1: T[], arr2: T[] | undefined): [T[], T[]] {
  if (!arr2) {
    return [arr1, []];
  } else {
    return [arr1.filter((item) => !arr2.includes(item)), arr2.filter((item) => !arr1.includes(item))];
  }
}