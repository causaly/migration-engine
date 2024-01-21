import type { PathLike, Stats } from 'node:fs';
import { stat as statNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileOrDirectoryNotFoundError, FileSystemReadError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toFileSystemReadError } from './toFileSystemReadError';

export function stat(
  dirPath: PathLike
): TaskEither.TaskEither<
  FileOrDirectoryNotFoundError | FileSystemReadError,
  Stats
> {
  return TaskEither.tryCatch(
    () => statNative(dirPath),
    (err) => {
      if (isNodeFileSystemError(err) && err.code === 'ENOENT') {
        return new FileOrDirectoryNotFoundError(
          `Directory not found at "${dirPath}"`
        );
      }

      return toFileSystemReadError(err);
    }
  );
}
