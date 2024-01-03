import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import {
  expectLeftTaskEither,
  expectRightTaskEither,
} from 'jest-fp-ts-matchers';

import { MigrationRepoInitError } from '../../errors';
import { makeInit } from './init';
import type { FileMigrationRepoContext } from './types';

describe('init()', () => {
  it('initializes migration repository on disk', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.join(os.tmpdir(), '/migrations-test-dir'),
      language: 'typescript',
    };

    return TaskEither.bracket(
      pipe(
        TaskEither.Do,
        TaskEither.bind('initRes', makeInit(ctx)),
        TaskEither.bind('stats', () =>
          TaskEither.fromTask(() => stat(ctx.dirPath))
        ),
        expectRightTaskEither(({ initRes, stats }) => {
          expect(initRes).toBeUndefined();
          expect(stats.isDirectory()).toBe(true);
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => TaskEither.fromTask(() => rm(ctx.dirPath, { recursive: true }))
    )();
  });

  it('handles when migration repository already exists', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.join(os.tmpdir(), '/migrations-test-dir'),
      language: 'typescript',
    };

    return TaskEither.bracket(
      pipe(
        TaskEither.fromTask(() => mkdir(ctx.dirPath, { recursive: true })),
        TaskEither.bind('initRes', makeInit(ctx)),
        TaskEither.bind('stats', () =>
          TaskEither.fromTask(() => stat(ctx.dirPath))
        ),
        expectRightTaskEither(({ initRes, stats }) => {
          expect(initRes).toBeUndefined();
          expect(stats.isDirectory()).toBe(true);
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => TaskEither.fromTask(() => rm(ctx.dirPath, { recursive: true }))
    )();
  });

  it('throws when migration repository dirPath is pointing to a file', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.join(os.tmpdir(), '/migrations-test-dir'),
      language: 'typescript',
    };

    return TaskEither.bracket(
      pipe(
        TaskEither.fromTask(() =>
          writeFile(ctx.dirPath, '', {
            encoding: 'utf8',
          })
        ),
        TaskEither.flatMap(makeInit(ctx)),
        expectLeftTaskEither((err) => {
          expect(err).toBeInstanceOf(MigrationRepoInitError);
          expect(err.message).toMatch(/Invalid migration directory path/);
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => TaskEither.fromTask(() => rm(ctx.dirPath, { recursive: true }))
    )();
  });
});
