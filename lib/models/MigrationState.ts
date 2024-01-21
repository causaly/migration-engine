import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';

import { InvalidMigrationStateError } from '../errors';
import * as History from './History';
import * as HistoryEntry from './HistoryEntry';
import * as Migration from './Migration';

export type ExecutedMigration = Migration.Migration & {
  status: 'EXECUTED';
  executedAt: HistoryEntry.HistoryEntry['executedAt'];
};

export type PendingMigration = Migration.Migration & {
  status: 'PENDING';
  executedAt: null;
};

export type MigrationStateRecord = ExecutedMigration | PendingMigration;
export type MigrationState = Array<MigrationStateRecord>;

export function create(
  migrations: Array<Migration.Migration>,
  history: History.History
): Either.Either<InvalidMigrationStateError, MigrationState> {
  if (migrations.length < history.entries.length) {
    return Either.left(
      new InvalidMigrationStateError(
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
      ): Either.Either<InvalidMigrationStateError, MigrationStateRecord> => {
        const historyLogEntry = history.entries[index];

        if (historyLogEntry == null) {
          return Either.of({
            ...migration,
            status: 'PENDING',
            executedAt: null,
          });
        }

        if (migration.id !== historyLogEntry.id) {
          return Either.left(
            new InvalidMigrationStateError(
              `Invalid migration state; expected migration "${historyLogEntry.id}", received "${migration.id}". This indicates that migrations have been added or removed out of order.`
            )
          );
        }

        if (migration.checksum !== historyLogEntry.checksum) {
          return Either.left(
            new InvalidMigrationStateError(
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

export function isPendingMigration(
  record: MigrationStateRecord
): record is PendingMigration {
  return record.status === 'PENDING';
}

export function isExecutedMigration(
  record: MigrationStateRecord
): record is ExecutedMigration {
  return record.status === 'EXECUTED';
}
