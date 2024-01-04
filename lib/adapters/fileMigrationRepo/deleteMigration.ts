import * as path from 'node:path';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationRepoWriteError } from '../../errors';
import type { MigrationRepo } from '../../ports';
import { FileSystemWriteError, rm } from '../../utils/fs';
import type { FileMigrationRepoContext } from './types';

export function makeDeleteMigration(
  ctx: FileMigrationRepoContext
): MigrationRepo['deleteMigration'] {
  return function deleteMigration(migrationId) {
    const migrationDirPath = path.join(ctx.dirPath, migrationId);

    return pipe(
      rm(migrationDirPath),
      TaskEither.mapLeft((err) => {
        if (err instanceof FileSystemWriteError) {
          return new MigrationRepoWriteError(
            `Unable to delete migration "${migrationId}" in repository`,
            { cause: err }
          );
        }

        return err;
      }),
      TaskEither.map(constUndefined)
    );
  };
}
