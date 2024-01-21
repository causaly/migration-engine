import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import * as Record from 'fp-ts/Record';
import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationRepoReadError } from '../../errors';
import {
  FileOrDirectoryNotFoundError,
  FileSystemReadError,
  readFile,
} from '../../utils/fs';
import type { FileMigrationRepoContext } from './types';
import { getLanguageExtension } from './utils/getLanguageExtension';

export function makeGetMigrationTemplate(ctx: FileMigrationRepoContext) {
  let cache: {
    up: string;
    down: string;
  } | null = null;

  return function getMigrationTemplate(): TaskEither.TaskEither<
    MigrationRepoReadError,
    Record<'up' | 'down', string>
  > {
    // performance optimization: memoize migration template
    if (cache != null) {
      return TaskEither.of(cache);
    }

    const ext = getLanguageExtension(ctx.language);

    return pipe(
      {
        up: path.resolve(__dirname, `./templates/up.${ext}`),
        down: path.resolve(__dirname, `./templates/down.${ext}`),
      },
      Record.map((filepath) =>
        pipe(
          readFile(filepath, { encoding: 'utf8' }),
          TaskEither.mapLeft((err) => {
            if (err instanceof FileOrDirectoryNotFoundError) {
              return new MigrationRepoReadError(
                `Migration template not found; unable to read "${filepath}"`,
                { cause: err }
              );
            }

            if (err instanceof FileSystemReadError) {
              return new MigrationRepoReadError(
                `Unable to read migration template from "${filepath}"`,
                { cause: err }
              );
            }

            return err;
          })
        )
      ),
      Record.sequence(TaskEither.ApplicativeSeq),
      // update cache
      TaskEither.tap((template) => {
        cache = template;
        return TaskEither.right(template);
      })
    );
  };
}
