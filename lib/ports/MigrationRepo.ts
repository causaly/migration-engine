import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationRepoInitError,
  MigrationRepoReadError,
  MigrationRepoWriteError,
} from '../errors';
import { Migration, MigrationId } from '../models';

export type MigrationRepo = {
  init: () => TaskEither.TaskEither<MigrationRepoInitError, void>;
  getMigrations: () => TaskEither.TaskEither<
    MigrationRepoReadError,
    Array<Migration.Migration>
  >;
  createMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<MigrationRepoWriteError, void>;
  deleteMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<MigrationRepoWriteError, void>;
};
