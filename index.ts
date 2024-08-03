import Repository from './vcs';
import * as fs from 'fs';

const repo = new Repository(__dirname);

repo.add('.');
repo.commit('first commit');

