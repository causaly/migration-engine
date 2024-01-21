import { pipe } from 'fp-ts/function';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as TaskEither from 'fp-ts/TaskEither';

import {
  InvalidMigrationHistoryLogError,
  InvalidMigrationStateError,
  MigrationHistoryLogNotFoundError,
  MigrationHistoryLogReadError,
  MigrationRepoNotFoundError,
  MigrationRepoReadError,
} from '../errors';
import { MigrationState } from '../models';
import { MigrationHistoryLog, MigrationRepo } from '../ports';

export type CollectMigrationStateDeps = {
  listMigrations: MigrationRepo['listMigrations'];
  readHistory: MigrationHistoryLog['readHistory'];
};

export function collectMigrationState(): ReaderTaskEither.ReaderTaskEither<
  CollectMigrationStateDeps,
  | InvalidMigrationHistoryLogError
  | InvalidMigrationStateError
  | MigrationHistoryLogNotFoundError
  | MigrationHistoryLogReadError
  | MigrationRepoNotFoundError
  | MigrationRepoReadError,
  MigrationState.MigrationState
> {
  return pipe(
    ReaderTaskEither.ask<CollectMigrationStateDeps>(),
    ReaderTaskEither.chainTaskEitherK(({ listMigrations, readHistory }) => {
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
        TaskEither.bindW('history', () => readHistory()),
        TaskEither.flatMapEither(({ migrations, history }) =>
          MigrationState.create(migrations, history)
        )
      );
    })
  );
}
