import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as TaskEither from 'fp-ts/TaskEither';
import { z as zod } from 'zod';
import {
  isValidationErrorLike,
  toValidationError,
  ValidationError,
} from 'zod-validation-error';

import {
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
  MigrationTemplateNotFoundError,
} from '../errors';
import {
  HistoryLogEntry,
  Migration,
  MigrationId,
  MigrationState,
} from '../models';
import { isPendingMigration } from '../models/MigrationState';
import { MigrationHistoryLog } from '../ports';
import {
  collectMigrationState,
  type CollectMigrationStateDeps,
} from './collectMigrationState';

const schema = zod.object({
  migrationId: MigrationId.schema.optional(),
});

export type MigrateUpInputProps = zod.infer<typeof schema>;

export function parseMigrateUpInputProps(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, MigrateUpInputProps> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export type MigrateUpDeps = CollectMigrationStateDeps & {
  addExecutedMigration: MigrationHistoryLog['addExecutedMigration'];
};

export function migrateUp(
  props: MigrateUpInputProps
): ReaderTaskEither.ReaderTaskEither<
  MigrateUpDeps,
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
  | MigrationTemplateNotFoundError,
  Array<MigrationId.MigrationId>
> {
  return pipe(
    collectMigrationState(),
    ReaderTaskEither.flatMapEither((migrationState) =>
      calculateMigrationsToApply(migrationState, props.migrationId)
    ),
    ReaderTaskEither.flatMap((migrationsToApply) => {
      return pipe(
        ReaderTaskEither.ask<MigrateUpDeps>(),
        ReaderTaskEither.chainTaskEitherK(({ addExecutedMigration }) => {
          return pipe(
            migrationsToApply,
            ArrayFp.map((migration) =>
              pipe(
                TaskEither.tryCatch(
                  () => migration.up(),
                  (err) =>
                    err instanceof Error
                      ? new MigrationRuntimeError(
                          `Unknown error occurred while applying migration "${migration.id}"`,
                          { cause: err }
                        )
                      : new MigrationRuntimeError(
                          `Unknown error occurred while applying migration "${migration.id}"`
                        )
                ),
                TaskEither.flatMapEither(() =>
                  HistoryLogEntry.parse({
                    id: migration.id,
                    executedAt: new Date(),
                    checksum: migration.checksum,
                  })
                ),
                TaskEither.mapLeft((err) => {
                  if (isValidationErrorLike(err)) {
                    return new MigrationRuntimeError(
                      `Invalid migration history log entry for migration "${migration.id}"`,
                      { cause: err }
                    );
                  }

                  return err;
                }),
                TaskEither.flatMap(addExecutedMigration),
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

function calculateMigrationsToApply(
  migrationState: MigrationState.MigrationState,
  targetMigrationId?: MigrationId.MigrationId
): Either.Either<
  MigrationNotFoundError | MigrationRuntimeError,
  Array<Migration.Migration>
> {
  if (targetMigrationId == null) {
    return Either.of(migrationState.filter(isPendingMigration));
  }

  const targetIndex = migrationState.findLastIndex(
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

  if (migrationRecord.status === 'EXECUTED') {
    return Either.left(
      new MigrationRuntimeError(
        `Target migration "${targetMigrationId}" is already applied`
      )
    );
  }

  return Either.of(
    migrationState.slice(0, targetIndex + 1).filter(isPendingMigration)
  );
}
