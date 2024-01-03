export type NodeFileSystemError = {
  code: string;
  path: string;
};

export function isNodeFileSystemError(
  error: unknown
): error is NodeFileSystemError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
