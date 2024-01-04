import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import type { MigrationRepo } from '../../ports';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';
import { toMigrationRepoWriteError } from './utils/toMigrationRepoWriteError';

export function makeCreateMigrationFromTemplate(
  ctx: FileMigrationRepoContext
): MigrationRepo['createMigrationFromTemplate'] {
  const { dirPath, language } = ctx;
  const ext = getLanguageExtension(language);

  return function createMigrationFromTemplate(migrationId, template) {
    return pipe(
      TaskEither.tryCatch(
        () => mkdir(path.join(dirPath, migrationId), { recursive: true }),
        toMigrationRepoWriteError
      ),
      TaskEither.flatMap(() =>
        TaskEither.tryCatch(
          () =>
            writeFile(
              path.join(dirPath, migrationId, `up.${ext}`),
              template.up,
              {
                encoding: 'utf8',
              }
            ),
          toMigrationRepoWriteError
        )
      ),
      TaskEither.flatMap(() =>
        TaskEither.tryCatch(
          () =>
            writeFile(
              path.join(dirPath, migrationId, `down.${ext}`),
              template.down,
              {
                encoding: 'utf8',
              }
            ),
          toMigrationRepoWriteError
        )
      ),
      TaskEither.map(constUndefined)
    );
  };
}
