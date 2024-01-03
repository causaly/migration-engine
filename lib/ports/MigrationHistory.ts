import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationId } from '../models';

export type MigrationHistory = {
  init: () => TaskEither.TaskEither<Error, void>;
  getExecutedMigrations: () => TaskEither.TaskEither<
    Error,
    Array<{
      id: MigrationId.MigrationId;
      checksum: string;
      executedAt: Date;
    }>
  >;
  getLastExecutedMigration: () => TaskEither.TaskEither<
    Error,
    | {
        id: MigrationId.MigrationId;
        checksum: string;
        executedAt: Date;
      }
    | undefined
  >;
  addExecutedMigration: (migration: {
    id: MigrationId.MigrationId;
    checksum: string;
    executedAt: Date;
  }) => TaskEither.TaskEither<Error, void>;
  pruneToMigrationId: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<Error, void>;
};
