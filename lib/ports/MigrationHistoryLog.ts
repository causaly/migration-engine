import * as TaskEither from 'fp-ts/TaskEither';

import {
  InvalidMigrationHistoryLogError,
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
  MigrationHistoryLogWriteError,
} from '../errors';
import { HistoryLogEntry } from '../models';

export type MigrationHistoryLog = {
  init: () => TaskEither.TaskEither<
    MigrationHistoryLogReadError | MigrationHistoryLogWriteError,
    void
  >;
  getExecutedMigrations: () => TaskEither.TaskEither<
    | MigrationHistoryLogNotFoundError
    | InvalidMigrationHistoryLogError
    | MigrationHistoryLogReadError,
    Array<HistoryLogEntry.HistoryLogEntry>
  >;
  addExecutedMigration: (
    executedMigration: HistoryLogEntry.HistoryLogEntry
  ) => TaskEither.TaskEither<
    | MigrationHistoryLogNotFoundError
    | InvalidMigrationHistoryLogError
    | MigrationHistoryLogReadError
    | MigrationHistoryLogWriteError,
    void
  >;
};
