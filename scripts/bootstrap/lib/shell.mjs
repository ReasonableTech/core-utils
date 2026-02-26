import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { stripVTControlCharacters } from "node:util";
import { spinner, taskLog } from "@clack/prompts";
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

export async function runCommandWithTask(title, command, args, options = {}) {
  const useSpinner = Boolean(process.stdout.isTTY && process.stderr.isTTY);
  const task = useSpinner ? spinner() : null;
  if (task !== null) {
    task.start(title);
  } else {
    logSubline(`Running: ${title}`);
  }

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
    const stdoutLines = [];
    const stderrLines = [];

    const recordLine = (line, lineStore) => {
      const sanitized = stripVTControlCharacters(line).trim();
      if (sanitized.length === 0) {
        return;
      }
      lineStore.push(sanitized);
      if (firstLine === null) {
        firstLine = sanitized;
      }
      lastLine = sanitized;
    };

    const stdoutRl = child.stdout ? createInterface({ input: child.stdout }) : null;
    const stderrRl = child.stderr ? createInterface({ input: child.stderr }) : null;

    if (stdoutRl !== null) {
      stdoutRl.on("line", (line) => {
        recordLine(line, stdoutLines);
      });
    }

    if (stderrRl !== null) {
      stderrRl.on("line", (line) => {
        recordLine(line, stderrLines);
      });
    }

    const settle = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      resolvePromise(result);
    };

    child.on("error", (error) => {
      if (task !== null) {
        task.error(`Failed ${title}`);
      } else {
        logSubline(`Failed ${title}`);
      }
      logSubline(`error: ${error.message}`);
      settle({
        ok: false,
        status: 1,
        firstLine: error.message,
        lastLine: error.message,
        stdout: stdoutLines.join("\n"),
        stderr: error.message,
      });
    });

    child.on("close", (code) => {
      const status = code ?? 1;
      if (status === 0) {
        if (task !== null) {
          task.stop(`Completed ${title}`);
        } else {
          logSubline(`Completed ${title}`);
        }
      } else {
        if (task !== null) {
          task.error(`Failed ${title}`);
        } else {
          logSubline(`Failed ${title}`);
        }
        const summary = firstLine ?? "no output";
        logSubline(`exit: ${status} (${summary})`);
      }

      settle({
        ok: status === 0,
        status,
        firstLine,
        lastLine,
        stdout: stdoutLines.join("\n"),
        stderr: stderrLines.join("\n"),
      });
    });
  });
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
      task.error(`Failed ${title}`);
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
        task.success(`Completed ${title}`);
      } else {
        task.error(`Failed ${title}`);
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

export async function runShellCommandWithTask(title, command, options = {}) {
  const useSpinner = Boolean(process.stdout.isTTY && process.stderr.isTTY);
  const task = useSpinner ? spinner() : null;
  if (task !== null) {
    task.start(title);
  } else {
    logSubline(`Running: ${title}`);
  }

  return await new Promise((resolvePromise) => {
    const child = spawn(resolveShell(), ["-c", command], {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let firstLine = null;
    let settled = false;

    const recordLine = (line) => {
      const sanitized = stripVTControlCharacters(line).trim();
      if (sanitized.length === 0) {
        return;
      }
      if (firstLine === null) {
        firstLine = sanitized;
      }
    };

    const stdoutRl = child.stdout ? createInterface({ input: child.stdout }) : null;
    const stderrRl = child.stderr ? createInterface({ input: child.stderr }) : null;

    if (stdoutRl !== null) {
      stdoutRl.on("line", recordLine);
    }

    if (stderrRl !== null) {
      stderrRl.on("line", recordLine);
    }

    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolvePromise(value);
    };

    child.on("error", (error) => {
      if (task !== null) {
        task.error(`Failed ${title}`);
      } else {
        logSubline(`Failed ${title}`);
      }
      logSubline(`error: ${error.message}`);
      settle(false);
    });

    child.on("close", (code) => {
      if (code === 0) {
        if (task !== null) {
          task.stop(`Completed ${title}`);
        } else {
          logSubline(`Completed ${title}`);
        }
        settle(true);
        return;
      }

      if (task !== null) {
        task.error(`Failed ${title}`);
      } else {
        logSubline(`Failed ${title}`);
      }
      logSubline(
        `exit: ${String(code ?? "unknown")}${firstLine != null ? ` (${firstLine})` : ""}`,
      );
      settle(false);
    });
  });
}
