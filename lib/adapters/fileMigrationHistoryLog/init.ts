import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { isValidationErrorLike } from 'zod-validation-error';

import {
  MigrationHistoryLogReadError,
  MigrationHistoryLogWriteError,
} from '../../errors';
import { History } from '../../models';
import type { MigrationHistoryLog } from '../../ports';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  FileSystemWriteError,
  stat,
  writeFile,
} from '../../utils/fs';
import type { FileMigrationHistoryLogContext } from './types';

export function makeInit(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['init'] {
  const { filePath } = ctx;

  return function init() {
    return pipe(
      stat(filePath),
      // ensure filePath points to an actual file on disk
      TaskEither.flatMap(
        TaskEither.fromPredicate(
          (stats) => stats.isFile(),
          () =>
            new MigrationHistoryLogWriteError(
              `Unable to initialize migration history-log; "${filePath}" does not point to a file on local disk`
            )
        )
      ),
      TaskEither.mapLeft((err) => {
        if (err instanceof FileSystemReadError) {
          return new MigrationHistoryLogReadError(
            `Unable to initialize migration history-log`,
            { cause: err }
          );
        }

        return err;
      }),
      // check if history-log already exists
      TaskEither.orElseW((err) => {
        if (err instanceof FileOrDirectoryNotFoundError) {
          // initialize history-log
          return pipe(
            History.emptyHistoryLog,
            History.serialize,
            TaskEither.fromEither,
            TaskEither.flatMap((content) => writeFile(filePath, content)),
            TaskEither.mapLeft((err) => {
              if (
                err instanceof FileSystemWriteError ||
                isValidationErrorLike(err)
              ) {
                return new MigrationHistoryLogWriteError(
                  `Unable to initialize migration history-log`,
                  { cause: err }
                );
              }

              return err;
            })
          );
        }

        return TaskEither.left(err);
      }),
      TaskEither.map(constUndefined)
    );
  };
}
