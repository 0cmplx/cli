import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { Schema, SchemaDetail, SchemaListResponse, SchemaGraph } from '../domain/types.js';

export async function upload(name: string, sql: string): Promise<Schema> {
  const res = await request<{ schema: Schema }>('/api/schemas', {
    method: 'POST',
    body: { name, sql },
  });
  return res.schema;
}

export async function list(): Promise<SchemaListResponse> {
  return request<SchemaListResponse>('/api/schemas');
}

export async function get(id: string): Promise<SchemaDetail> {
  validateId(id, 'schema ID');
  const res = await request<{ schema: SchemaDetail }>(`/api/schemas/${encodeURIComponent(id)}`);
  return res.schema;
}

export async function getGraph(id: string): Promise<SchemaGraph> {
  validateId(id, 'schema ID');
  const res = await request<{ graph: SchemaGraph }>(`/api/schemas/${encodeURIComponent(id)}/graph`);
  return res.graph;
}
