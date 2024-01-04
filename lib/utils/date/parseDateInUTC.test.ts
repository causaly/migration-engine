import { pipe } from 'fp-ts/lib/function';
import { expectLeftEither, expectRightEither } from 'jest-fp-ts-matchers';
import { ValidationError } from 'zod-validation-error';

import { parseDateInUTC } from './parseDateInUTC';

describe('parseDateInUTC()', () => {
  it('parses datestring successfully', () => {
    pipe(
      '1992-05-06',
      parseDateInUTC('yyyy-MM-dd'),
      expectRightEither((date) => {
        expect(date.toISOString()).toBe('1992-05-06T00:00:00.000Z');
      })
    );
  });

  it('returns error when datestring is invalid', () => {
    pipe(
      'invalid',
      parseDateInUTC('yyyy-MM-dd'),
      expectLeftEither((err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toMatchInlineSnapshot(`"Invalid date provided"`);
      })
    );
  });

  it('returns error when format is invalid', () => {
    pipe(
      '1992-05-06',
      parseDateInUTC('invalid'),
      expectLeftEither((err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toMatchInlineSnapshot(
          `"Format string contains an unescaped latin alphabet character \`n\`"`
        );
      })
    );
  });
});
