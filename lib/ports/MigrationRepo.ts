import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationNotFoundError,
  MigrationRepoNotFoundError,
  MigrationRepoReadError,
  MigrationRepoWriteError,
  MigrationTemplateNotFoundError,
} from '../errors';
import { Migration, MigrationId } from '../models';

export type MigrationRepo = {
  init: () => TaskEither.TaskEither<
    MigrationRepoReadError | MigrationRepoWriteError,
    void
  >;
  getMigrationTemplate: () => TaskEither.TaskEither<
    MigrationTemplateNotFoundError | MigrationRepoReadError,
    {
      up: string;
      down: string;
    }
  >;
  readMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<
    MigrationNotFoundError | MigrationRepoReadError,
    Migration.Migration
  >;
  listMigrations: () => TaskEither.TaskEither<
    MigrationRepoNotFoundError | MigrationRepoReadError,
    Array<Migration.Migration>
  >;
  createMigrationFromTemplate: (
    id: MigrationId.MigrationId,
    template: {
      up: string;
      down: string;
    }
  ) => TaskEither.TaskEither<MigrationRepoWriteError, void>;
  deleteMigration: (
    id: MigrationId.MigrationId
  ) => TaskEither.TaskEither<MigrationRepoWriteError, void>;
};
