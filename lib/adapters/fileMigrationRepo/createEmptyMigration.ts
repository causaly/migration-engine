// import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import type { MigrationRepo } from '../../ports';
import { FileSystemWriteError, mkdir, rmdir, writeFile } from '../../utils/fs';
import { makeGetMigrationTemplate } from './getMigrationTemplate';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';
import { toMigrationRepoWriteError } from './utils/toMigrationRepoWriteError';

export function makeCreateEmptyMigration(
  ctx: FileMigrationRepoContext
): MigrationRepo['createEmptyMigration'] {
  const { dirPath, language } = ctx;
  const ext = getLanguageExtension(language);
  const getMigrationTemplate = makeGetMigrationTemplate(ctx);

  return function createEmptyMigration(migrationId) {
    return TaskEither.bracketW(
      getMigrationTemplate(),
      (template) =>
        pipe(
          mkdir(path.join(dirPath, migrationId), { recursive: true }),
          TaskEither.flatMap(() =>
            writeFile(path.join(dirPath, migrationId, `up.${ext}`), template.up)
          ),
          TaskEither.flatMap(() =>
            writeFile(
              path.join(dirPath, migrationId, `down.${ext}`),
              template.down
            )
          ),
          TaskEither.mapLeft((err) => {
            if (err instanceof FileSystemWriteError) {
              return toMigrationRepoWriteError(err);
            }

            return err;
          }),
          TaskEither.map(constUndefined)
        ),
      (template, result) =>
        pipe(
          result,
          TaskEither.fromEither,
          TaskEither.orElse(() =>
            pipe(
              rmdir(path.join(dirPath, migrationId), { recursive: true }),
              TaskEither.mapLeft((err) => {
                if (err instanceof FileSystemWriteError) {
                  return toMigrationRepoWriteError(err);
                }

                return err;
              })
            )
          )
        )
    );
  };
}
