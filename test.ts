// import Repository from './vcs';
// import * as fs from 'fs';

// const repo = new Repository(__dirname);

// repo.add('.');
// repo.commit('first commit');

const m = new Map();
m.set('a', [0, 1, 2]);
m.set('b', [3, 4, 5]);
console.log([...m.values()].flat());