import { FileSystemReadError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';

export function toFileSystemReadError(err: unknown): FileSystemReadError {
  if (err instanceof FileSystemReadError) {
    return err;
  }

  if (err instanceof Error) {
    return new FileSystemReadError(
      'Unable to read file or directory from file system',
      {
        cause: err,
      }
    );
  }

  if (isNodeFileSystemError(err)) {
    return new FileSystemReadError(
      `Unable to read file or directory from file system; received ${err.code} when attempting to read "${err.path}"`,
      {
        cause: err,
      }
    );
  }

  return new FileSystemReadError(
    'Unable to read file or directory from file system'
  );
}
