import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { InvalidMigrationHistoryLogError } from '../../errors';
import { MigrationHistoryLog } from '../../ports';
import { makeGetExecutedMigrations } from './getExecutedMigrations';
import { HistoryLog } from './models';
import type { FileMigrationHistoryLogContext } from './types';
import { writeFile } from './utils/writeFile';

export function makeAddExecutedMigration(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['addExecutedMigration'] {
  const { filePath } = ctx;

  return function addExecutedMigration(executedMigration) {
    return pipe(
      makeGetExecutedMigrations(ctx)(),
      TaskEither.map((historyLog) => {
        return HistoryLog.addEntry(historyLog, executedMigration);
      }),
      TaskEither.flatMapEither((historyLog) => {
        return pipe(
          HistoryLog.serialize(historyLog),
          Either.mapLeft((err) => {
            return new InvalidMigrationHistoryLogError(err.message, {
              cause: err,
            });
          })
        );
      }),
      TaskEither.flatMap((contents) => writeFile(filePath, contents))
    );
  };
}
