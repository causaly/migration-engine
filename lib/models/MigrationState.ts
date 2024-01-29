import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';

import { InvalidMigrationStateError } from '../errors';
import * as History from './History';
import * as HistoryRecord from './HistoryRecord';
import * as Migration from './Migration';

export type AppliedMigration = Migration.Migration & {
  status: 'APPLIED';
  executedAt: HistoryRecord.HistoryRecord['executedAt'];
};

export type PendingMigration = Migration.Migration & {
  status: 'PENDING';
  executedAt: null;
};

export type MigrationStateRecord = AppliedMigration | PendingMigration;
export type MigrationState = Array<MigrationStateRecord>;

export function create(
  migrations: Array<Migration.Migration>,
  history: History.History
): Either.Either<InvalidMigrationStateError, MigrationState> {
  if (migrations.length < history.records.length) {
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
        const historyLogEntry = history.records[index];

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
          status: 'APPLIED',
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

export function isAppliedMigration(
  record: MigrationStateRecord
): record is AppliedMigration {
  return record.status === 'APPLIED';
}
