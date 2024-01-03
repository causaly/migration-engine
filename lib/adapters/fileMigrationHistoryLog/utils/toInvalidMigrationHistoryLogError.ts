import { InvalidMigrationHistoryLogError } from '../../../errors';

export function toInvalidMigrationHistoryLogError(
  err: unknown
): InvalidMigrationHistoryLogError {
  if (err instanceof InvalidMigrationHistoryLogError) {
    return err;
  }

  if (err instanceof Error) {
    return new InvalidMigrationHistoryLogError(
      'invalid migration history-log file',
      { cause: err }
    );
  }

  return new InvalidMigrationHistoryLogError(
    'invalid migration history-log file'
  );
}
