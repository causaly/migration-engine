import { FileMigrationRepoContext } from '../types';

export function getLanguageExtension(
  language: FileMigrationRepoContext['language']
) {
  return language === 'javascript' ? 'js' : 'ts';
}
