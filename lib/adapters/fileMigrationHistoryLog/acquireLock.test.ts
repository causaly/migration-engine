import * as os from 'node:os';
import * as path from 'node:path';

import * as ArrayFp from 'fp-ts/Array';
import * as Either from 'fp-ts/Either';
import { identity, pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import {
  expectLeftTaskEither,
  expectRightTaskEither,
} from 'jest-fp-ts-matchers';
import { lock } from 'proper-lockfile';

import { AcquireLockError } from '../../errors';
import { History, HistoryEntry } from '../../models';
import { rm } from '../../utils/fs';
import { makeAcquireLock } from './acquireLock';
import { makeInit } from './init';
import type { FileMigrationHistoryLogContext } from './types';

describe('acquireLock()', () => {
  const ctx: FileMigrationHistoryLogContext = {
    filePath: path.join(os.tmpdir(), '/migration-state.json'),
  };

  beforeAll(async () => {
    const init = makeInit(ctx);
    return pipe(
      init(),
      TaskEither.match((err) => {
        throw err;
      }, identity)
    )();
  });

  afterAll(async () => {
    return pipe(
      rm(ctx.filePath, { recursive: true }),
      TaskEither.match((err) => {
        throw err;
      }, identity)
    )();
  });

  it('acquires lock with persistHistory functionality', async () => {
    const acquireLock = makeAcquireLock(ctx);

    return TaskEither.bracketW(
      acquireLock(),
      (lock) => {
        expect(lock).toBeDefined();
        expect(lock.persistHistory).toBeInstanceOf(Function);
        expect(lock.releaseLock).toBeInstanceOf(Function);

        const history = lock.currentValue;
        expect(history).toMatchInlineSnapshot(`
          {
            "entries": [],
          }
        `);

        // amend history
        return pipe(
          HistoryEntry.parse({
            id: '20240101-one',
            checksum: 'f524ee4ad943b8312921906d9ef52b1b',
            executedAt: new Date('2024-01-01T00:00:00.000Z'),
          }),
          Either.map((entry) => History.addEntry(history, entry)),
          TaskEither.fromEither,
          TaskEither.flatMap(lock.persistHistory),
          TaskEither.tap(() => {
            expect(lock.currentValue).toMatchInlineSnapshot(`
              {
                "entries": [
                  {
                    "checksum": "f524ee4ad943b8312921906d9ef52b1b",
                    "executedAt": 2024-01-01T00:00:00.000Z,
                    "id": "20240101-one",
                  },
                ],
              }
            `);
            return TaskEither.of(void 0);
          })
        );
      },
      (lock) => lock.releaseLock()
    )();
  });

  it('throws when history is already locked', async () => {
    const acquireLock = makeAcquireLock(ctx);

    return pipe(
      TaskEither.bracketW(
        TaskEither.tryCatch(
          () => lock(ctx.filePath.toString()),
          Either.toError
        ),
        () => acquireLock(),
        (releaseLockAsync) =>
          TaskEither.tryCatch(() => releaseLockAsync(), Either.toError)
      ),
      expectLeftTaskEither((err) => {
        expect(err).toBeInstanceOf(AcquireLockError);
        expect(err.message).toBe(`Unable to acquire lock on "${ctx.filePath}"`);
      })
    )();
  });

  it('handles race condition with concurrent acquireLock requests', async () => {
    const acquireLock = makeAcquireLock(ctx);

    return pipe(
      [
        pipe(
          acquireLock(),
          // TaskEither.flatMap((lock) => lock.releaseLock()),
          TaskEither.orElseW((err) => TaskEither.of(err))
        ),
        pipe(
          acquireLock(),
          // TaskEither.flatMap((lock) => lock.releaseLock()),
          TaskEither.orElseW((err) => TaskEither.of(err))
        ),
        pipe(
          acquireLock(),
          // TaskEither.flatMap((lock) => lock.releaseLock()),
          TaskEither.orElseW((err) => TaskEither.of(err))
        ),
      ],
      ArrayFp.sequence(TaskEither.ApplicativePar),
      // clear lock for next test
      TaskEither.tap((results) => {
        for (const result of results) {
          if (result instanceof Error === false) {
            return result.releaseLock();
          }
        }

        return TaskEither.of(void 0);
      }),
      expectRightTaskEither((results) => {
        const failedRequests = results.filter((err) => err instanceof Error);

        expect(failedRequests).toHaveLength(2);
        expect(failedRequests[0]).toBeInstanceOf(AcquireLockError);
        expect(failedRequests[1]).toBeInstanceOf(AcquireLockError);
      })
    )();
  });
});
