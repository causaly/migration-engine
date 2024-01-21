import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { lock } from 'proper-lockfile';
import { isValidationErrorLike } from 'zod-validation-error';

import {
  AcquireLockError,
  InvalidMigrationHistoryLogError,
  MigrationHistoryLogWriteError,
  ReleaseLockError,
} from '../../errors';
import { History } from '../../models';
import type { MigrationHistoryLog } from '../../ports';
import { FileSystemWriteError, writeFile } from '../../utils/fs';
import { makeReadHistory } from './readHistory';
import type { FileMigrationHistoryLogContext } from './types';
import { toMigrationHistoryLogWriteError } from './utils/toMigrationHistoryLogWriteError';

export function makeAcquireLock(
  ctx: FileMigrationHistoryLogContext
): MigrationHistoryLog['acquireLock'] {
  const { filePath } = ctx;

  return function acquireLock() {
    return pipe(
      TaskEither.tryCatch(
        () => lock(filePath.toString()),
        (err) =>
          new AcquireLockError(
            `Unable to acquire lock on "${filePath}"`,
            err instanceof Error ? { cause: err } : undefined
          )
      ),
      TaskEither.bindTo('releaseLockAsync'),
      TaskEither.bindW('defaultValue', makeReadHistory(ctx)),
      TaskEither.map(({ defaultValue, releaseLockAsync }) => {
        let value = defaultValue;
        let isLockReleased = false;

        return {
          // use getter to prevent mutation
          get currentValue() {
            return value;
          },
          persistHistory: (history) =>
            pipe(
              // ensure lock has not been released
              isLockReleased,
              Either.fromPredicate(
                (flag) => flag === false,
                () =>
                  new MigrationHistoryLogWriteError(
                    `Unable to write to migration history-log; lock has been released`
                  )
              ),
              // update history on disk
              Either.flatMap(() => History.serialize(history)),
              TaskEither.fromEither,
              TaskEither.flatMap((contents) => writeFile(filePath, contents)),
              // handle errors
              TaskEither.mapLeft((err) => {
                if (isValidationErrorLike(err)) {
                  return new InvalidMigrationHistoryLogError(err.message, {
                    cause: err,
                  });
                }

                if (err instanceof FileSystemWriteError) {
                  return toMigrationHistoryLogWriteError(err);
                }

                return err;
              }),
              // update value with new history
              TaskEither.tap(() => {
                value = history;
                return TaskEither.of(void 0);
              })
            ),
          releaseLock: () =>
            pipe(
              // ensure lock has not been released
              isLockReleased,
              TaskEither.fromPredicate(
                (flag) => flag === false,
                () => new ReleaseLockError(`Lock has already been released`)
              ),
              // release lock
              TaskEither.flatMap(() =>
                TaskEither.tryCatch(
                  () => releaseLockAsync(),
                  (err) =>
                    new ReleaseLockError(
                      `Unable to release lock on "${filePath}"`,
                      err instanceof Error ? { cause: err } : undefined
                    )
                )
              ),
              // set flag to true
              TaskEither.tap(() => {
                isLockReleased = true;
                return TaskEither.of(undefined);
              })
            ),
        };
      })
    );
  };
}
