export class FileOrDirectoryNotFoundError extends Error {
  name = 'FileOrDirectoryNotFoundError' as const;
}

export class FileSystemReadError extends Error {
  name = 'FileSystemReadError' as const;
}

export class FileSystemWriteError extends Error {
  name = 'FileSystemWriteError' as const;
}

export type NodeFileSystemError = {
  code: string;
  path: string;
};
