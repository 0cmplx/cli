import {
  resolveContext,
  saveGlobalContext,
  loadGlobalContext,
  initProjectContext,
  findProjectContext,
} from '../../infrastructure/context.js';
import { ok, fail, heading, W, R, DIM, GREY, GREEN, CYAN } from '../ui/ansi.js';
import type { Command } from '../../router.js';

async function init(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const app = typeof flags.app === 'string' ? flags.app : undefined;
  const schema = typeof flags.schema === 'string' ? flags.schema : undefined;

  initProjectContext(app, schema);
  ok('Created .0cmplx/context.json');

  if (app) console.log(`  ${DIM}App:    ${R}${app}`);
  if (schema) console.log(`  ${DIM}Schema: ${R}${schema}`);
  console.log('');
}

async function use(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const app = typeof flags.app === 'string' ? flags.app : null;
  const schema = typeof flags.schema === 'string' ? flags.schema : null;

  if (!app && !schema) {
    fail('Usage: 0cmplx context use --app <id> [--schema <id>]');
    process.exit(2);
  }

  if (app) {
    saveGlobalContext('activeApp', app);
    ok(`Active app set to ${app}`);
  }
  if (schema) {
    saveGlobalContext('activeSchema', schema);
    ok(`Active schema set to ${schema}`);
  }
}

async function show(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const ctx = resolveContext(flags);

  if (flags.json) {
    console.log(JSON.stringify(ctx, null, 2));
    return;
  }

  heading('Context');

  const sourceLabel = ctx.source
    ? `${DIM}(${ctx.source})${R}`
    : `${DIM}(none)${R}`;

  console.log(`  ${DIM}Source:${R}  ${sourceLabel}`);
  console.log(`  ${DIM}App:${R}    ${ctx.app ? `${W}${ctx.app}${R}` : `${GREY}not set${R}`}`);
  console.log(`  ${DIM}Schema:${R} ${ctx.schema ? `${W}${ctx.schema}${R}` : `${GREY}not set${R}`}`);
  console.log('');

  // Show layers
  const project = findProjectContext();
  const global = loadGlobalContext();

  console.log(`  ${DIM}Layers:${R}`);
  console.log(`    ${CYAN}flag${R}     ${DIM}--app / --schema flags${R}`);
  console.log(`    ${CYAN}project${R}  ${project ? `${GREEN}.0cmplx/context.json${R}` : `${GREY}not found${R}`}`);
  console.log(`    ${CYAN}global${R}   ${global.activeApp || global.activeSchema ? `${GREEN}~/.0cmplx/context.json${R}` : `${GREY}not set${R}`}`);
  console.log('');
}

export const contextCommands: Command = {
  name: 'context',
  description: 'Manage app and schema context',
  usage: '0cmplx context <init|use|show>',
  subcommands: [
    { name: 'init', description: 'Create project context file', run: init },
    { name: 'use', description: 'Set global active app/schema', run: use },
    { name: 'show', description: 'Show resolved context', run: show },
  ],
  run: async (args, flags) => show(args, flags),
};
