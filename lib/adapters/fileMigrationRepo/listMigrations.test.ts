import * as path from 'node:path';

import { pipe } from 'fp-ts/lib/function';
import { expectRightTaskEither } from 'jest-fp-ts-matchers';

import { makeListMigrations } from './listMigrations';
import type { FileMigrationRepoContext } from './types';

describe('listMigrations()', () => {
  it('retrieves migrations from disk; in ts format', async () => {
    const ctx: FileMigrationRepoContext = {
      dirPath: path.resolve(__dirname, './mocks/migrations'),
      language: 'typescript',
    };

    const listMigrations = makeListMigrations(ctx);

    return pipe(
      listMigrations(),
      expectRightTaskEither((migrations) => {
        expect(migrations).toHaveLength(2);
        expect(migrations).toMatchInlineSnapshot(`
          [
            {
              "checksum": "f524ee4ad943b8312921906d9ef52b1b",
              "down": [Function],
              "id": "20240101-one",
              "up": [Function],
            },
            {
              "checksum": "8c8878ce2d3db81ed8bfdadfca8f5b6a",
              "down": [Function],
              "id": "20240103-two",
              "up": [Function],
            },
          ]
        `);
      })
    )();
  });
});
