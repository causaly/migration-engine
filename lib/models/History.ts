import * as Either from 'fp-ts/Either';
import * as Json from 'fp-ts/Json';
import { pipe } from 'fp-ts/lib/function';
import { z as zod } from 'zod';
import { toValidationError, ValidationError } from 'zod-validation-error';

import * as HistoryLogEntry from './HistoryEntry';

export const schema = zod.object({
  entries: zod.array(HistoryLogEntry.schema),
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
  content: string
): Either.Either<ValidationError, History> {
  return pipe(
    Json.parse(content),
    Either.mapLeft(toValidationError()),
    // @ts-expect-error
    Either.flatMap(parse)
  );
}

export function addEntry(
  history: History,
  entry: HistoryLogEntry.HistoryEntry
): History {
  return {
    ...history,
    entries: [...history.entries, entry],
  };
}

export const emptyHistoryLog: History = {
  entries: [],
};
