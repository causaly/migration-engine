import * as crypto from 'node:crypto';

import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

export const schema = zod
  .string()
  .regex(/^[0-9a-f]*$/, 'Invalid checksum')
  .length(32)
  .brand<'Checksum'>();

export type Checksum = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, Checksum> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export function fromPayload(payload: string): Checksum {
  return crypto
    .createHash('md5')
    .update(payload)
    .digest()
    .toString('hex') as Checksum;
}
