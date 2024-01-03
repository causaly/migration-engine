import { pipe } from 'fp-ts/lib/function';
import { expectLeftEither, expectRightEither } from 'jest-fp-ts-matchers';
import { ValidationError } from 'zod-validation-error';

import * as MigrationId from './MigrationId';

describe('MigrationId', () => {
  describe('parse()', () => {
    test('parses valid migration ID', () => {
      pipe(
        MigrationId.parse('20220915145823-test-me-baby'),
        expectRightEither((migrationId) => {
          expect(migrationId).toBe('20220915145823-test-me-baby');
        })
      );
    });

    test('throws when migration ID contains spaces', () => {
      pipe(
        MigrationId.parse('20220915145823 test-me-baby'),
        expectLeftEither((err) => {
          expect(err).toBeInstanceOf(ValidationError);
          expect(err.message).toMatchInlineSnapshot(
            `"Validation error: must contain only alphanumeric characters and hyphens"`
          );
        })
      );
    });
  });
});
