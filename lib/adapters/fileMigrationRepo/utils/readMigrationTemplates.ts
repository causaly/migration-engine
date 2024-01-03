import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import * as Record from 'fp-ts/Record';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationTemplateNotFoundError } from '../../../errors';
import type { FileMigrationRepoContext } from '../types';
import { getLanguageExtension } from './getLanguageExtension';

export function readMigrationTemplates(
  language: FileMigrationRepoContext['language']
): TaskEither.TaskEither<
  MigrationTemplateNotFoundError,
  { up: string; down: string }
> {
  const ext = getLanguageExtension(language);

  return pipe(
    {
      up: path.resolve(__dirname, `../templates/up.${ext}`),
      down: path.resolve(__dirname, `../templates/down.${ext}`),
    },
    Record.map((filepath) =>
      TaskEither.tryCatch(
        () => readFile(filepath, 'utf8'),
        (err) => {
          if (err instanceof Error) {
            return new MigrationTemplateNotFoundError(
              `Migration template not found; ${err.message}`
            );
          }

          if (typeof err === 'object' && err !== null) {
            if ('code' in err && err.code === 'ENOENT') {
              return new MigrationTemplateNotFoundError(
                `Unable to read migration template; received ${err.code} for "${filepath}"`
              );
            }
          }

          return new MigrationTemplateNotFoundError(
            `Migration template not found; unable to read "${filepath}"`
          );
        }
      )
    ),
    Record.sequence(TaskEither.ApplicativeSeq)
  );
}
