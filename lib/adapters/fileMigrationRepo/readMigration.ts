import * as path from 'node:path';

import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as Record from 'fp-ts/Record';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationNotFoundError, MigrationRepoReadError } from '../../errors';
import { Migration } from '../../models';
import type { MigrationRepo } from '../../ports';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  stat,
} from '../../utils/fs';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';
import { toMigrationRepoReadError } from './utils/toMigrationRepoReadError';

export function makeReadMigration(
  ctx: FileMigrationRepoContext
): MigrationRepo['readMigration'] {
  return function readMigration(id) {
    const ext = getLanguageExtension(ctx.language);
    const dirPath = path.join(ctx.dirPath, id);

    return pipe(
      stat(dirPath),
      // ensure dirPath points to an actual directory on disk
      TaskEither.flatMap((stats) => {
        if (stats.isDirectory()) {
          return TaskEither.right(stats);
        }

        return TaskEither.left(
          new MigrationRepoReadError(
            `Invalid migration module; path "${dirPath}" does not point to a directory on local disk`
          )
        );
      }),
      TaskEither.mapLeft((err) => {
        if (err instanceof FileOrDirectoryNotFoundError) {
          return new MigrationNotFoundError(
            `Migration not found; "${id}" does not exist on local disk`,
            { cause: err }
          );
        }

        if (err instanceof FileSystemReadError) {
          return new MigrationRepoReadError(`Unable to read migration`, {
            cause: err,
          });
        }

        return err;
      }),
      // read migration files
      TaskEither.flatMap(() => {
        return pipe(
          {
            up: path.join(ctx.dirPath, id, `up.${ext}`),
            down: path.join(ctx.dirPath, id, `down.${ext}`),
          },
          Record.map((filePath) =>
            pipe(
              TaskEither.tryCatch(() => {
                // @ts-ignore
                return import(filePath);
              }, toMigrationRepoReadError),
              TaskEither.flatMap((module) => {
                if (
                  typeof module === 'object' &&
                  'default' in module &&
                  typeof module.default === 'function'
                ) {
                  return TaskEither.right(module.default);
                }

                return TaskEither.left(
                  new MigrationRepoReadError(
                    `Invalid migration module; expected default export to be a function`
                  )
                );
              })
            )
          ),
          Record.sequence(TaskEither.ApplicativeSeq)
        );
      }),
      TaskEither.flatMapEither((migrateFuncs) =>
        pipe(
          Migration.parse({
            id,
            up: migrateFuncs.up,
            down: migrateFuncs.down,
          }),
          Either.mapLeft(toMigrationRepoReadError)
        )
      )
    );
  };
}
