import { rm } from 'node:fs/promises';
import * as path from 'node:path';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationRepoWriteError } from '../../errors';
import type { MigrationRepo } from '../../ports';
import type { FileMigrationRepoContext } from './types';

export function makeDeleteMigration(
  ctx: FileMigrationRepoContext
): MigrationRepo['deleteMigration'] {
  const { dirPath } = ctx;

  return function deleteMigration(migrationId) {
    return pipe(
      TaskEither.tryCatch(
        () => rm(path.join(dirPath, migrationId), { recursive: true }),
        (error) => {
          if (error instanceof Error) {
            return new MigrationRepoWriteError(error.message);
          }

          if (typeof error === 'object' && error !== null) {
            if ('code' in error && typeof error.code === 'string') {
              return new MigrationRepoWriteError(
                `Unable to delete migration "${migrationId}" in repository; ${error.code}`
              );
            }
          }

          return new MigrationRepoWriteError(
            `Unable to delete migration "${migrationId}" in repository`
          );
        }
      ),
      TaskEither.map(constUndefined)
    );
  };
}
