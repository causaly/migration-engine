import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import memoize from 'lodash/memoize';

import { MigrationRepoWriteError } from '../../errors';
import type { MigrationRepo } from '../../ports';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';
import { readMigrationTemplates } from './utils/readMigrationTemplates';

const readMigrationTemplatesMemoized = memoize(readMigrationTemplates);

export function makeCreateMigration(
  ctx: FileMigrationRepoContext
): MigrationRepo['createMigration'] {
  const { dirPath, language } = ctx;
  const ext = getLanguageExtension(language);

  return function createMigration(migrationId) {
    return pipe(
      readMigrationTemplatesMemoized(language),
      TaskEither.mapLeft((err) => new MigrationRepoWriteError(err.message)),
      TaskEither.flatMap((templates) => {
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
                  templates.up,
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
                  templates.down,
                  {
                    encoding: 'utf8',
                  }
                ),
              toMigrationRepoWriteError
            )
          )
        );
      }),
      TaskEither.map(constUndefined)
    );
  };
}

function toMigrationRepoWriteError(err: unknown): MigrationRepoWriteError {
  if (err instanceof MigrationRepoWriteError) {
    return err;
  }

  if (err instanceof Error) {
    return new MigrationRepoWriteError(err.message);
  }

  if (typeof err === 'object' && err !== null) {
    if ('code' in err && err.code === 'ENOENT') {
      return new MigrationRepoWriteError(
        `Unable to create migration in repository; received ${err.code}`
      );
    }
  }

  return new MigrationRepoWriteError(
    'Unable to create migration in repository'
  );
}
