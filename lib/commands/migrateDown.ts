import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as TaskEither from 'fp-ts/TaskEither';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import {
  AcquireLockError,
  InvalidMigrationHistoryLogError,
  InvalidMigrationStateError,
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
  MigrationHistoryLogWriteError,
  MigrationNotFoundError,
  MigrationRepoNotFoundError,
  MigrationRepoReadError,
  MigrationRepoWriteError,
  MigrationRuntimeError,
  ReleaseLockError,
} from '../errors';
import { History, Migration, MigrationId, MigrationState } from '../models';
import { isAppliedMigration } from '../models/MigrationState';
import type { MigrationHistoryLog, MigrationRepo } from '../ports';

const schema = zod.object({
  migrationId: MigrationId.schema.optional(),
});

export type MigrateDownInputProps = zod.infer<typeof schema>;

export function parseMigrateDownInputProps(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, MigrateDownInputProps> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export type MigrateDownDeps = {
  listMigrations: MigrationRepo['listMigrations'];
  acquireLock: MigrationHistoryLog['acquireLock'];
};

export function migrateDown(
  props: MigrateDownInputProps
): ReaderTaskEither.ReaderTaskEither<
  MigrateDownDeps,
  | InvalidMigrationHistoryLogError
  | InvalidMigrationStateError
  | MigrationHistoryLogNotFoundError
  | MigrationHistoryLogReadError
  | MigrationHistoryLogWriteError
  | MigrationNotFoundError
  | MigrationRepoNotFoundError
  | MigrationRepoReadError
  | MigrationRepoWriteError
  | MigrationRuntimeError
  | AcquireLockError
  | ReleaseLockError,
  Array<MigrationId.MigrationId>
> {
  return pipe(
    ReaderTaskEither.ask<MigrateDownDeps>(),
    ReaderTaskEither.chainTaskEitherK(({ listMigrations, acquireLock }) => {
      return pipe(
        TaskEither.Do,
        TaskEither.bind('migrations', () =>
          pipe(
            listMigrations(),
            TaskEither.map((migrations) =>
              migrations.toSorted((migration, otherMigration) =>
                migration.id.localeCompare(otherMigration.id)
              )
            )
          )
        ),
        TaskEither.bindW('historyLock', () => acquireLock()),
        TaskEither.bindW(
          'migrationsToRollback',
          ({ migrations, historyLock }) =>
            pipe(
              MigrationState.create(migrations, historyLock.currentValue),
              Either.flatMap((migrationState) =>
                calculateMigrationsToRollback(migrationState, props.migrationId)
              ),
              TaskEither.fromEither
            )
        ),
        TaskEither.flatMap(({ migrationsToRollback, historyLock }) => {
          return pipe(
            migrationsToRollback,
            ArrayFp.map((migration) =>
              pipe(
                TaskEither.tryCatch(
                  () => migration.down(),
                  (err) =>
                    new MigrationRuntimeError(
                      `Unknown error occurred while rolling back migration "${migration.id}"`,
                      err instanceof Error ? { cause: err } : undefined
                    )
                ),
                TaskEither.flatMapEither(() =>
                  History.deleteRecordById(
                    historyLock.currentValue,
                    migration.id
                  )
                ),
                TaskEither.flatMap((nextHistory) =>
                  historyLock.persistHistory(nextHistory)
                ),
                TaskEither.map(() => migration.id)
              )
            ),
            ArrayFp.sequence(TaskEither.ApplicativeSeq)
          );
        })
      );
    })
  );
}

function calculateMigrationsToRollback(
  migrationState: MigrationState.MigrationState,
  targetMigrationId?: MigrationId.MigrationId
): Either.Either<
  MigrationNotFoundError | MigrationRuntimeError,
  Array<Migration.Migration>
> {
  if (targetMigrationId == null) {
    return Either.of(migrationState.filter(isAppliedMigration).toReversed());
  }

  const targetIndex = migrationState.findIndex(
    (migration) => migration.id === targetMigrationId
  );

  if (targetIndex === -1) {
    return Either.left(
      new MigrationNotFoundError(
        `Target migration "${targetMigrationId}" not found`
      )
    );
  }

  const migrationRecord = migrationState[targetIndex];

  if (migrationRecord.status === 'PENDING') {
    return Either.left(
      new MigrationRuntimeError(
        `Target migration "${targetMigrationId}" has not been applied`
      )
    );
  }

  return Either.of(
    migrationState.slice(targetIndex).filter(isAppliedMigration).toReversed()
  );
}
