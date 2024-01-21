import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import * as Checksum from './Checksum';
import * as MigrationId from './MigrationId';

export const schema = zod
  .object({
    id: MigrationId.schema,
    executedAt: zod.coerce.date(),
    checksum: Checksum.schema,
  })
  .brand<'HistoryEntry'>();

export type HistoryEntry = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, HistoryEntry> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
