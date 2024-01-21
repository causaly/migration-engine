export class MigrationRepoReadError extends Error {
  name = 'MigrationRepoReadError' as const;
}

export class MigrationRepoWriteError extends Error {
  name = 'MigrationRepoWriteError' as const;
}

export class MigrationRepoNotFoundError extends Error {
  name = 'MigrationRepoNotFoundError' as const;
}

export class MigrationNotFoundError extends Error {
  name = 'MigrationNotFoundError' as const;
}

export class MigrationHistoryLogNotFoundError extends Error {
  name = 'MigrationHistoryLogNotFoundError' as const;
}

export class MigrationHistoryLogWriteError extends Error {
  name = 'MigrationHistoryLogWriteError' as const;
}

export class MigrationHistoryLogReadError extends Error {
  name = 'MigrationHistoryLogReadError' as const;
}

export class InvalidMigrationHistoryLogError extends Error {
  name = 'InvalidMigrationHistoryLogError' as const;
}

export class AcquireLockError extends Error {
  name = 'AcquireLockError' as const;
}

export class ReleaseLockError extends Error {
  name = 'ReleaseLockError' as const;
}

export class InvalidMigrationStateError extends Error {
  name = 'InvalidMigrationStateError' as const;
}

export class MigrationRuntimeError extends Error {
  name = 'MigrationRuntimeError' as const;
}
