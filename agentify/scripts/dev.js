const { spawn } = require("node:child_process");

const processes = [
  {
    name: "backend",
    command: "npm",
    args: ["--prefix", "backend", "run", "dev"]
  },
  {
    name: "frontend",
    command: "npm",
    args: ["--prefix", "frontend", "run", "dev"]
  }
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    cwd: __dirname + "/..",
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(prefixLines(name, chunk));
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(prefixLines(name, chunk));
  });
  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let shuttingDown = false;

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function shutdown(code) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 100);
}

function prefixLines(name, chunk) {
  return chunk
    .toString()
    .split("\n")
    .map((line) => (line ? `[${name}] ${line}` : line))
    .join("\n");
}
