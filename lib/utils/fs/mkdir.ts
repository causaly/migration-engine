import type { MakeDirectoryOptions, PathLike } from 'node:fs';
import { mkdir as mkdirNative } from 'node:fs/promises';

import { constUndefined, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';

import { FileSystemWriteError } from './errors';
import { toFileSystemWriteError } from './toFileSystemWriteError';

export function mkdir(
  dirPath: PathLike,
  options: MakeDirectoryOptions & {
    recursive?: boolean | undefined;
  }
): TaskEither.TaskEither<FileSystemWriteError, void> {
  return pipe(
    TaskEither.tryCatch(
      () => mkdirNative(dirPath, options),
      toFileSystemWriteError
    ),
    TaskEither.map(constUndefined)
  );
}
