import type { PathLike } from 'node:fs';
import { readFile as readFileNative } from 'node:fs/promises';

import type { TranscodeEncoding } from 'buffer';
import * as TaskEither from 'fp-ts/TaskEither';

import { FileOrDirectoryNotFoundError, FileSystemReadError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';
import { toFileSystemReadError } from './toFileSystemReadError';

export function readFile(
  filePath: PathLike,
  options: { encoding: TranscodeEncoding }
): TaskEither.TaskEither<
  FileOrDirectoryNotFoundError | FileSystemReadError,
  string
> {
  return TaskEither.tryCatch(
    () => readFileNative(filePath, options),
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
