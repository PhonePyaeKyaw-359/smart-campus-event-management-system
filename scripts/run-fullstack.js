const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const npm = "npm";
const cleanEnv = normalizeEnv(process.env);
let shuttingDown = false;

const services = [
  {
    name: "backend",
    cwd: path.join(root, "backend"),
    args: ["start"],
  },
  {
    name: "frontend",
    cwd: path.join(root, "frontend"),
    args: ["run", "dev", "--", "--host", "0.0.0.0"],
  },
];

const children = services.map((service) => {
  const child = spawn(npm, service.args, {
    cwd: service.cwd,
    stdio: "inherit",
    shell: isWindows,
    env: cleanEnv,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.log(`[${service.name}] stopped (${signal || code}). Shutting down the rest.`);
    shutdown(code || 1);
  });

  return child;
});

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

function normalizeEnv(env) {
  const normalized = {};
  const seen = new Set();

  for (const [key, value] of Object.entries(env)) {
    const lookup = isWindows ? key.toLowerCase() : key;
    if (seen.has(lookup)) continue;
    seen.add(lookup);
    normalized[key] = value;
  }

  normalized.FORCE_COLOR = "1";
  return normalized;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
