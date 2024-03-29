import type { PathLike, RmOptions } from 'node:fs';
import { rm as rmNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileSystemWriteError } from './errors';
import { toFileSystemWriteError } from './toFileSystemWriteError';

export function rm(
  filePath: PathLike,
  options?: RmOptions
): TaskEither.TaskEither<FileSystemWriteError, void> {
  return TaskEither.tryCatch(
    () => rmNative(filePath, options),
    toFileSystemWriteError
  );
}
