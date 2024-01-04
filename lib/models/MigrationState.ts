import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';

import { InvalidMigrationStateError } from '../errors';
import * as HistoryLog from './HistoryLog';
import * as Migration from './Migration';
import * as MigrationStateRecord from './MigrationStateRecord';

export type MigrationState = Array<MigrationStateRecord.MigrationStateRecord>;

export function create(
  migrations: Array<Migration.Migration>,
  historyLog: HistoryLog.HistoryLog
): Either.Either<InvalidMigrationStateError, MigrationState> {
  if (migrations.length < historyLog.length) {
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
      ): Either.Either<
        InvalidMigrationStateError,
        MigrationStateRecord.MigrationStateRecord
      > => {
        const historyLogEntry = historyLog[index];

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
