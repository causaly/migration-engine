import { pipe } from 'fp-ts/lib/function';
import { expectRightEither } from 'jest-fp-ts-matchers';

import * as Migration from './Migration';

describe('Migration', () => {
  const mockMigration = {
    id: '20220915145823-test-me-baby',
    up: () => Promise.resolve(),
    down: () => Promise.resolve(),
  };

  describe('parse()', () => {
    test('parses valid migration', () => {
      pipe(
        Migration.parse(mockMigration),
        expectRightEither((migration) => {
          expect(migration).toMatchObject({
            ...mockMigration,
            up: expect.any(Function),
            down: expect.any(Function),
          });
        })
      );
    });

    test('calculates checksum', () => {
      pipe(
        Migration.parse(mockMigration),
        expectRightEither((migration) => {
          expect(migration.checksum).toMatchInlineSnapshot(
            `"c16c279ca10d5a419c4e77c3a8366ebf"`
          );
        })
      );
    });
  });
});
