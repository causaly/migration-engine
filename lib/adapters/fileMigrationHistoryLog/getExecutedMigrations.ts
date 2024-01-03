import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationHistoryLog } from '../../ports';
import { HistoryLog } from './models';
import type { FileMigrationHistoryLogContext } from './types';
import { readFile } from './utils/readFile';
import { toInvalidMigrationHistoryLogError } from './utils/toInvalidMigrationHistoryLogError';

export function makeGetExecutedMigrations(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['getExecutedMigrations'] {
  const { filePath } = ctx;

  return function getExecutedMigrations() {
    return pipe(
      readFile(filePath),
      TaskEither.flatMapEither((contents) => {
        return pipe(
          HistoryLog.deserialize(contents),
          Either.mapLeft(toInvalidMigrationHistoryLogError)
        );
      })
    );
  };
}
