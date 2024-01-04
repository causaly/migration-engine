import { type Dirent } from 'node:fs';

import * as ArrayFp from 'fp-ts/Array';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { isValidationErrorLike } from 'zod-validation-error';

import {
  MigrationNotFoundError,
  MigrationRepoNotFoundError,
  MigrationRepoReadError,
} from '../../errors';
import { Migration, MigrationId } from '../../models';
import type { MigrationRepo } from '../../ports';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  readdir,
} from '../../utils/fs';
import { makeReadMigration } from './readMigration';
import type { FileMigrationRepoContext } from './types';

export function makeListMigrations(
  ctx: FileMigrationRepoContext
): MigrationRepo['listMigrations'] {
  return function getMigrations() {
    return pipe(
      readdir(ctx.dirPath),
      // ensure migration repo exists
      TaskEither.mapLeft((err) => {
        if (err instanceof FileOrDirectoryNotFoundError) {
          return new MigrationRepoNotFoundError(
            `Migration repo not found; "${ctx.dirPath}" does not exist on local disk`,
            { cause: err }
          );
        }

        if (err instanceof FileSystemReadError) {
          return new MigrationRepoReadError(
            `Unable to read migration from "${ctx.dirPath}"`,
            { cause: err }
          );
        }

        return err;
      }),
      // read migration files from directories
      TaskEither.flatMap((migrationDirs) => {
        return pipe(
          migrationDirs,
          ArrayFp.reduce(
            [] as Array<ReturnType<typeof readMigrationDirent>>,
            (acc, dirent) => {
              if (dirent.isDirectory()) {
                return [...acc, readMigrationDirent(ctx, dirent)];
              }

              return acc;
            }
          ),
          ArrayFp.sequence(TaskEither.ApplicativeSeq)
        );
      })
    );
  };
}

function readMigrationDirent(
  ctx: FileMigrationRepoContext,
  dirent: Dirent
): TaskEither.TaskEither<MigrationRepoReadError, Migration.Migration> {
  return pipe(
    dirent.name,
    MigrationId.parse,
    TaskEither.fromEither,
    TaskEither.flatMap(makeReadMigration(ctx)),
    TaskEither.mapLeft((err) => {
      if (isValidationErrorLike(err)) {
        return new MigrationRepoReadError(
          `Invalid migration ID "${dirent.name}"`
        );
      }

      if (err instanceof MigrationNotFoundError) {
        return new MigrationRepoReadError(
          `Migration not found; "${dirent.name}" does not exist`
        );
      }

      return err;
    })
  );
}
