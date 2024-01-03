import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  InvalidMigrationHistoryLogError,
  InvalidMigrationState,
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
  MigrationRepoReadError,
} from '../errors';
import { HistoryLogEntry, Migration } from '../models';
import { MigrationHistoryLog, MigrationRepo } from '../ports';

export type CollectMigrationStateDeps = {
  getMigrations: MigrationRepo['getMigrations'];
  getExecutedMigrations: MigrationHistoryLog['getExecutedMigrations'];
};

export type MigrationStateEntry = Migration.Migration & {
  status: 'EXECUTED' | 'PENDING';
  executedAt: HistoryLogEntry.HistoryLogEntry['executedAt'] | null;
};

export type MigrationState = Array<MigrationStateEntry>;

export function collectMigrationState(): ReaderTaskEither.ReaderTaskEither<
  CollectMigrationStateDeps,
  | MigrationRepoReadError
  | MigrationHistoryLogNotFoundError
  | InvalidMigrationHistoryLogError
  | MigrationHistoryLogReadError
  | InvalidMigrationState,
  MigrationState
> {
  return pipe(
    ReaderTaskEither.ask<CollectMigrationStateDeps>(),
    ReaderTaskEither.chainTaskEitherK(
      ({ getMigrations, getExecutedMigrations }) => {
        return pipe(
          TaskEither.Do,
          TaskEither.bind('migrations', () =>
            pipe(
              getMigrations(),
              TaskEither.map((migrations) =>
                migrations.toSorted((migration, otherMigration) =>
                  migration.id.localeCompare(otherMigration.id)
                )
              )
            )
          ),
          TaskEither.bindW('historyLogEntries', () => getExecutedMigrations()),
          TaskEither.flatMapEither(({ migrations, historyLogEntries }) =>
            calculateMigrationState(migrations, historyLogEntries)
          )
        );
      }
    )
  );
}

function calculateMigrationState(
  migrations: Array<Migration.Migration>,
  historyLogEntries: Array<HistoryLogEntry.HistoryLogEntry>
): Either.Either<InvalidMigrationState, MigrationState> {
  if (migrations.length < historyLogEntries.length) {
    return Either.left(
      new InvalidMigrationState(
        'Invalid migration state; there atr more executed migrations than migrations'
      )
    );
  }

  return pipe(
    migrations,
    ArrayFp.mapWithIndex(
      (
        index,
        migration
      ): Either.Either<InvalidMigrationState, MigrationStateEntry> => {
        const historyLogEntry = historyLogEntries[index];

        if (historyLogEntry == null) {
          return Either.of({
            ...migration,
            status: 'PENDING',
            executedAt: null,
          });
        }

        if (migration.id !== historyLogEntry.id) {
          return Either.left(
            new InvalidMigrationState(
              `Invalid migration state; expected migration "${historyLogEntry.id}", received "${migration.id}". This indicates that migrations have been added or removed out of order.`
            )
          );
        }

        if (migration.checksum !== historyLogEntry.checksum) {
          return Either.left(
            new InvalidMigrationState(
              `Invalid migration state; checksum mismatch for migration "${migration.id}". This indicates that the migration code has been modified after it was executed.`
            )
          );
        }

        return Either.right({
          ...migration,
          status: 'EXECUTED',
          executedAt: historyLogEntry.executedAt,
        });
      }
    ),
    ArrayFp.sequence(Either.Applicative)
  );
}
