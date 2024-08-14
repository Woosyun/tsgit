import Repository from './src/vcs';
import * as fs from 'fs';

const repo = new Repository();

repo.init(__dirname);
repo.add('.');
repo.commit('first commit');