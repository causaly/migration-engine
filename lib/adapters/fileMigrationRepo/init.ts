import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationRepoReadError, MigrationRepoWriteError } from '../../errors';
import type { MigrationRepo } from '../../ports/MigrationRepo';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  FileSystemWriteError,
  mkdir,
  stat,
} from '../../utils/fs';
import type { FileMigrationRepoContext } from './types';

export function makeInit(ctx: FileMigrationRepoContext): MigrationRepo['init'] {
  const { dirPath } = ctx;

  return function init() {
    return pipe(
      stat(dirPath),
      // ensure dirPath points to an actual directory on disk
      TaskEither.flatMap(
        TaskEither.fromPredicate(
          (stats) => stats.isDirectory(),
          () =>
            new MigrationRepoWriteError(
              `Unable to initialize migration repo; "${dirPath}" does not point to a directory on local disk`
            )
        )
      ),
      TaskEither.mapLeft((err) => {
        if (err instanceof FileSystemReadError) {
          return new MigrationRepoReadError(
            `Unable to initialize migration repo`,
            { cause: err }
          );
        }

        return err;
      }),
      // initialize migration repo if it doesn't exist
      TaskEither.orElseW((err) => {
        if (err instanceof FileOrDirectoryNotFoundError) {
          return pipe(
            mkdir(dirPath),
            TaskEither.mapLeft((err) => {
              if (err instanceof FileSystemWriteError) {
                return new MigrationRepoWriteError(
                  `Unable to initialize migration repo`,
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
