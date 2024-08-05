import path from 'path';

let configPath = 'config';
export function setConfig(repoPath: string) {
  configPath = path.join(repoPath, 'config');
}