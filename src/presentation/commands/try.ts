import * as SamplesService from '../../application/samples.js';
import { printTable } from '../ui/table.js';
import { coverageBar } from '../ui/format.js';
import { W, R, DIM, CYAN, ARROW } from '../ui/ansi.js';
import { runCommand } from './base.js';
import { CLI_BIN } from '../../domain/constants.js';
import type { Command } from '../../router.js';

type Flags = Record<string, string | string[] | boolean>;

async function trySample(args: string[], flags: Flags): Promise<void> {
  const name = args[0];

  if (!name) {
    await runCommand({
      spinner: 'Fetching samples',
      action: () => SamplesService.list(),
      onSuccess: (result) => {
        console.log('');
        printTable(
          [
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
            { key: 'tables', label: 'Tables', align: 'right' as const },
            { key: 'rows', label: 'Rows', align: 'right' as const },
          ],
          result.samples.map((s) => ({ ...s })),
        );
        console.log('');
        console.log(`  ${DIM}Try one: ${CLI_BIN} try banking${R}`);
        console.log('');
      },
      flags,
    });
    return;
  }

  await runCommand({
    spinner: `Loading ${name} sample`,
    action: () => SamplesService.trySample(name),
    onSuccess: ({ schema, sample }) => {
      console.log('');
      console.log(`  ${W}${sample.name}${R}  ${DIM}${sample.description}${R}`);
      console.log('');
      console.log(`  ${DIM}Coverage${R}  ${coverageBar(schema.coverage.tablesFound, schema.coverage.tablesFailed)}`);
      console.log('');

      printTable(
        [
          { key: 'table', label: 'Table' },
          { key: 'columns', label: 'Columns', align: 'right' as const },
          { key: 'relations', label: 'Relations', align: 'right' as const },
        ],
        schema.tables.map((t) => ({
          table: t.name,
          columns: t.columns.length,
          relations: t.foreignKeys.length || '-',
        })),
      );

      const refs = schema.graph.edges.filter((e) => e.type === 'references');
      if (refs.length > 0) {
        console.log('');
        console.log(`  ${W}Relationships${R}`);
        for (const ref of refs) {
          console.log(`  ${CYAN}${ARROW}${R} ${ref.source} ${DIM}${ARROW}${R} ${ref.target}`);
        }
      }

      console.log('');
      console.log(`  ${DIM}Next steps${R}`);
      console.log(`    ${DIM}${CLI_BIN} app create${R}              ${DIM}Create an app to start testing${R}`);
      console.log(`    ${DIM}${CLI_BIN} schema upload file.sql${R}   ${DIM}Upload your own schema${R}`);
      console.log('');
    },
    flags,
  });
}

export const tryCommand: Command = {
  name: 'try',
  description: 'Try a sample database',
  usage: `${CLI_BIN} try [banking|ecommerce|healthcare]`,
  run: trySample,
};
