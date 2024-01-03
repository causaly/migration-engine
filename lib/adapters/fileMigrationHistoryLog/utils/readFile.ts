import { readFile as readFileNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
} from '../../../errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toMigrationHistoryLogReadError } from './toMigrationHistoryLogReadError';

export function readFile(
  filePath: string
): TaskEither.TaskEither<
  MigrationHistoryLogNotFoundError | MigrationHistoryLogReadError,
  string
> {
  return TaskEither.tryCatch(
    () => readFileNative(filePath, { encoding: 'utf8' }),
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
