import { MigrationRepoReadError } from '../../../errors';

export function toMigrationRepoReadError(err: unknown): MigrationRepoReadError {
  if (err instanceof MigrationRepoReadError) {
    return err;
  }

  if (err instanceof Error) {
    return new MigrationRepoReadError(
      'Unable to read migration repo from local disk',
      {
        cause: err,
      }
    );
  }

  return new MigrationRepoReadError(
    'Unable to read migration repo from local disk'
  );
}
