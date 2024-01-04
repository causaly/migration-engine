import { isValid as isValidDate, parse as parseDate } from 'date-fns';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { toValidationError, ValidationError } from 'zod-validation-error';

export const parseDateInUTC =
  (format: string) =>
  (dateString: string): Either.Either<ValidationError, Date> => {
    return pipe(
      Either.tryCatch(
        () =>
          parseDate(
            dateString + 'Z',
            ensureDateFormatEndsWithTimezone(format),
            new Date()
          ),
        toValidationError()
      ),
      Either.chain(
        Either.fromPredicate(
          isValidDate,
          () => new ValidationError('Invalid date provided')
        )
      )
    );
  };

function ensureDateFormatEndsWithTimezone(format: string): string {
  if (format.endsWith('X')) {
    return format;
  }

  return format + 'X';
}
