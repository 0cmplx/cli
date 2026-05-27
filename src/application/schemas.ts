import { request } from '../infrastructure/api.js';
import { validateId } from '../domain/validation.js';
import type { Schema, SchemaDetail, SchemaListResponse, SchemaGraph } from '../domain/types.js';

export async function upload(name: string, sql: string): Promise<Schema> {
  return request<Schema>('/api/schemas', {
    method: 'POST',
    body: { name, sql },
  });
}

export async function list(): Promise<SchemaListResponse> {
  return request<SchemaListResponse>('/api/schemas');
}

export async function get(id: string): Promise<SchemaDetail> {
  validateId(id, 'schema ID');
  return request<SchemaDetail>(`/api/schemas/${encodeURIComponent(id)}`);
}

export async function getGraph(id: string): Promise<SchemaGraph> {
  validateId(id, 'schema ID');
  return request<SchemaGraph>(`/api/schemas/${encodeURIComponent(id)}/graph`);
}
