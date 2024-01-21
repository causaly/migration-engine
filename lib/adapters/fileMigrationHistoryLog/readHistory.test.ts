import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import {
  expectLeftTaskEither,
  expectRightTaskEither,
} from 'jest-fp-ts-matchers';

import { InvalidMigrationHistoryLogError } from '../../errors';
import { makeReadHistory } from './readHistory';
import type { FileMigrationHistoryLogContext } from './types';

describe('readHistory()', () => {
  it('retrieves history log from disk', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.resolve(__dirname, './mock/history-log.json'),
    };

    const readHistory = makeReadHistory(ctx);

    return pipe(
      readHistory(),
      expectRightTaskEither((history) => {
        expect(history.entries).toHaveLength(2);
        expect(history).toMatchInlineSnapshot(`
          {
            "entries": [
              {
                "checksum": "f524ee4ad943b8312921906d9ef52b1b",
                "executedAt": 2024-01-01T00:00:00.000Z,
                "id": "20240101-one",
              },
              {
                "checksum": "8c8878ce2d3db81ed8bfdadfca8f5b6a",
                "executedAt": 2024-01-03T09:54:32.000Z,
                "id": "20240103-two",
              },
            ],
          }
        `);
      })
    )();
  });

  it('throws when migration history-log file contains invalid contents', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.resolve(__dirname, './mock/invalid-history-log-1.json'),
    };

    const readHistory = makeReadHistory(ctx);

    return pipe(
      readHistory(),
      expectLeftTaskEither((err) => {
        expect(err).toBeInstanceOf(InvalidMigrationHistoryLogError);
        expect(err.message).toMatchInlineSnapshot(
          `"invalid migration history-log file"`
        );
      })
    )();
  });

  it('throws when migration history-log file is missing attributes', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.resolve(__dirname, './mock/invalid-history-log-2.json'),
    };

    const readHistory = makeReadHistory(ctx);

    return pipe(
      readHistory(),
      expectLeftTaskEither((err) => {
        expect(err).toBeInstanceOf(InvalidMigrationHistoryLogError);
        expect(err.message).toMatchInlineSnapshot(
          `"invalid migration history-log file"`
        );
      })
    )();
  });
});
