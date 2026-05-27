import { request } from '../infrastructure/api.js';
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
  return request<SchemaDetail>(`/api/schemas/${id}`);
}

export async function getGraph(id: string): Promise<SchemaGraph> {
  return request<SchemaGraph>(`/api/schemas/${id}/graph`);
}
