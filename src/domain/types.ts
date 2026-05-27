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
  tablesFound: number;
  tablesFailed: number;
  columnsFound: number;
  relationshipsFound: number;
  skipped: string[];
}

export interface SchemaForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface SchemaColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue: string | null;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumnDef[];
  foreignKeys: SchemaForeignKey[];
}

export interface SchemaGraphNode {
  id: string;
  label: string;
  type: string;
  table?: string;
}

export interface SchemaGraphEdge {
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface SchemaGraph {
  nodes: SchemaGraphNode[];
  edges: SchemaGraphEdge[];
}

export interface Schema {
  id: string;
  name: string;
  tables: SchemaTable[];
  coverage: SchemaCoverage;
  createdAt: string;
}

export interface SchemaDetail extends Schema {
  graph: SchemaGraph;
}

export interface SchemaListItem {
  id: string;
  name: string;
  tableCount: number;
  coverage: SchemaCoverage;
  createdAt: string;
}

export interface SchemaListResponse {
  schemas: SchemaListItem[];
}

// ── App ────────────────────────────────────────────────────────────

export interface App {
  id: string;
  userId: string | null;
  installedServerIds: string[];
  createdAt: string;
  expiresAt: string;
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
