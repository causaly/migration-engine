import type { MigrationRepo } from '../../ports';
import { makeCreateMigration } from './createMigration';
import { makeDeleteMigration } from './deleteMigration';
import { makeGetMigrations } from './getMigrations';
import { makeInit } from './init';
import type { FileMigrationRepoContext } from './types';

export const fileMigrationRepo: {
  [K in keyof MigrationRepo]: (
    ctx: FileMigrationRepoContext
  ) => MigrationRepo[K];
} = {
  init: makeInit,
  createMigration: makeCreateMigration,
  getMigrations: makeGetMigrations,
  deleteMigration: makeDeleteMigration,
};
