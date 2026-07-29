import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function killListeningPids(port) {
  try {
    const output = execFileSync('lsof', ['-tiTCP:' + port, '-sTCP:LISTEN'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const pids = output
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch {
        // Ignore already-exited processes.
      }
    }
  } catch {
    // Ignore if nothing is listening.
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  killListeningPids(9000);
  killListeningPids(4321);
  await wait(1500);

  const child = spawn('npx', ['tinacms', 'dev', '-c', 'astro dev --host 0.0.0.0'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DOTENV_CONFIG_PATH: '.env.local',
    },
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
