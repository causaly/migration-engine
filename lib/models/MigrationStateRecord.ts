import * as HistoryLogEntry from './HistoryLogEntry';
import * as Migration from './Migration';

export type MigrationStateRecord = Migration.Migration & {
  status: 'EXECUTED' | 'PENDING';
  executedAt: HistoryLogEntry.HistoryLogEntry['executedAt'] | null;
};
