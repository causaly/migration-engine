import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

export const schema = zod
  .function()
  .returns(zod.promise(zod.void()))
  .brand<'MigrateFunc'>();

export type MigrateFunc = zod.infer<typeof schema>;

export function toString(func: MigrateFunc) {
  return func.toString();
}

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, MigrateFunc> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
