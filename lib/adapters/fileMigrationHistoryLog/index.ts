import type { MigrationHistoryLog } from '../../ports';
import { makeAddExecutedMigration } from './addExecutedMigration';
import { makeGetExecutedMigrations } from './getExecutedMigrations';
import { makeInit } from './init';
import type { FileMigrationHistoryLogContext } from './types';

export const fileMigrationHistoryLog: {
  [K in keyof MigrationHistoryLog]: (
    ctx: FileMigrationHistoryLogContext
  ) => MigrationHistoryLog[K];
} = {
  init: makeInit,
  getExecutedMigrations: makeGetExecutedMigrations,
  addExecutedMigration: makeAddExecutedMigration,
};
