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

export class MigrationStateTransitionError extends Error {
  name = 'MigrationStateTransitionError' as const;
}
