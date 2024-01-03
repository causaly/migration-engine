import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import { migrationTypes } from '../constants/migrationTypes';

export const schema = zod.nativeEnum(migrationTypes);

export type MigrationType = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, MigrationType> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
