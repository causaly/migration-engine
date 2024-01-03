import { MigrationHistoryLogWriteError } from '../../../errors';

export function toMigrationHistoryLogWriteError(
  err: unknown
): MigrationHistoryLogWriteError {
  if (err instanceof MigrationHistoryLogWriteError) {
    return err;
  }

  if (err instanceof Error) {
    return new MigrationHistoryLogWriteError(
      'Unable to write to migration history-log on local disk',
      { cause: err }
    );
  }

  return new MigrationHistoryLogWriteError(
    'Unable to write to migration history-log on local disk'
  );
}
