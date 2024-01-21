import type { PathLike, RmDirOptions } from 'node:fs';
import { rmdir as rmdirNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileSystemWriteError } from './errors';
import { toFileSystemWriteError } from './toFileSystemWriteError';

export function rmdir(
  filePath: PathLike,
  options?: RmDirOptions | undefined
): TaskEither.TaskEither<FileSystemWriteError, void> {
  return TaskEither.tryCatch(
    () => rmdirNative(filePath, options),
    toFileSystemWriteError
  );
}
