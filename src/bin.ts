#!/usr/bin/env node

import { authLogin, authStatus, authLogout } from './auth.js';
import { startShell } from './shell.js';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

async function main() {
  // No args: enter interactive shell
  if (!command) {
    await startShell();
    return;
  }

  // Direct commands (non-interactive)
  if (command === 'auth') {
    if (!subcommand || subcommand === 'login') {
      await authLogin();
    } else if (subcommand === 'status') {
      await authStatus();
    } else if (subcommand === 'logout') {
      await authLogout();
    } else {
      console.error(`Unknown auth command: ${subcommand}`);
      process.exit(2);
    }
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log('');
    console.log('  0cmplx - command-line interface');
    console.log('');
    console.log('  Usage:');
    console.log('    0cmplx               Enter interactive shell');
    console.log('    0cmplx auth          Authenticate with an API token');
    console.log('    0cmplx auth status   Show current authentication');
    console.log('    0cmplx auth logout   Clear stored credentials');
    console.log('');
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error('Run 0cmplx --help for usage');
  process.exit(2);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
