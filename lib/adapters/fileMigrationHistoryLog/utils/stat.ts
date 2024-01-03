import { type Stats } from 'node:fs';
import { stat as statNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
} from '../../../errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toMigrationHistoryLogReadError } from './toMigrationHistoryLogReadError';

export function stat(
  filePath: string
): TaskEither.TaskEither<
  MigrationHistoryLogNotFoundError | MigrationHistoryLogReadError,
  Stats
> {
  return TaskEither.tryCatch(
    () => statNative(filePath),
    (err) => {
      if (isNodeFileSystemError(err) && err.code === 'ENOENT') {
        return new MigrationHistoryLogNotFoundError(
          `Migration history-log file not found at "${filePath}"`
        );
      }

      return toMigrationHistoryLogReadError(err);
    }
  );
}
