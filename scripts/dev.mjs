import { spawn } from "node:child_process";

const processes = [];

const run = (command, args, name) => {
  const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  processes.push(child);
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });
  return child;
};

const shutdown = (code = 0) => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("npm", ["run", "dev", "--workspace", "backend"], "backend");
run("npm", ["run", "dev", "--workspace", "frontend"], "frontend");
