import { FileSystemWriteError } from './errors';
import { isNodeFileSystemError } from './isNodeFileSystemError';

export function toFileSystemWriteError(err: unknown): FileSystemWriteError {
  if (err instanceof FileSystemWriteError) {
    return err;
  }

  if (err instanceof Error) {
    return new FileSystemWriteError(
      'Unable to write file or directory to file system',
      {
        cause: err,
      }
    );
  }

  if (isNodeFileSystemError(err)) {
    return new FileSystemWriteError(
      `Unable to write file or directory to file system; received ${err.code} when attempting to write "${err.path}"`,
      {
        cause: err,
      }
    );
  }

  return new FileSystemWriteError(
    'Unable to write file or directory to file system'
  );
}
