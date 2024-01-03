export class MigrationRepoInitError extends Error {
  name = 'MigrationRepoInitError' as const;
}

export class MigrationRepoReadError extends Error {
  name = 'MigrationRepoReadError' as const;
}

export class MigrationRepoWriteError extends Error {
  name = 'MigrationRepoWriteError' as const;
}

export class MigrationRepoNotFoundError extends Error {
  name = 'MigrationRepoNotFoundError' as const;
}

export class MigrationTemplateNotFoundError extends Error {
  name = 'MigrationTemplateNotFoundError' as const;
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

export class InvalidMigrationState extends Error {
  name = 'InvalidMigrationState' as const;
}
