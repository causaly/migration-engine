import * as os from 'node:os';
import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import {
  expectLeftTaskEither,
  expectRightTaskEither,
} from 'jest-fp-ts-matchers';

import { MigrationHistoryLogWriteError } from '../../errors';
import { mkdir, rm, stat, writeFile } from '../../utils/fs';
import { makeInit } from './init';
import type { FileMigrationHistoryLogContext } from './types';

describe('init()', () => {
  it('initializes migration history-log on disk', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.join(os.tmpdir(), '/migration-state.json'),
    };

    return TaskEither.bracket(
      pipe(
        TaskEither.Do,
        TaskEither.bind('response', makeInit(ctx)),
        TaskEither.bindW('stats', () => stat(ctx.filePath)),
        expectRightTaskEither(({ response, stats }) => {
          expect(response).toBeUndefined();
          expect(stats.isFile()).toBe(true);
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => rm(ctx.filePath, { recursive: true })
    )();
  });

  it('handles when migration history-log already exists', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.join(os.tmpdir(), '/migration-state.json'),
    };

    return TaskEither.bracket(
      pipe(
        writeFile(ctx.filePath, JSON.stringify([], null, 2)),
        TaskEither.bindW('response', makeInit(ctx)),
        TaskEither.bindW('stats', () => stat(ctx.filePath)),
        expectRightTaskEither(({ response, stats }) => {
          expect(response).toBeUndefined();
          expect(stats.isFile()).toBe(true);
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => rm(ctx.filePath, { recursive: true })
    )();
  });

  it('throws when migration history-log filePath is pointing to a directory', async () => {
    const ctx: FileMigrationHistoryLogContext = {
      filePath: path.join(os.tmpdir(), '/test-dir'),
    };

    return TaskEither.bracket(
      pipe(
        mkdir(ctx.filePath, { recursive: true }),
        TaskEither.flatMap(makeInit(ctx)),
        expectLeftTaskEither((err) => {
          expect(err).toBeInstanceOf(MigrationHistoryLogWriteError);
          expect(err.message).toMatch(
            /unable to initialize migration history-log/i
          );
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => rm(ctx.filePath, { recursive: true })
    )();
  });
});
