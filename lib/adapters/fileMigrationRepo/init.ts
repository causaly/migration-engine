import { mkdir, stat } from 'node:fs/promises';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  MigrationRepoInitError,
  MigrationRepoNotFoundError,
} from '../../errors';
import type { MigrationRepo } from '../../ports/MigrationRepo';
import type { FileMigrationRepoContext } from './types';

export function makeInit(ctx: FileMigrationRepoContext): MigrationRepo['init'] {
  const { dirPath } = ctx;

  return function init() {
    return pipe(
      // check if dirPath already exists
      TaskEither.tryCatch(
        () => stat(dirPath),
        (err) => {
          // handle stat errors
          if (typeof err === 'object' && err !== null) {
            if ('code' in err && err.code === 'ENOENT') {
              return new MigrationRepoNotFoundError(
                `Unable to find directory "${dirPath}"`
              );
            }
          }

          return toMigrationRepoInitError(err);
        }
      ),
      // ensure dirPath points to a directory
      TaskEither.flatMap((stats) => {
        if (stats.isDirectory()) {
          return TaskEither.right(constUndefined);
        }

        return TaskEither.left(
          new MigrationRepoInitError(
            `Invalid migration directory path; "${ctx.dirPath}" does not point to a directory on local disk`
          )
        );
      }),
      // create directory if not exists
      TaskEither.orElseW((err) => {
        if (err instanceof MigrationRepoNotFoundError) {
          // create directory recursively
          return TaskEither.tryCatch(
            () => mkdir(dirPath, { recursive: true }),
            toMigrationRepoInitError
          );
        }

        return TaskEither.left(toMigrationRepoInitError(err));
      }),
      TaskEither.map(constUndefined)
    );
  };
}

function toMigrationRepoInitError(error: unknown): MigrationRepoInitError {
  if (error instanceof MigrationRepoInitError) {
    return error;
  }

  if (error instanceof Error) {
    return new MigrationRepoInitError(error.message);
  }

  return new MigrationRepoInitError(
    'Unable to initialize migration repository'
  );
}
