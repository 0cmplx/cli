import {
  resolveContext,
  saveGlobalContext,
  loadGlobalContext,
  initProjectContext,
  findProjectContext,
} from '../../infrastructure/context.js';
import { ok, fail, heading, W, R, DIM, GREY, GREEN, CYAN } from '../ui/ansi.js';
import { getFlag } from './base.js';
import { CLI_BIN, CONFIG_DIR_NAME, CONTEXT_FILE } from '../../domain/constants.js';
import type { Command } from '../../router.js';

async function init(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const app = getFlag(flags, 'app');
  const schema = getFlag(flags, 'schema');

  initProjectContext(app, schema);
  ok(`Created ${CONFIG_DIR_NAME}/${CONTEXT_FILE}`);

  if (app) console.log(`  ${DIM}App:    ${R}${app}`);
  if (schema) console.log(`  ${DIM}Schema: ${R}${schema}`);
  console.log('');
}

async function use(
  _args: string[],
  flags: Record<string, string | string[] | boolean>,
): Promise<void> {
  const app = getFlag(flags, 'app') ?? null;
  const schema = getFlag(flags, 'schema') ?? null;

  if (!app && !schema) {
    fail(`Usage: ${CLI_BIN} context use --app <id> [--schema <id>]`);
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
  console.log(`    ${CYAN}project${R}  ${project ? `${GREEN}${CONFIG_DIR_NAME}/${CONTEXT_FILE}${R}` : `${GREY}not found${R}`}`);
  console.log(`    ${CYAN}global${R}   ${global.activeApp || global.activeSchema ? `${GREEN}~/${CONFIG_DIR_NAME}/${CONTEXT_FILE}${R}` : `${GREY}not set${R}`}`);
  console.log('');
}

export const contextCommands: Command = {
  name: 'context',
  description: 'Manage app and schema context',
  usage: `${CLI_BIN} context <init|use|show>`,
  subcommands: [
    { name: 'init', description: 'Create project context file', run: init },
    { name: 'use', description: 'Set global active app/schema', run: use },
    { name: 'show', description: 'Show resolved context', run: show },
  ],
  run: async (args, flags) => show(args, flags),
};
