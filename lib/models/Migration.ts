import * as Either from 'fp-ts/Either';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import * as Checksum from './Checksum';
import * as MigrateFunc from './MigrateFunc';
import * as MigrationId from './MigrationId';

export const baseSchema = zod.object({
  id: MigrationId.schema,
  up: MigrateFunc.schema,
  down: MigrateFunc.schema,
});

export const schema = baseSchema
  .transform((migration) => {
    return {
      ...migration,
      checksum: Checksum.fromPayload(
        [
          migration.id,
          MigrateFunc.toString(migration.up),
          MigrateFunc.toString(migration.down),
        ].join('\n')
      ),
    };
  })
  .brand<'Migration'>();

export type Migration = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, Migration> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}
