import { MigrationRepoWriteError } from '../../../errors';

export function toMigrationRepoWriteError(
  err: unknown
): MigrationRepoWriteError {
  if (err instanceof MigrationRepoWriteError) {
    return err;
  }

  if (err instanceof Error) {
    return new MigrationRepoWriteError(
      'Unable to write to migration repo on local disk',
      {
        cause: err,
      }
    );
  }

  return new MigrationRepoWriteError(
    'Unable to write to migration repo on local disk'
  );
}
