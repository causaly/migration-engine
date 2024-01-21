import * as TaskEither from 'fp-ts/TaskEither';

import {
  AcquireLockError,
  InvalidMigrationHistoryLogError,
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
  MigrationHistoryLogWriteError,
  ReleaseLockError,
} from '../errors';
import { History } from '../models';

export type MigrationHistoryLog = {
  init: () => TaskEither.TaskEither<
    MigrationHistoryLogReadError | MigrationHistoryLogWriteError,
    void
  >;
  readHistory: () => TaskEither.TaskEither<
    | MigrationHistoryLogNotFoundError
    | InvalidMigrationHistoryLogError
    | MigrationHistoryLogReadError,
    History.History
  >;
  acquireLock: () => TaskEither.TaskEither<
    | AcquireLockError
    | MigrationHistoryLogNotFoundError
    | InvalidMigrationHistoryLogError
    | MigrationHistoryLogReadError,
    {
      currentValue: History.History;
      persistHistory: PersistHistoryFunc;
      releaseLock: ReleaseLockFunc;
    }
  >;
};

export type PersistHistoryFunc = (
  history: History.History
) => TaskEither.TaskEither<
  InvalidMigrationHistoryLogError | MigrationHistoryLogWriteError,
  void
>;

export type ReleaseLockFunc = () => TaskEither.TaskEither<
  ReleaseLockError,
  void
>;
