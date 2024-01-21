import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
} from '../../errors';
import { History } from '../../models';
import { MigrationHistoryLog } from '../../ports';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  readFile,
} from '../../utils/fs';
import type { FileMigrationHistoryLogContext } from './types';
import { toInvalidMigrationHistoryLogError } from './utils/toInvalidMigrationHistoryLogError';

export function makeReadHistory(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['readHistory'] {
  const { filePath } = ctx;

  return function readHistory() {
    return pipe(
      readFile(filePath, { encoding: 'utf8' }),
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
          History.deserialize(contents),
          Either.mapLeft(toInvalidMigrationHistoryLogError)
        );
      })
    );
  };
}
