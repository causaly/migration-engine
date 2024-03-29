import * as Either from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as ReaderTaskEither from 'fp-ts/ReaderTaskEither';
import * as TaskEither from 'fp-ts/TaskEither';
import { kebabCase } from 'lodash/fp';
import { z as zod } from 'zod';
import {
  isValidationErrorLike,
  toValidationError,
  ValidationError,
} from 'zod-validation-error';

import { MigrationRepoReadError, MigrationRepoWriteError } from '../errors';
import { MigrationId } from '../models';
import { MigrationRepo } from '../ports';
import { formatDateInUTC } from '../utils/date';

const DATE_FORMAT_PATTERN = 'yyyyMMddHHmmss';

const schema = zod.object({
  date: zod
    .date()
    .optional()
    .transform((value) => value ?? new Date()),
  description: zod.string().min(2).max(100),
});

export type CreateEmptyMigrationInputProps = zod.infer<typeof schema>;

export function parseCreateEmptyMigrationInputProps(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, CreateEmptyMigrationInputProps> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export type CreateEmptyMigrationDeps = {
  createEmptyMigration: MigrationRepo['createEmptyMigration'];
};

export function createEmptyMigration(
  props: CreateEmptyMigrationInputProps
): ReaderTaskEither.ReaderTaskEither<
  CreateEmptyMigrationDeps,
  MigrationRepoWriteError | MigrationRepoReadError,
  void
> {
  return pipe(
    ReaderTaskEither.ask<CreateEmptyMigrationDeps>(),
    ReaderTaskEither.chainTaskEitherK(({ createEmptyMigration }) => {
      return pipe(
        Either.Do,
        Either.bind('timestamp', () =>
          pipe(props.date, formatDateInUTC(DATE_FORMAT_PATTERN))
        ),
        Either.let('description', () => kebabCase(props.description)),
        Either.map(({ timestamp, description }) =>
          [timestamp, description].join('-')
        ),
        Either.flatMap(MigrationId.parse),
        Either.mapLeft((err) => {
          if (isValidationErrorLike(err)) {
            return new MigrationRepoWriteError(`Invalid migration ID`, {
              cause: err,
            });
          }

          return err;
        }),
        TaskEither.fromEither,
        TaskEither.flatMap(createEmptyMigration)
      );
    })
  );
}
