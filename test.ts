import { EntryStatus } from './src/types';
import VCS from './src/vcs';
import path from 'path';

const vcs = new VCS();
vcs.init(path.resolve('.'));
vcs.add('./test.ts');
vcs.commit('Initial commit');

const ignoreLi = ['.vcs', 'node_modules', 'dist', '.git'];
ignoreLi.forEach((i) => {
  vcs.ignore(i);
});

const status: EntryStatus[] = vcs.status();
console.log(JSON.stringify(status, null, 2));