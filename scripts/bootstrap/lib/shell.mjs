import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { stripVTControlCharacters } from "node:util";
import { taskLog } from "@clack/prompts";
import { logSubline } from "../../shared/clack-utils.mjs";

function resolveShell() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- System shell selection, not a Turbo task input.
  return process.env.SHELL ?? "sh";
}

export function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: "utf8",
    env: options.env ?? process.env,
    input: options.input,
    shell: false,
    stdio: "pipe",
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

export async function runCommandWithTaskLog(title, command, args, options = {}) {
  const task = taskLog({ title });

  return await new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let firstLine = null;
    let lastLine = null;
    let settled = false;

    const recordLine = (line) => {
      const sanitized = stripVTControlCharacters(line).trim();
      if (sanitized.length === 0) {
        return;
      }
      if (firstLine === null) {
        firstLine = sanitized;
      }
      lastLine = sanitized;
      task.message(sanitized);
    };

    const stdoutRl = child.stdout ? createInterface({ input: child.stdout }) : null;
    const stderrRl = child.stderr ? createInterface({ input: child.stderr }) : null;

    if (stdoutRl !== null) {
      stdoutRl.on("line", recordLine);
    }

    if (stderrRl !== null) {
      stderrRl.on("line", recordLine);
    }

    const settle = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      resolvePromise(result);
    };

    child.on("error", (error) => {
      task.error(`Failed: ${title}`);
      logSubline(`error: ${error.message}`);
      settle({
        ok: false,
        status: 1,
        firstLine: error.message,
        lastLine: error.message,
      });
    });

    child.on("close", (code) => {
      const status = code ?? 1;
      if (status === 0) {
        task.success(`Done: ${title}`);
      } else {
        task.error(`Failed: ${title}`);
        const summary = firstLine ?? "no output";
        logSubline(`exit: ${status} (${summary})`);
      }

      settle({
        ok: status === 0,
        status,
        firstLine,
        lastLine,
      });
    });
  });
}

export function runShellCommand(command, options = {}) {
  const result = spawnSync(resolveShell(), ["-c", command], {
    cwd: options.cwd ?? process.cwd(),
    stdio: "pipe",
    encoding: "utf8",
    env: options.env ?? process.env,
    input: options.input,
  });
  const status = result.status ?? 1;
  return {
    ok: status === 0,
    status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

export function commandOutput(result) {
  if (result.stdout.length > 0) {
    return result.stdout;
  }
  if (result.stderr.length > 0) {
    return result.stderr;
  }
  return "no output";
}

export function summarizeOutputLine(result) {
  return commandOutput(result).split("\n")[0]?.trim() ?? "no output";
}

export async function runShellCommandWithTaskLog(title, command, options = {}) {
  const task = taskLog({ title });

  return await new Promise((resolvePromise) => {
    const child = spawn(resolveShell(), ["-c", command], {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const combinedLines = [];
    const stdoutRl = child.stdout ? createInterface({ input: child.stdout }) : null;
    const stderrRl = child.stderr ? createInterface({ input: child.stderr }) : null;

    const recordLine = (line) => {
      const sanitized = stripVTControlCharacters(line).trim();
      if (sanitized.length === 0) {
        return;
      }
      combinedLines.push(sanitized);
      task.message(sanitized);
    };

    if (stdoutRl !== null) {
      stdoutRl.on("line", recordLine);
    }

    if (stderrRl !== null) {
      stderrRl.on("line", recordLine);
    }

    child.on("error", (error) => {
      task.error(`Failed: ${title}`);
      logSubline(`error: ${error.message}`);
      resolvePromise(false);
    });

    child.on("close", (code) => {
      if (code === 0) {
        task.success(`Done: ${title}`);
        resolvePromise(true);
        return;
      }

      task.error(`Failed: ${title}`);
      const firstLine = combinedLines.find((line) => line.length > 0);
      logSubline(
        `exit: ${String(code ?? "unknown")}${firstLine != null ? ` (${firstLine})` : ""}`,
      );
      resolvePromise(false);
    });
  });
}
