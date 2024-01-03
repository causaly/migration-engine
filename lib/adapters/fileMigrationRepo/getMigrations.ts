import { readdir } from 'node:fs/promises';
import * as path from 'node:path';

import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as Record from 'fp-ts/Record';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationRepoReadError } from '../../errors';
import { Migration } from '../../models';
import type { MigrationRepo } from '../../ports';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';

export function makeGetMigrations(
  ctx: FileMigrationRepoContext
): MigrationRepo['getMigrations'] {
  return function getMigrations() {
    return pipe(
      TaskEither.tryCatch(
        () =>
          readdir(ctx.dirPath, {
            encoding: 'utf8',
            recursive: false,
            withFileTypes: true,
          }),
        toMigrationRepoReadError
      ),
      // read migration files from directories
      TaskEither.flatMap((migrationDirs) => {
        return pipe(
          migrationDirs,
          ArrayFp.reduce(
            [] as Array<ReturnType<typeof readMigrationFromDisk>>,
            (acc, dirent) => {
              if (dirent.isDirectory()) {
                return [...acc, readMigrationFromDisk(ctx, dirent.name)];
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

function readMigrationFromDisk(
  ctx: FileMigrationRepoContext,
  dirname: string
): TaskEither.TaskEither<MigrationRepoReadError, Migration.Migration> {
  const ext = getLanguageExtension(ctx.language);

  return pipe(
    {
      up: path.join(ctx.dirPath, dirname, `up.${ext}`),
      down: path.join(ctx.dirPath, dirname, `down.${ext}`),
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
    Record.sequence(TaskEither.ApplicativeSeq),
    TaskEither.flatMapEither((migrateFuncs) =>
      pipe(
        Migration.parse({
          id: dirname,
          up: migrateFuncs.up,
          down: migrateFuncs.down,
        }),
        Either.mapLeft(toMigrationRepoReadError)
      )
    )
  );
}

function toMigrationRepoReadError(error: unknown): MigrationRepoReadError {
  if (error instanceof MigrationRepoReadError) {
    return error;
  }

  if (error instanceof Error) {
    return new MigrationRepoReadError(error.message);
  }

  return new MigrationRepoReadError('Unable to read migration repository');
}
