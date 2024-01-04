import {
  addMinutes,
  format as formatDate,
  isValid as isValidDate,
  toDate,
} from 'date-fns';
import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/function';
import { toValidationError, ValidationError } from 'zod-validation-error';

export const formatDateInUTC =
  (format: string) =>
  (date: Date | number): Either.Either<ValidationError, string> => {
    return pipe(
      date,
      Either.fromPredicate(
        isValidDate,
        () => new ValidationError('Invalid date provided')
      ),
      Either.map(toDate),
      Either.chain((actualDate) => {
        const nextDate = addMinutes(actualDate, actualDate.getTimezoneOffset());
        return Either.tryCatch(
          () => formatDate(nextDate, format),
          toValidationError()
        );
      })
    );
  };
