import type { Dirent, ObjectEncodingOptions, PathLike } from 'node:fs';
import { readdir as readdirNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileOrDirectoryNotFoundError, FileSystemReadError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toFileSystemReadError } from './toFileSystemReadError';

export function readdir(
  dirPath: PathLike,
  options: ObjectEncodingOptions & {
    recursive?: boolean | undefined;
  }
): TaskEither.TaskEither<
  FileOrDirectoryNotFoundError | FileSystemReadError,
  Array<Dirent>
> {
  return TaskEither.tryCatch(
    () =>
      readdirNative(dirPath, {
        ...options,
        withFileTypes: true,
      }),
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
