import type { MigrationHistoryLog } from '../../ports';
import { makeAcquireLock } from './acquireLock';
import { makeInit } from './init';
import { makeReadHistory } from './readHistory';
import type { FileMigrationHistoryLogContext } from './types';

export const fileMigrationHistoryLog: {
  [K in keyof MigrationHistoryLog]: (
    ctx: FileMigrationHistoryLogContext
  ) => MigrationHistoryLog[K];
} = {
  init: makeInit,
  readHistory: makeReadHistory,
  acquireLock: makeAcquireLock,
};
