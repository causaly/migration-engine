import * as Either from 'fp-ts/Either';
import * as Json from 'fp-ts/Json';
import { pipe } from 'fp-ts/lib/function';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import * as HistoryLogEntry from './HistoryLogEntry';

export const schema = zod.object({
  entries: zod.array(HistoryLogEntry.schema),
});

export type HistoryLog = zod.infer<typeof schema>;

export function parse(
  value: zod.input<typeof schema>
): Either.Either<ValidationError, HistoryLog> {
  return Either.tryCatch(() => schema.parse(value), toValidationError());
}

export function serialize(
  historyLog: HistoryLog
): Either.Either<ValidationError, string> {
  return pipe(Json.stringify(historyLog), Either.mapLeft(toValidationError()));
}

export function deserialize(
  content: string
): Either.Either<ValidationError, HistoryLog> {
  return pipe(
    Json.parse(content),
    Either.mapLeft(toValidationError()),
    // @ts-expect-error
    Either.flatMap(parse)
  );
}

export function addEntry(
  historyLog: HistoryLog,
  entry: HistoryLogEntry.HistoryLogEntry
): HistoryLog {
  return {
    ...historyLog,
    entries: [...historyLog.entries, entry],
  };
}

export const emptyHistoryLog: HistoryLog = {
  entries: [],
};
