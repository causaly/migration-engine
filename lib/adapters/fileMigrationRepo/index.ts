import type { MigrationRepo } from '../../ports';
import { makeCreateEmptyMigration } from './createEmptyMigration';
import { makeDeleteMigration } from './deleteMigration';
import { makeInit } from './init';
import { makeListMigrations } from './listMigrations';
import { makeReadMigration } from './readMigration';
import type { FileMigrationRepoContext } from './types';

export const fileMigrationRepo: {
  [K in keyof MigrationRepo]: (
    ctx: FileMigrationRepoContext
  ) => MigrationRepo[K];
} = {
  init: makeInit,
  createEmptyMigration: makeCreateEmptyMigration,
  listMigrations: makeListMigrations,
  deleteMigration: makeDeleteMigration,
  readMigration: makeReadMigration,
};
