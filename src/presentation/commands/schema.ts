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
      console.log(`  ${W}${result.name}${R}  ${DIM}${result.id}${R}`);
      console.log(`  ${DIM}Coverage${R}  ${coverageBar(result.coverage.tablesFound, result.coverage.tablesFailed)}`);
      console.log('');

      printTable(
        [
          { key: 'table', label: 'Table' },
          { key: 'columns', label: 'Columns', align: 'right' as const },
          { key: 'relations', label: 'Relations', align: 'right' as const },
        ],
        result.tables.map((t) => ({
          table: t.name,
          columns: t.columns.length,
          relations: t.foreignKeys.length || '-',
        })),
      );

      if (result.coverage.skipped.length > 0) {
        console.log('');
        console.log(`  ${DIM}Skipped: ${result.coverage.skipped.join(', ')}${R}`);
      }

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
          { key: 'tables', label: 'Tables', align: 'right' as const },
          { key: 'coverage', label: 'Coverage' },
        ],
        result.schemas.map((s) => ({
          id: shortId(s.id),
          name: s.name,
          tables: s.tableCount,
          coverage: coverageBar(s.coverage.tablesFound, s.coverage.tablesFailed),
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
      console.log('');
      console.log(`  ${W}${result.name}${R}  ${DIM}${result.id}${R}`);
      console.log(`  ${DIM}Coverage${R}  ${coverageBar(result.coverage.tablesFound, result.coverage.tablesFailed)}`);
      console.log('');

      for (const table of result.tables) {
        console.log(`  ${W}${table.name}${R}`);
        for (const col of table.columns) {
          const nullable = col.nullable ? `${DIM}nullable${R}` : '';
          console.log(`    ${GREY}${col.name}${R}  ${DIM}${col.type}${R}  ${nullable}`);
        }
        console.log('');
      }

      const fks = result.tables.flatMap((t) =>
        t.foreignKeys.map((fk) => ({ from: `${t.name}.${fk.column}`, to: `${fk.referencesTable}.${fk.referencesColumn}` }))
      );
      if (fks.length > 0) {
        heading('Relationships');
        for (const fk of fks) {
          console.log(`  ${fk.from} ${CYAN}${ARROW}${R} ${fk.to}`);
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
      const refs = result.edges.filter((e) => e.type === 'references');
      for (const ref of refs) {
        console.log(`  ${W}${ref.source}${R} ${CYAN}${ARROW}${R} ${W}${ref.target}${R}`);
      }

      const tableNodes = result.nodes.filter((n) => n.type === 'table');
      const connected = new Set([
        ...refs.map((e) => e.source.split('.')[0]),
        ...refs.map((e) => e.target.split('.')[0]),
      ]);
      const orphans = tableNodes.filter((n) => !connected.has(n.id));
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
