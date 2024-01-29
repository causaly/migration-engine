import * as Either from 'fp-ts/Either';
import * as Json from 'fp-ts/Json';
import { pipe } from 'fp-ts/lib/function';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import { MigrationNotFoundError } from '../errors';
import * as HistoryRecord from './HistoryRecord';
import * as MigrationId from './MigrationId';

export const schema = zod.object({
  records: zod.array(HistoryRecord.schema),
});

export type History = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, History> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export function serialize(
  history: History
): Either.Either<ValidationError, string> {
  return pipe(Json.stringify(history), Either.mapLeft(toValidationError()));
}

export function deserialize(
  strValue: string
): Either.Either<ValidationError, History> {
  return pipe(
    Json.parse(strValue),
    Either.mapLeft(toValidationError()),
    // @ts-expect-error
    Either.flatMap(parse)
  );
}

export function appendRecord(
  history: History,
  record: HistoryRecord.HistoryRecord
): History {
  return {
    ...history,
    records: [...history.records, record],
  };
}

export function deleteRecordById(
  history: History,
  id: MigrationId.MigrationId
): Either.Either<MigrationNotFoundError, History> {
  const index = history.records.findIndex((record) => record.id === id);

  // ensure the record exists
  if (index === -1) {
    return Either.left(
      new MigrationNotFoundError(
        `History record not found; id "${id}" does not exist`
      )
    );
  }

  const newEntries = [
    ...history.records.slice(0, index),
    ...history.records.slice(index + 1),
  ];

  return Either.of({
    ...history,
    records: newEntries,
  });
}

export const emptyHistoryLog: History = {
  records: [],
};
