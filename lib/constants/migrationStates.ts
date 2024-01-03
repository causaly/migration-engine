import type { ValueOf } from 'type-fest';

export const migrationStates = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
} as const;

export type MigrationState = ValueOf<typeof migrationStates>;
