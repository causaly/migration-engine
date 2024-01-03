import { writeFile as writeFileNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { MigrationHistoryLogWriteError } from '../../../errors';
import { toMigrationHistoryLogWriteError } from './toMigrationHistoryLogWriteError';

export function writeFile(
  filePath: string,
  contents: string
): TaskEither.TaskEither<MigrationHistoryLogWriteError, void> {
  return TaskEither.tryCatch(
    () =>
      writeFileNative(filePath, contents, {
        encoding: 'utf8',
      }),
    toMigrationHistoryLogWriteError
  );
}
