#!/usr/bin/env node

import { authLogin, authStatus, authLogout } from './auth.js';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

async function main() {
  if (command === 'auth') {
    if (!subcommand || subcommand === 'login') {
      await authLogin();
    } else if (subcommand === 'status') {
      await authStatus();
    } else if (subcommand === 'logout') {
      authLogout();
    } else {
      console.error(`Unknown auth command: ${subcommand}`);
      console.error('Usage: 0cmplx auth [login|status|logout]');
      process.exit(2);
    }
    return;
  }

  if (!command || command === 'help' || command === '--help') {
    console.log('');
    console.log('  0cmplx - command-line interface');
    console.log('');
    console.log('  Usage:');
    console.log('    0cmplx auth          Authenticate with an API token');
    console.log('    0cmplx auth status   Show current authentication');
    console.log('    0cmplx auth logout   Clear stored credentials');
    console.log('');
    console.log('  Generate a token at your dashboard:');
    console.log('    Settings > Programmatic Access > Generate new token');
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
