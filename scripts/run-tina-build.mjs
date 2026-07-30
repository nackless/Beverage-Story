import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(projectRoot, '.env.local') });

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      DOTENV_CONFIG_PATH: '.env.local',
    },
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  runCommand('npx', ['tinacms', 'build']);
  runCommand('npx', ['astro', 'build']);
}

main();
