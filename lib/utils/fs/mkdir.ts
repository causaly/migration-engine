import { mkdir as mkdirNative } from 'node:fs/promises';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { FileSystemWriteError } from './errors';
import { toFileSystemWriteError } from './toFileSystemWriteError';

export function mkdir(
  dirPath: string
): TaskEither.TaskEither<FileSystemWriteError, void> {
  return pipe(
    TaskEither.tryCatch(
      () =>
        mkdirNative(dirPath, {
          recursive: true,
        }),
      toFileSystemWriteError
    ),
    TaskEither.map(constUndefined)
  );
}
