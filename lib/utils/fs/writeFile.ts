import { writeFile as writeFileNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileSystemWriteError } from './errors';
import { toFileSystemWriteError } from './toFileSystemWriteError';

export function writeFile(
  filePath: string,
  contents: string
): TaskEither.TaskEither<FileSystemWriteError, void> {
  return TaskEither.tryCatch(
    () =>
      writeFileNative(filePath, contents, {
        encoding: 'utf8',
      }),
    toFileSystemWriteError
  );
}
