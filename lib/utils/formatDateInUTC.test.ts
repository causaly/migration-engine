import { parseISO as parseISODate } from 'date-fns';
import { pipe } from 'fp-ts/lib/function';
import { expectLeftEither, expectRightEither } from 'jest-fp-ts-matchers';
import { ValidationError } from 'zod-validation-error';

import { formatDateInUTC } from './formatDateInUTC';

describe('formatDateInUTC()', () => {
  test('successfully formats the provided date with the provided format', () => {
    pipe(
      parseISODate('2021-01-01T00:00:00.000Z'),
      formatDateInUTC('dd MMM yyyy'),
      expectRightEither((formattedDate) => {
        expect(formattedDate).toBe('01 Jan 2021');
      })
    );
  });

  it('returns error when date is invalid', () => {
    pipe(
      new Date(''),
      formatDateInUTC('yyyy-MM-dd'),
      expectLeftEither((err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toMatchInlineSnapshot(`"Invalid date provided"`);
      })
    );
  });

  it('returns error when format is invalid', () => {
    pipe(
      parseISODate('2021-01-01T00:00:00.000Z'),
      formatDateInUTC('invalid'),
      expectLeftEither((err) => {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toMatchInlineSnapshot(
          `"Format string contains an unescaped latin alphabet character \`n\`"`
        );
      })
    );
  });
});
