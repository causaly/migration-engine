import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationNotFoundError,
  MigrationRepoNotFoundError,
  MigrationRepoReadError,
  MigrationRepoWriteError,
} from '../errors';
import { Migration, MigrationId } from '../models';

export type MigrationRepo = {
  init: () => TaskEither.TaskEither<
    MigrationRepoReadError | MigrationRepoWriteError,
    void
  >;
  listMigrations: () => TaskEither.TaskEither<
    MigrationRepoNotFoundError | MigrationRepoReadError,
    Array<Migration.Migration>
  >;
  readMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<
    MigrationNotFoundError | MigrationRepoReadError,
    Migration.Migration
  >;
  createEmptyMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<
    MigrationRepoReadError | MigrationRepoWriteError,
    void
  >;
  deleteMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<MigrationRepoWriteError, void>;
  // getMigrationTemplate: () => TaskEither.TaskEither<
  //   MigrationTemplateNotFoundError | MigrationRepoReadError,
  //   {
  //     up: string;
  //     down: string;
  //   }
  // >;
};
