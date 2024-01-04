import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
} from '../../errors';
import { HistoryLog } from '../../models';
import { MigrationHistoryLog } from '../../ports';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  readFile,
} from '../../utils/fs';
import type { FileMigrationHistoryLogContext } from './types';
import { toInvalidMigrationHistoryLogError } from './utils/toInvalidMigrationHistoryLogError';

export function makeGetExecutedMigrations(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['getExecutedMigrations'] {
  const { filePath } = ctx;

  return function getExecutedMigrations() {
    return pipe(
      readFile(filePath),
      TaskEither.mapLeft((err) => {
        if (err instanceof FileOrDirectoryNotFoundError) {
          return new MigrationHistoryLogNotFoundError(
            `Migration history-log not found; unable to read "${filePath}"`,
            { cause: err }
          );
        }

        if (err instanceof FileSystemReadError) {
          return new MigrationHistoryLogReadError(
            `Unable to read migration history-log from "${filePath}"`,
            { cause: err }
          );
        }

        return err;
      }),
      TaskEither.flatMapEither((contents) => {
        return pipe(
          HistoryLog.deserialize(contents),
          Either.mapLeft(toInvalidMigrationHistoryLogError)
        );
      })
    );
  };
}
