export type FileMigrationRepoContext = {
  dirPath: string;
  language: 'javascript' | 'typescript';
};

export type MigrationType = 'up' | 'down';
