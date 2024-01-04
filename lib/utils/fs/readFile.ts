import { readFile as readFileNative } from 'node:fs/promises';

import * as TaskEither from 'fp-ts/TaskEither';

import { FileOrDirectoryNotFoundError, FileSystemReadError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toFileSystemReadError } from './toFileSystemReadError';

export function readFile(
  filePath: string
): TaskEither.TaskEither<
  FileOrDirectoryNotFoundError | FileSystemReadError,
  string
> {
  return TaskEither.tryCatch(
    () => readFileNative(filePath, { encoding: 'utf8' }),
    (err) => {
      if (isNodeFileSystemError(err) && err.code === 'ENOENT') {
        return new FileOrDirectoryNotFoundError(
          `File not found at "${filePath}"`
        );
      }

      return toFileSystemReadError(err);
    }
  );
}
