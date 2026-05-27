import { publicRequest } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';

interface SampleSchema {
  name: string;
  description: string;
  tables: number;
  rows: number;
}

interface TryResult {
  schema: {
    tables: { name: string; columns: { name: string; type: string }[]; foreignKeys: { column: string; referencesTable: string; referencesColumn: string }[] }[];
    graph: { nodes: { id: string; label: string; type: string }[]; edges: { source: string; target: string; label: string; type: string }[] };
    coverage: { tablesFound: number; tablesFailed: number; columnsFound: number; relationshipsFound: number; skipped: string[] };
  };
  sample: SampleSchema;
}

export async function list(): Promise<{ samples: SampleSchema[] }> {
  return publicRequest<{ samples: SampleSchema[] }>('/api/samples');
}

export async function trySample(name: string): Promise<TryResult> {
  validateId(name, 'sample name');
  return publicRequest<TryResult>(`/api/samples/${encodeURIComponent(name)}/try`, { method: 'POST' });
}
