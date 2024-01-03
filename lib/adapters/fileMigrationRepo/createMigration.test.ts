import { readdir, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import * as TaskEither from 'fp-ts/TaskEither';
import { expectRightTaskEither } from 'jest-fp-ts-matchers';

import { MigrationId } from '../../models';
import { makeCreateMigration } from './createMigration';
import { makeInit } from './init';
import type { FileMigrationRepoContext } from './types';

describe('createMigration()', () => {
  it('creates migration on disk; in ts format', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.join(os.tmpdir(), '/migrations-test-dir'),
      language: 'typescript',
    };

    const migrationIdStr = '20240103-foobar';

    return TaskEither.bracket(
      pipe(
        TaskEither.Do,
        TaskEither.apS(
          'migrationId',
          pipe(MigrationId.parse(migrationIdStr), TaskEither.fromEither)
        ),
        TaskEither.bindW('initRes', makeInit(ctx)),
        TaskEither.bindW('createMigrationRes', ({ migrationId }) =>
          pipe(migrationId, makeCreateMigration(ctx))
        ),
        TaskEither.bindW('dirents', () =>
          TaskEither.fromTask(() =>
            readdir(ctx.dirPath, {
              encoding: 'utf8',
              recursive: true,
              withFileTypes: true,
            })
          )
        ),
        expectRightTaskEither(({ createMigrationRes, dirents }) => {
          expect(createMigrationRes).toBeUndefined();
          expect(dirents).toHaveLength(3);
          expect(dirents).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: migrationIdStr,
                path: ctx.dirPath,
              }),
              expect.objectContaining({
                name: 'down.ts',
                path: path.join(ctx.dirPath, migrationIdStr),
              }),
              expect.objectContaining({
                name: 'up.ts',
                path: path.join(ctx.dirPath, migrationIdStr),
              }),
            ])
          );
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => TaskEither.fromTask(() => rm(ctx.dirPath, { recursive: true }))
    )();
  });

  it('creates migration on disk; in js format', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.join(os.tmpdir(), '/migrations-test-dir'),
      language: 'javascript',
    };

    const migrationIdStr = '20240103-foobar';

    return TaskEither.bracket(
      pipe(
        TaskEither.Do,
        TaskEither.apS(
          'migrationId',
          pipe(MigrationId.parse(migrationIdStr), TaskEither.fromEither)
        ),
        TaskEither.bindW('initRes', makeInit(ctx)),
        TaskEither.bindW('createMigrationRes', ({ migrationId }) =>
          pipe(migrationId, makeCreateMigration(ctx))
        ),
        TaskEither.bindW('dirents', () =>
          TaskEither.fromTask(() =>
            readdir(ctx.dirPath, {
              encoding: 'utf8',
              recursive: true,
              withFileTypes: true,
            })
          )
        ),
        expectRightTaskEither(({ createMigrationRes, dirents }) => {
          expect(createMigrationRes).toBeUndefined();
          expect(dirents).toHaveLength(3);
          expect(dirents).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: migrationIdStr,
                path: ctx.dirPath,
              }),
              expect.objectContaining({
                name: 'down.js',
                path: path.join(ctx.dirPath, migrationIdStr),
              }),
              expect.objectContaining({
                name: 'up.js',
                path: path.join(ctx.dirPath, migrationIdStr),
              }),
            ])
          );
        }),
        TaskEither.fromTask
      ),
      (resource) => TaskEither.right(resource),
      () => TaskEither.fromTask(() => rm(ctx.dirPath, { recursive: true }))
    )();
  });
});
