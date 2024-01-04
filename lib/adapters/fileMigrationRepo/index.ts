import type { MigrationRepo } from '../../ports';
import { makeCreateMigrationFromTemplate } from './createMigrationFromTemplate';
import { makeDeleteMigration } from './deleteMigration';
import { makeGetMigrationTemplate } from './getMigrationTemplate';
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
  getMigrationTemplate: makeGetMigrationTemplate,
  createMigrationFromTemplate: makeCreateMigrationFromTemplate,
  listMigrations: makeListMigrations,
  deleteMigration: makeDeleteMigration,
  readMigration: makeReadMigration,
};
