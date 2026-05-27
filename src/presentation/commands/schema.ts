import { readFileSync } from 'fs';
import * as SchemaService from '../../application/schemas.js';
import { printTable } from '../ui/table.js';
import { coverageBar, shortId } from '../ui/format.js';
import { fail, heading, W, R, DIM, GREY, CYAN, ARROW } from '../ui/ansi.js';
import { runCommand, requireArg } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';
import type { Schema, SchemaDetail, SchemaListResponse, SchemaGraph } from '../../domain/types.js';

async function upload(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const file = requireArg(args, 0, `${CLI_BIN} schema upload <file.sql> [--name <name>]`);

  let sql: string;
  try {
    sql = readFileSync(file, 'utf-8');
  } catch {
    fail(`Could not read file: ${file}`);
    process.exit(1);
  }

  const name = typeof flags.name === 'string'
    ? flags.name
    : file.replace(/\.[^.]+$/, '').replace(/.*\//, '');

  await runCommand<Schema>({
    spinner: 'Uploading schema',
    action: () => SchemaService.upload(name, sql),
    onSuccess: (result) => {
      console.log('');
      printTable(
        [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'tables', label: 'Tables', align: 'right' },
          { key: 'coverage', label: 'Coverage' },
        ],
        [{
          id: shortId(result.id),
          name: result.name,
          tables: result.tables,
          coverage: coverageBar(result.coverage.found, result.coverage.failed),
        }],
      );
      console.log('');
      console.log(`  ${DIM}Next: ${CLI_BIN} schema show ${shortId(result.id)}${R}`);
      console.log(`  ${DIM}      ${CLI_BIN} schema graph ${shortId(result.id)}${R}`);
      console.log('');
    },
    flags,
  });
}

async function list(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  await runCommand<SchemaListResponse>({
    spinner: 'Fetching schemas',
    action: () => SchemaService.list(),
    onSuccess: (result) => {
      console.log('');
      printTable(
        [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'tables', label: 'Tables', align: 'right' },
          { key: 'coverage', label: 'Coverage' },
        ],
        result.schemas.map((s) => ({
          id: shortId(s.id),
          name: s.name,
          tables: s.tables,
          coverage: coverageBar(s.coverage.found, s.coverage.failed),
        })),
      );
      console.log('');
    },
    flags,
  });
}

async function show(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = requireArg(args, 0, `${CLI_BIN} schema show <id>`);

  await runCommand<SchemaDetail>({
    spinner: 'Fetching schema',
    action: () => SchemaService.get(id),
    onSuccess: (result) => {
      heading('Tables');

      // Group columns by table
      const tables = new Map<string, typeof result.columns>();
      for (const col of result.columns) {
        const existing = tables.get(col.table) ?? [];
        existing.push(col);
        tables.set(col.table, existing);
      }

      for (const [table, cols] of tables) {
        console.log(`  ${W}${table}${R}`);
        for (const col of cols) {
          const nullable = col.nullable ? `${DIM}nullable${R}` : '';
          console.log(`    ${GREY}${col.name}${R}  ${DIM}${col.type}${R}  ${nullable}`);
        }
        console.log('');
      }

      if (result.relationships.length > 0) {
        heading('Relationships');
        for (const rel of result.relationships) {
          console.log(`  ${rel.from} ${CYAN}${ARROW}${R} ${rel.to}  ${DIM}${rel.type}${R}`);
        }
        console.log('');
      }
    },
    flags,
  });
}

async function graph(
  args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const id = requireArg(args, 0, `${CLI_BIN} schema graph <id>`);

  await runCommand<SchemaGraph>({
    spinner: 'Building graph',
    action: () => SchemaService.getGraph(id),
    onSuccess: (result) => {
      console.log('');
      for (const edge of result.edges) {
        const from = result.nodes.find((n) => n.id === edge.from)?.label ?? edge.from;
        const to = result.nodes.find((n) => n.id === edge.to)?.label ?? edge.to;
        console.log(`  ${W}${from}${R} ${CYAN}--${edge.label}-->${R} ${W}${to}${R}`);
      }

      // Show orphan nodes (no edges)
      const connected = new Set([
        ...result.edges.map((e) => e.from),
        ...result.edges.map((e) => e.to),
      ]);
      const orphans = result.nodes.filter((n) => !connected.has(n.id));
      if (orphans.length > 0) {
        console.log('');
        console.log(`  ${DIM}Unconnected:${R}`);
        for (const node of orphans) {
          console.log(`  ${GREY}${node.label}${R}`);
        }
      }
      console.log('');
    },
    flags,
  });
}

export const schemaCommands: Command = {
  name: 'schema',
  description: 'Manage database schemas',
  usage: `${CLI_BIN} schema <upload|list|show|graph>`,
  subcommands: [
    { name: 'upload', description: 'Upload a SQL schema', run: upload },
    { name: 'list', description: 'List all schemas', run: list },
    { name: 'show', description: 'Show schema details', run: show },
    { name: 'graph', description: 'Show relationship graph', run: graph },
  ],
  run: async (_args, flags) => list([], flags),
};
