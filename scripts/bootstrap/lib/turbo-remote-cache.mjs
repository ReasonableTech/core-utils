import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { log, select, text } from "@clack/prompts";
import {
  runShellCommand,
  runShellCommandWithTask,
  summarizeOutputLine,
} from "./shell.mjs";
import { logSubline, promptConfirm, promptOrExit } from "./ui.mjs";

const REMOTE_CACHE_DOCS_URL =
  "https://turborepo.dev/docs/core-concepts/remote-caching";
const VERCEL_LOGIN_COMMAND = "pnpm exec vercel login --no-color";
const VERCEL_FORMAT_OPTION_UNSUPPORTED =
  /unknown(?:\s+or\s+unexpected)?\s+option:?\s*['"]?--format['"]?/iu;

export function parseEnvFile(path) {
  const map = new Map();
  if (!existsSync(path)) {
    return map;
  }
  const lines = readFileSync(path, "utf8").split(/\r?\n/u);
  for (const line of lines) {
    if (line.trim().length === 0 || line.trim().startsWith("#")) {
      continue;
    }
    const splitAt = line.indexOf("=");
    if (splitAt <= 0) {
      continue;
    }
    map.set(line.slice(0, splitAt).trim(), line.slice(splitAt + 1).trim());
  }
  return map;
}

export function writeEnvFile(path, values) {
  const existingLines = existsSync(path)
    ? readFileSync(path, "utf8").split("\n")
    : [];
  const lines = [...existingLines];
  const seenKeys = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const splitAt = lines[index].indexOf("=");
    if (splitAt <= 0) {
      continue;
    }
    const key = lines[index].slice(0, splitAt).trim();
    if (!values.has(key)) {
      continue;
    }
    lines[index] = `${key}=${values.get(key) ?? ""}`;
    seenKeys.add(key);
  }

  for (const [key, value] of values.entries()) {
    if (seenKeys.has(key)) {
      continue;
    }
    lines.push(`${key}=${value}`);
  }

  const output = lines.filter(
    (line, index) => !(index === lines.length - 1 && line.length === 0),
  );
  writeFileSync(path, `${output.join("\n")}\n`, "utf8");
}

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function quoteEnvValue(value) {
  if (value.length === 0) {
    return '""';
  }
  if (/[\s#"'`]/.test(value)) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return value;
}

export async function upsertTurboTeamEnv(path, teamSlug) {
  const values = parseEnvFile(path);
  values.set("TURBO_TEAM", quoteEnvValue(teamSlug));
  writeEnvFile(path, values);
}

function parseJsonOutput(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isFormatOptionUnsupported(result) {
  return VERCEL_FORMAT_OPTION_UNSUPPORTED.test(`${result.stderr}\n${result.stdout}`);
}

function parseWhoamiTextOutput(raw) {
  const lines = raw
    .split(/\r?\n/u)
    .map((line) => stripVTControlCharacters(line).trim())
    .filter((line) => {
      return line.length > 0 && !line.startsWith("Vercel CLI");
    });
  return lines.length > 0 ? lines[lines.length - 1] : undefined;
}

function parseTeamsTextOutput(raw) {
  const teams = [];
  const seen = new Set();
  const lines = raw.split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = stripVTControlCharacters(line).trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.startsWith("Vercel CLI") || trimmed.startsWith("Fetching")) {
      continue;
    }
    if (trimmed.startsWith("id ") || trimmed.includes("email / name")) {
      continue;
    }

    const normalizedLine = trimmed
      .replace(/^✔\s+/u, "")
      .replace(/^[>\-\u2022*]\s+/u, "");
    const [candidateSlug, candidateName] = normalizedLine.split(/\s{2,}/u);
    const slug = normalizeTeamSlug(candidateSlug ?? "");
    if (slug.length === 0 || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    teams.push({
      slug,
      name:
        typeof candidateName === "string" && candidateName.trim().length > 0
          ? candidateName.trim()
          : slug,
    });
  }

  return teams;
}

export function normalizeTeamSlug(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^https?:\/\/vercel\.com\//, "")
    .replace(/^vercel\.com\//, "")
    .replace(/^@/, "");
}

export function normalizeVercelTeamEntry(entry) {
  if (entry == null || typeof entry !== "object") {
    return null;
  }
  const record = entry;
  let slugValue = null;
  if (typeof record.slug === "string") {
    slugValue = record.slug;
  } else if (typeof record.teamSlug === "string") {
    slugValue = record.teamSlug;
  }
  if (slugValue == null || slugValue.trim().length === 0) {
    return null;
  }

  const normalizedSlug = normalizeTeamSlug(slugValue);
  if (normalizedSlug.length === 0) {
    return null;
  }

  const nameValue =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name
      : normalizedSlug;
  return {
    slug: normalizedSlug,
    name: nameValue.trim(),
  };
}

export function inferTurboScope(teams, existingTeamValue) {
  const existing = normalizeTeamSlug(existingTeamValue);
  if (existing.length > 0 && teams.some((team) => team.slug === existing)) {
    return existing;
  }
  if (teams.length === 1) {
    return teams[0]?.slug ?? null;
  }
  return null;
}

export function getVercelWhoAmI(runShellCommandFn = runShellCommand) {
  const result = runShellCommandFn("pnpm exec vercel whoami --format json");
  if (!result.ok) {
    if (isFormatOptionUnsupported(result)) {
      const fallback = runShellCommandFn("pnpm exec vercel whoami --no-color");
      if (!fallback.ok) {
        return {
          ok: false,
          reason: summarizeOutputLine(fallback),
        };
      }
      return {
        ok: true,
        username: parseWhoamiTextOutput(fallback.stdout),
      };
    }
    return {
      ok: false,
      reason: summarizeOutputLine(result),
    };
  }

  const parsed = parseJsonOutput(result.stdout);
  if (typeof parsed === "string" && parsed.trim().length > 0) {
    return { ok: true, username: parsed.trim() };
  }
  if (parsed != null && typeof parsed === "object") {
    const topLevelUsername = parsed.username;
    if (typeof topLevelUsername === "string" && topLevelUsername.length > 0) {
      return { ok: true, username: topLevelUsername };
    }
    const user = parsed.user;
    if (user != null && typeof user === "object") {
      const nestedUsername = user.username;
      if (typeof nestedUsername === "string" && nestedUsername.length > 0) {
        return { ok: true, username: nestedUsername };
      }
    }
  }

  return { ok: true, username: undefined };
}

export function getVercelTeams(runShellCommandFn = runShellCommand) {
  const result = runShellCommandFn("pnpm exec vercel teams list --format json");
  if (!result.ok) {
    if (isFormatOptionUnsupported(result)) {
      const fallback = runShellCommandFn("pnpm exec vercel teams list --no-color");
      if (!fallback.ok) {
        return {
          ok: false,
          teams: [],
          reason: summarizeOutputLine(fallback),
        };
      }
      return {
        ok: true,
        teams: parseTeamsTextOutput(fallback.stdout),
      };
    }
    return {
      ok: false,
      teams: [],
      reason: summarizeOutputLine(result),
    };
  }

  const parsed = parseJsonOutput(result.stdout);
  if (parsed == null) {
    return {
      ok: false,
      teams: [],
      reason: "unable to parse vercel teams JSON output",
    };
  }

  const extractList = () => {
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (typeof parsed === "object") {
      const teams = parsed.teams;
      if (Array.isArray(teams)) {
        return teams;
      }
      const results = parsed.results;
      if (Array.isArray(results)) {
        return results;
      }
    }
    return [];
  };

  const teams = extractList()
    .map((entry) => normalizeVercelTeamEntry(entry))
    .filter((entry) => entry != null);

  return {
    ok: true,
    teams,
  };
}

async function ensureVercelAuth(runtime) {
  let identity = getVercelWhoAmI(runtime.runShellCommandFn);
  if (identity.ok) {
    return identity;
  }

  runtime.logSublineFn(
    `No Vercel auth detected (${identity.reason ?? "not logged in"}).`,
  );
  const loginNow = await runtime.promptConfirmFn(
    "Vercel CLI is installed but unauthenticated. Authenticate now?",
    true,
  );
  if (!loginNow) {
    return identity;
  }

  const loggedIn = await runtime.runShellCommandWithTaskFn(
    "Authenticating Vercel CLI",
    VERCEL_LOGIN_COMMAND,
  );
  if (!loggedIn) {
    return identity;
  }

  identity = getVercelWhoAmI(runtime.runShellCommandFn);
  return identity;
}

export async function configureTurboRemoteCache(options = {}) {
  const runShellCommandFn = options.runShellCommandFn ?? runShellCommand;
  const turboCliCommand = options.turboCliCommand ?? "pnpm exec turbo";

  const runtime = {
    envFilePath: options.envFilePath ?? resolve(process.cwd(), ".env.local"),
    verifyCommand:
      options.verifyCommand ??
      `${turboCliCommand} run build --filter=@reasonabletech/utils --ui=stream`,
    turboCliCommand,
    logApi: options.logApi ?? log,
    logSublineFn: options.logSublineFn ?? logSubline,
    promptConfirmFn: options.promptConfirmFn ?? promptConfirm,
    promptOrExitFn: options.promptOrExitFn ?? promptOrExit,
    runShellCommandFn,
    runShellCommandWithTaskFn:
      options.runShellCommandWithTaskFn ?? runShellCommandWithTask,
  };

  const followUpItems = [];
  const values = parseEnvFile(runtime.envFilePath);
  const existingTeam = stripWrappingQuotes(values.get("TURBO_TEAM") ?? "");
  let detectedUsername = "";

  const shouldPrepare = await runtime.promptConfirmFn(
    "Configure Turbo remote cache automatically now?",
    true,
  );
  if (!shouldPrepare) {
    return {
      followUpItems,
      linked: false,
      scope: null,
    };
  }

  let selectedScope = null;
  const identity = await ensureVercelAuth(runtime);
  if (identity.ok) {
    detectedUsername = identity.username ?? "";
    if (detectedUsername.length > 0) {
      runtime.logSublineFn(`Detected Vercel account: ${detectedUsername}`);
    } else {
      runtime.logSublineFn("Detected Vercel auth session.");
    }

    const teamsResult = getVercelTeams(runtime.runShellCommandFn);
    if (teamsResult.ok) {
      const teams = teamsResult.teams;
      if (teams.length > 0) {
        const inferred = inferTurboScope(teams, existingTeam);
        if (inferred != null) {
          const useInferred = await runtime.promptConfirmFn(
            `Use Vercel team \`${inferred}\` for Turbo link?`,
            true,
          );
          if (useInferred) {
            selectedScope = inferred;
          }
        }

        if (selectedScope == null && teams.length > 1) {
          const selectedValue = await runtime.promptOrExitFn(
            select({
              message: "Choose Vercel team for Turbo remote cache",
              options: teams.map((team) => ({
                value: team.slug,
                label: team.name,
                hint: team.slug,
              })),
            }),
          );
          selectedScope = String(selectedValue);
        }
        if (selectedScope == null && teams.length === 1) {
          selectedScope = teams[0]?.slug ?? null;
        }
      }
    } else {
      runtime.logSublineFn(
        `Could not fetch Vercel teams automatically: ${teamsResult.reason ?? "unknown error"}`,
      );
    }
  }

  if (selectedScope == null && detectedUsername.length > 0) {
    const normalizedAccountScope = normalizeTeamSlug(detectedUsername);
    if (normalizedAccountScope.length > 0) {
      const useAccountScope = await runtime.promptConfirmFn(
        `Use Vercel account \`${normalizedAccountScope}\` for Turbo link?`,
        true,
      );
      if (useAccountScope) {
        selectedScope = normalizedAccountScope;
      }
    }
  }

  if (selectedScope == null) {
    const manualScope = await runtime.promptOrExitFn(
      text({
        message: "Turbo team scope (Vercel team slug)",
        placeholder:
          existingTeam.length > 0
            ? normalizeTeamSlug(existingTeam)
            : "your-team-slug",
        initialValue:
          existingTeam.length > 0 ? normalizeTeamSlug(existingTeam) : "",
      }),
    );
    const normalizedScope = normalizeTeamSlug(String(manualScope));
    selectedScope = normalizedScope.length > 0 ? normalizedScope : null;
  }

  const loginCommand =
    selectedScope != null
      ? `${runtime.turboCliCommand} login --sso-team ${selectedScope} --ui=stream`
      : `${runtime.turboCliCommand} login --ui=stream`;
  const linkCommand =
    selectedScope != null
      ? `${runtime.turboCliCommand} link --scope ${selectedScope} --yes --ui=stream`
      : `${runtime.turboCliCommand} link --yes --ui=stream`;

  runtime.logSublineFn("Attempting Turbo link...");
  let linked = await runtime.runShellCommandWithTaskFn(
    "Turbo remote cache link workspace",
    linkCommand,
  );
  if (!linked) {
    runtime.logSublineFn("Turbo link requires authentication. Starting login...");
    const loggedIn = await runtime.runShellCommandWithTaskFn(
      "Turbo remote cache authenticate",
      loginCommand,
    );
    if (loggedIn) {
      linked = await runtime.runShellCommandWithTaskFn(
        "Turbo remote cache retry link",
        linkCommand,
      );
    }
  }

  if (!linked) {
    followUpItems.push("Turbo remote cache setup requires manual completion:");
    followUpItems.push(`  1. Run \`${loginCommand}\``);
    followUpItems.push(`  2. Run \`${linkCommand}\``);
    followUpItems.push(`Docs: ${REMOTE_CACHE_DOCS_URL}`);
    return {
      followUpItems,
      linked: false,
      scope: selectedScope,
    };
  }

  if (selectedScope != null && selectedScope.length > 0) {
    await upsertTurboTeamEnv(runtime.envFilePath, selectedScope);
  }
  runtime.logApi.success("Turbo remote cache linked");

  const verified = await runtime.runShellCommandWithTaskFn(
    "Turbo remote cache validate with build",
    runtime.verifyCommand,
  );
  if (verified) {
    runtime.logApi.success("Turbo remote cache validation command completed");
    return {
      followUpItems,
      linked: true,
      scope: selectedScope,
    };
  }

  followUpItems.push("Turbo remote cache validation needs manual follow-up:");
  followUpItems.push(`  Run \`${runtime.verifyCommand}\``);
  followUpItems.push(
    "  Confirm remote cache activity (hits/misses) in output.",
  );
  followUpItems.push(`Docs: ${REMOTE_CACHE_DOCS_URL}`);

  return {
    followUpItems,
    linked: true,
    scope: selectedScope,
  };
}
