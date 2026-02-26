import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  configureTurboRemoteCache,
  inferTurboScope,
  normalizeTeamSlug,
  normalizeVercelTeamEntry,
  upsertTurboTeamEnv,
} from "../lib/turbo-remote-cache.mjs";

function createLogStub() {
  return {
    success() {},
    warn() {},
    step() {},
    info() {},
    error() {},
  };
}

test("normalizeTeamSlug strips wrappers, host, and @ prefix", () => {
  assert.equal(normalizeTeamSlug('"@reasonabletech"'), "reasonabletech");
  assert.equal(normalizeTeamSlug("https://vercel.com/acme-team"), "acme-team");
  assert.equal(normalizeTeamSlug("vercel.com/sample"), "sample");
});

test("normalizeVercelTeamEntry handles slug and teamSlug shapes", () => {
  assert.deepEqual(
    normalizeVercelTeamEntry({ slug: "@reasonabletech", name: "ReasonableTech" }),
    { slug: "reasonabletech", name: "ReasonableTech" },
  );
  assert.deepEqual(
    normalizeVercelTeamEntry({ teamSlug: "acme", name: "Acme" }),
    { slug: "acme", name: "Acme" },
  );
  assert.equal(normalizeVercelTeamEntry({ name: "Missing slug" }), null);
});

test("inferTurboScope prefers existing, then single team, and otherwise requires selection", () => {
  assert.equal(
    inferTurboScope(
      [
        { slug: "foo", name: "Foo" },
        { slug: "bar", name: "Bar" },
      ],
      "bar",
    ),
    "bar",
  );
  assert.equal(
    inferTurboScope([{ slug: "solo", name: "Solo" }], ""),
    "solo",
  );
  assert.equal(
    inferTurboScope(
      [
        { slug: "other", name: "Other" },
        { slug: "reasonabletech-internal", name: "RT" },
      ],
      "",
    ),
    null,
  );
});

test("upsertTurboTeamEnv writes and updates TURBO_TEAM while preserving other keys", async () => {
  const root = await mkdtemp(join(tmpdir(), "core-utils-bootstrap-"));
  const envFilePath = join(root, ".env.local");

  try {
    await writeFile(envFilePath, "FOO=bar\nTURBO_TEAM=old-team\n", "utf8");
    await upsertTurboTeamEnv(envFilePath, "new-team");

    const contents = await readFile(envFilePath, "utf8");
    assert.match(contents, /FOO=bar/u);
    assert.match(contents, /TURBO_TEAM=new-team/u);
    assert.doesNotMatch(contents, /TURBO_TEAM=old-team/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configureTurboRemoteCache prompts vercel auth and retries identity when missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "core-utils-bootstrap-"));
  const envFilePath = join(root, ".env.local");
  const confirmAnswers = [true, true, true];
  const taskCommands = [];
  let whoamiChecks = 0;

  try {
    const result = await configureTurboRemoteCache({
      envFilePath,
      logApi: createLogStub(),
      logSublineFn: () => {},
      promptConfirmFn: async () => confirmAnswers.shift() ?? true,
      promptOrExitFn: async (value) => value,
      runShellCommandFn: (command) => {
        if (command.includes("vercel whoami --format json")) {
          whoamiChecks += 1;
          if (whoamiChecks === 1) {
            return { ok: false, status: 1, stdout: "", stderr: "Not logged in" };
          }
          return {
            ok: true,
            status: 0,
            stdout: '{"username":"tester"}',
            stderr: "",
          };
        }
        if (command.includes("vercel teams list --format json")) {
          return {
            ok: true,
            status: 0,
            stdout: '[{"slug":"sample-team","name":"Sample Team"}]',
            stderr: "",
          };
        }
        return { ok: false, status: 1, stdout: "", stderr: "unexpected command" };
      },
      runShellCommandWithTaskLogFn: async (_title, command) => {
        taskCommands.push(command);
        if (command.includes("vercel login --no-color")) {
          return true;
        }
        if (command.includes("turbo link")) {
          return true;
        }
        if (command.includes("turbo run build")) {
          return true;
        }
        return false;
      },
    });

    assert.equal(result.linked, true);
    assert.equal(
      taskCommands.some((command) => command.includes("vercel login --no-color")),
      true,
    );
    assert.equal(whoamiChecks >= 2, true);

    const envContents = await readFile(envFilePath, "utf8");
    assert.match(envContents, /TURBO_TEAM=sample-team/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configureTurboRemoteCache links after turbo login retry and persists TURBO_TEAM", async () => {
  const root = await mkdtemp(join(tmpdir(), "core-utils-bootstrap-"));
  const envFilePath = join(root, ".env.local");
  const taskCommands = [];
  const commandCalls = [];
  const confirmAnswers = [true, true];
  let linkAttempts = 0;

  try {
    const result = await configureTurboRemoteCache({
      envFilePath,
      logApi: createLogStub(),
      logSublineFn: () => {},
      promptConfirmFn: async () => confirmAnswers.shift() ?? true,
      promptOrExitFn: async (value) => value,
      runShellCommandFn: (command) => {
        commandCalls.push(command);
        if (command.includes("vercel whoami")) {
          return {
            ok: true,
            status: 0,
            stdout: '{"username":"tester"}',
            stderr: "",
          };
        }
        if (command.includes("vercel teams list")) {
          return {
            ok: true,
            status: 0,
            stdout: '[{"slug":"team-a","name":"Team A"}]',
            stderr: "",
          };
        }
        return { ok: false, status: 1, stdout: "", stderr: "unexpected command" };
      },
      runShellCommandWithTaskLogFn: async (_title, command) => {
        taskCommands.push(command);
        if (command.includes("turbo link")) {
          linkAttempts += 1;
          return linkAttempts > 1;
        }
        if (command.includes("turbo login")) {
          return true;
        }
        if (command.includes("turbo run build")) {
          return true;
        }
        return false;
      },
    });

    assert.equal(result.linked, true);
    assert.deepEqual(result.followUpItems, []);
    assert.equal(commandCalls.length >= 2, true);
    assert.equal(
      taskCommands.some((command) => command.includes("turbo login --sso-team team-a")),
      true,
    );

    const envContents = await readFile(envFilePath, "utf8");
    assert.match(envContents, /TURBO_TEAM=team-a/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configureTurboRemoteCache returns manual follow-up items when link setup fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "core-utils-bootstrap-"));
  const envFilePath = join(root, ".env.local");
  const confirmAnswers = [true, true];

  try {
    const result = await configureTurboRemoteCache({
      envFilePath,
      logApi: createLogStub(),
      logSublineFn: () => {},
      promptConfirmFn: async () => confirmAnswers.shift() ?? true,
      promptOrExitFn: async (value) => value,
      runShellCommandFn: (command) => {
        if (command.includes("vercel whoami")) {
          return {
            ok: true,
            status: 0,
            stdout: '{"username":"tester"}',
            stderr: "",
          };
        }
        if (command.includes("vercel teams list")) {
          return {
            ok: true,
            status: 0,
            stdout: '[{"slug":"team-a","name":"Team A"}]',
            stderr: "",
          };
        }
        return { ok: false, status: 1, stdout: "", stderr: "unexpected command" };
      },
      runShellCommandWithTaskLogFn: async (_title, command) => {
        if (command.includes("turbo link")) {
          return false;
        }
        if (command.includes("turbo login")) {
          return false;
        }
        return false;
      },
    });

    assert.equal(result.linked, false);
    assert.equal(result.followUpItems[0], "Turbo remote cache setup requires manual completion:");
    assert.equal(result.followUpItems.some((item) => item.includes("turbo login")), true);

    if (existsSync(envFilePath)) {
      const envContents = await readFile(envFilePath, "utf8");
      assert.doesNotMatch(envContents, /TURBO_TEAM=/u);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("configureTurboRemoteCache adds validation follow-up when verify command fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "core-utils-bootstrap-"));
  const envFilePath = join(root, ".env.local");
  const confirmAnswers = [true, true];

  try {
    const result = await configureTurboRemoteCache({
      envFilePath,
      logApi: createLogStub(),
      logSublineFn: () => {},
      promptConfirmFn: async () => confirmAnswers.shift() ?? true,
      promptOrExitFn: async (value) => value,
      runShellCommandFn: (command) => {
        if (command.includes("vercel whoami")) {
          return {
            ok: true,
            status: 0,
            stdout: '{"username":"tester"}',
            stderr: "",
          };
        }
        if (command.includes("vercel teams list")) {
          return {
            ok: true,
            status: 0,
            stdout: '[{"slug":"team-a","name":"Team A"}]',
            stderr: "",
          };
        }
        return { ok: false, status: 1, stdout: "", stderr: "unexpected command" };
      },
      runShellCommandWithTaskLogFn: async (_title, command) => {
        if (command.includes("turbo link")) {
          return true;
        }
        if (command.includes("turbo run build")) {
          return false;
        }
        return false;
      },
    });

    assert.equal(result.linked, true);
    assert.equal(
      result.followUpItems[0],
      "Turbo remote cache validation needs manual follow-up:",
    );
    assert.equal(
      result.followUpItems.some((item) =>
        item.includes("Confirm remote cache activity"),
      ),
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
