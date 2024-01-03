import { MigrationHistoryLogReadError } from '../../../errors';

export function toMigrationHistoryLogReadError(
  err: unknown
): MigrationHistoryLogReadError {
  if (err instanceof MigrationHistoryLogReadError) {
    return err;
  }

  if (err instanceof Error) {
    return new MigrationHistoryLogReadError(
      'Unable to read migration history-log from local disk',
      {
        cause: err,
      }
    );
  }

  return new MigrationHistoryLogReadError(
    'Unable to read migration history-log from local disk'
  );
}
