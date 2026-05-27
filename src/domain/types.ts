// ── Auth ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  login: string;
  tier: string;
}

export interface AuthVerification {
  user: AuthUser;
  scopes: string[];
}

export interface Credentials {
  token: string;
  login: string;
  tier: string;
  scopes: string[];
  savedAt: string;
}

// ── Schema ─────────────────────────────────────────────────────────

export interface SchemaCoverage {
  found: number;
  failed: number;
}

export interface SchemaColumn {
  table: string;
  name: string;
  type: string;
  nullable: boolean;
}

export interface SchemaRelationship {
  from: string;
  to: string;
  type: string;
}

export interface SchemaGraphNode {
  id: string;
  label: string;
}

export interface SchemaGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface SchemaGraph {
  nodes: SchemaGraphNode[];
  edges: SchemaGraphEdge[];
}

export interface Schema {
  id: string;
  name: string;
  tables: number;
  coverage: SchemaCoverage;
}

export interface SchemaDetail extends Schema {
  columns: SchemaColumn[];
  relationships: SchemaRelationship[];
}

export interface SchemaListResponse {
  schemas: Schema[];
}

// ── App ────────────────────────────────────────────────────────────

export interface App {
  id: string;
  name?: string;
  schemaId?: string;
  servers: string[];
  createdAt: string;
}

// ── Server ─────────────────────────────────────────────────────────

export interface ServerTool {
  name: string;
  description: string;
}

export interface Server {
  id: string;
  name: string;
  description: string;
  category: string;
  tools: ServerTool[];
}

export interface ServerListResponse {
  servers: Server[];
}

// ── Log ────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  type: string;
  tool: string;
  status: string;
  duration: number;
  createdAt: string;
  request?: unknown;
  response?: unknown;
}

export interface LogsResponse {
  logs: LogEntry[];
}

// ── Context ────────────────────────────────────────────────────────

export interface ResolvedContext {
  app: string | null;
  schema: string | null;
  source: 'flag' | 'project' | 'global' | null;
}
