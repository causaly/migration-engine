import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

export const schema = zod
  .string()
  .min(3)
  .max(100)
  .regex(
    /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/,
    'must contain only alphanumeric characters and hyphens'
  )
  .brand<'MigrationId'>();

export type MigrationId = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, MigrationId> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
