import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogWriteError,
} from '../../errors';
import type { MigrationHistoryLog } from '../../ports';
import type { FileMigrationHistoryLogContext } from './types';
import { stat } from './utils/stat';
import { writeFile } from './utils/writeFile';

export function makeInit(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['init'] {
  const { filePath } = ctx;

  return function init() {
    return pipe(
      stat(filePath),
      // ensure filePath points to an actual file on disk
      TaskEither.flatMap((stats) => {
        if (stats.isFile()) {
          return TaskEither.right(stats);
        }

        return TaskEither.left(
          new MigrationHistoryLogWriteError(
            `Unable to initialize migration history-log; "${filePath}" does not point to a file on local disk`
          )
        );
      }),
      // check if history-log already exists
      TaskEither.orElseW((err) => {
        if (err instanceof MigrationHistoryLogNotFoundError) {
          // initialize history-log
          return writeFile(filePath, JSON.stringify([], null, 2));
        }

        return TaskEither.left(err);
      }),
      TaskEither.map(constUndefined)
    );
  };
}
