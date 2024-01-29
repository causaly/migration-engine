import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import * as Checksum from './Checksum';
import * as MigrationId from './MigrationId';

export const baseSchema = zod.object({
  id: MigrationId.schema,
  executedAt: zod.coerce.date(),
  checksum: Checksum.schema,
});

export const schema = baseSchema.brand<'HistoryRecord'>();

export type HistoryRecord = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, HistoryRecord> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
