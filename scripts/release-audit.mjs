#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const supportedProviders = new Set(["sqlite", "postgres", "all"]);
const playwrightPreflightScript = `
import { chromium } from "@playwright/test";

try {
  const browser = await chromium.launch({ headless: true });
  await browser.close();
  console.log("Playwright chromium preflight passed.");
} catch (error) {
  console.error("Playwright chromium preflight failed.");
  console.error("Install browser + system dependencies with:");
  console.error("  sudo pnpm exec playwright install --with-deps chromium");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
`.trim();

function parseProviderArg() {
	const args = process.argv.slice(2);
	const providerFlagIndex = args.findIndex((arg) => arg === "--provider");
	if (providerFlagIndex === -1) return "all";
	const value = args[providerFlagIndex + 1];
	if (!value || !supportedProviders.has(value)) {
		throw new Error(
			"Usage: node scripts/release-audit.mjs --provider <sqlite|postgres|all>",
		);
	}
	return value;
}

function runCommand(stepName, command, args, options = {}) {
	const started = Date.now();
	console.log(`\n>>> ${stepName}`);
	const result = spawnSync(command, args, {
		cwd: options.cwd ?? process.cwd(),
		env: options.env ?? process.env,
		stdio: "inherit",
	});
	const durationMs = Date.now() - started;
	return {
		stepName,
		command: `${command} ${args.join(" ")}`.trim(),
		status: result.status === 0 ? "passed" : "failed",
		durationMs,
		exitCode: result.status ?? 1,
	};
}

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

function pruneAuditArtifacts(rootDir, maxArtifacts) {
	ensureDir(rootDir);
	if (!Number.isFinite(maxArtifacts) || maxArtifacts < 1) {
		return;
	}

	const entries = fs
		.readdirSync(rootDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

	const excess = entries.length - maxArtifacts;
	if (excess <= 0) {
		return;
	}

	for (const directoryName of entries.slice(0, excess)) {
		fs.rmSync(path.join(rootDir, directoryName), {
			recursive: true,
			force: true,
		});
	}
}

function removeSqliteDb(dbPath) {
	for (const suffix of ["", "-shm", "-wal"]) {
		const candidate = `${dbPath}${suffix}`;
		if (fs.existsSync(candidate)) {
			fs.rmSync(candidate, { force: true });
		}
	}
}

function buildAuditEnv(provider, overrides = {}) {
	const host = process.env.E2E_HOST ?? "127.0.0.1";
	const port = process.env.E2E_PORT ?? "3000";
	const baseUrl = process.env.E2E_BASE_URL ?? `http://${host}:${port}`;

	const env = {
		...process.env,
		NODE_ENV: "test",
		EMAIL_PROVIDER: "null",
		BETTER_AUTH_URL: baseUrl,
		BETTER_AUTH_SECRET:
			process.env.BETTER_AUTH_SECRET ??
			`release-audit-${crypto.randomBytes(24).toString("hex")}`,
		DB_PROVIDER: provider,
		...overrides,
	};

	return env;
}

function createE2ERuntime({
	provider,
	port,
	dbOverrides,
	hostOverride,
	outputDir,
}) {
	const host = hostOverride ?? process.env.E2E_HOST ?? "127.0.0.1";
	const baseUrl = `http://${host}:${port}`;
	const env = buildAuditEnv(provider, {
		...dbOverrides,
		E2E_HOST: host,
		E2E_PORT: String(port),
		E2E_BASE_URL: baseUrl,
		BETTER_AUTH_URL: baseUrl,
		E2E_WEB_SERVER_COMMAND: `pnpm exec vite preview --host ${host} --port ${port}`,
		PLAYWRIGHT_REUSE_SERVER: "0",
	});

	return {
		env: {
			...env,
			PLAYWRIGHT_OUTPUT_DIR: path.join(outputDir, "playwright-output"),
			PLAYWRIGHT_JSON_REPORT: path.join(outputDir, "playwright-report.json"),
		},
		baseEnv: env,
	};
}

async function waitForPostgres(databaseUrl) {
	const postgres = (await import("postgres")).default;
	const timeoutMs = 90_000;
	const retryDelayMs = 1_500;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const sql = postgres(databaseUrl, { max: 1, connect_timeout: 5 });
		try {
			await sql`select 1`;
			await sql.end({ timeout: 0 });
			return;
		} catch {
			await sql.end({ timeout: 0 });
			await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
		}
	}

	throw new Error("Postgres did not become ready before timeout.");
}

async function main() {
	const provider = parseProviderArg();
	const providerList = provider === "all" ? ["sqlite", "postgres"] : [provider];
	const skipE2E = process.env.RELEASE_AUDIT_SKIP_E2E === "1";
	const maxArtifacts = Number(process.env.RELEASE_AUDIT_MAX_ARTIFACTS ?? "10");
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const artifactsRootDir = path.join(
		process.cwd(),
		"artifacts",
		"release-audit",
	);
	pruneAuditArtifacts(artifactsRootDir, maxArtifacts);
	const artifactsDir = path.join(artifactsRootDir, timestamp);
	ensureDir(artifactsDir);

	const report = {
		startedAt: new Date().toISOString(),
		provider,
		artifactsDir,
		steps: [],
		success: false,
	};

	let localPostgresStarted = false;
	let postgresComposeFile = path.join(
		process.cwd(),
		"docker-compose.audit-postgres.yml",
	);
	let postgresUrl =
		process.env.DATABASE_URL ??
		"postgres://postgres:postgres@127.0.0.1:55433/ho_starter_kit_audit";

	try {
		for (const step of [
			...(skipE2E
				? []
				: [
						[
							"playwright chromium preflight",
							"pnpm",
							[
								"exec",
								"node",
								"--input-type=module",
								"-e",
								playwrightPreflightScript,
							],
						],
					]),
			["verify", "pnpm", ["verify"]],
			["build", "pnpm", ["build"]],
			["naming check", "pnpm", ["naming:check"]],
			["security checks", "pnpm", ["security:check"]],
			["audit enforcement", "pnpm", ["security:audit"]],
		]) {
			const [name, command, args] = step;
			const result = runCommand(name, command, args);
			report.steps.push(result);
			if (result.status === "failed") throw new Error(`Step failed: ${name}`);
		}

		for (const currentProvider of providerList) {
			if (currentProvider === "sqlite") {
				const sqliteDbPath = `/tmp/ho-starter-kit-release-audit-${timestamp}.sqlite`;
				const sqliteE2eDbPath = `/tmp/ho-starter-kit-release-audit-e2e-${timestamp}.sqlite`;
				removeSqliteDb(sqliteDbPath);
				removeSqliteDb(sqliteE2eDbPath);
				const env = buildAuditEnv("sqlite", { DB_PATH: sqliteDbPath });
				const providerOutputDir = path.join(artifactsDir, "sqlite");
				ensureDir(providerOutputDir);

				const sqliteSteps = [
					["sqlite migrate", "pnpm", ["db:apply-migrations"]],
					["sqlite integrity", "pnpm", ["db:check"]],
					["sqlite smoke", "pnpm", ["db:smoke"]],
				];
				if (!skipE2E) {
					const sqliteE2EPort = Number(process.env.E2E_SQLITE_PORT ?? "3101");
					const sqliteE2E = createE2ERuntime({
						provider: "sqlite",
						port: sqliteE2EPort,
						dbOverrides: { DB_PATH: sqliteE2eDbPath },
						outputDir: providerOutputDir,
					});
					sqliteSteps.push([
						"sqlite e2e migrate",
						"pnpm",
						["db:apply-migrations"],
						sqliteE2E.baseEnv,
					]);
					sqliteSteps.push([
						"sqlite route/security e2e",
						"pnpm",
						["test:e2e", "--project=chromium"],
						sqliteE2E.env,
					]);
				} else {
					report.steps.push({
						stepName: "sqlite route/security e2e",
						command: "pnpm test:e2e --project=chromium",
						status: "skipped",
						durationMs: 0,
						exitCode: 0,
					});
				}

				for (const step of sqliteSteps) {
					const [name, command, args, customEnv] = step;
					const result = runCommand(name, command, args, {
						env: customEnv ?? env,
					});
					report.steps.push(result);
					if (result.status === "failed")
						throw new Error(`Step failed: ${name}`);
				}
			}

			if (currentProvider === "postgres") {
				const useExternalPostgres = process.env.USE_EXTERNAL_POSTGRES === "1";
				if (!useExternalPostgres) {
					const up = runCommand("postgres compose up", "docker", [
						"compose",
						"-f",
						postgresComposeFile,
						"up",
						"-d",
					]);
					report.steps.push(up);
					if (up.status === "failed")
						throw new Error("Step failed: postgres compose up");
					localPostgresStarted = true;
				}

				await waitForPostgres(postgresUrl);
				report.steps.push({
					stepName: "postgres ready check",
					command: "waitForPostgres",
					status: "passed",
					durationMs: 0,
					exitCode: 0,
				});

				const env = buildAuditEnv("postgres", { DATABASE_URL: postgresUrl });
				const providerOutputDir = path.join(artifactsDir, "postgres");
				ensureDir(providerOutputDir);

				const postgresSteps = [
					["postgres migrate", "pnpm", ["db:apply-migrations"]],
					["postgres integrity", "pnpm", ["db:check"]],
					["postgres smoke", "pnpm", ["db:smoke"]],
				];
				if (!skipE2E) {
					const postgresE2EPort = Number(
						process.env.E2E_POSTGRES_PORT ?? "3102",
					);
					const postgresE2E = createE2ERuntime({
						provider: "postgres",
						port: postgresE2EPort,
						dbOverrides: { DATABASE_URL: postgresUrl },
						outputDir: providerOutputDir,
					});
					postgresSteps.push([
						"postgres route/security e2e",
						"pnpm",
						["test:e2e", "--project=chromium"],
						postgresE2E.env,
					]);
				} else {
					report.steps.push({
						stepName: "postgres route/security e2e",
						command: "pnpm test:e2e --project=chromium",
						status: "skipped",
						durationMs: 0,
						exitCode: 0,
					});
				}

				for (const step of postgresSteps) {
					const [name, command, args, customEnv] = step;
					const result = runCommand(name, command, args, {
						env: customEnv ?? env,
					});
					report.steps.push(result);
					if (result.status === "failed")
						throw new Error(`Step failed: ${name}`);
				}
			}
		}

		report.success = true;
	} catch (error) {
		report.success = false;
		report.error = error instanceof Error ? error.message : String(error);
	} finally {
		if (localPostgresStarted) {
			const down = runCommand("postgres compose down", "docker", [
				"compose",
				"-f",
				postgresComposeFile,
				"down",
				"-v",
			]);
			report.steps.push(down);
		}

		report.finishedAt = new Date().toISOString();
		const reportPath = path.join(artifactsDir, "report.json");
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		console.log(`\nRelease audit report: ${reportPath}`);
	}

	if (!report.success) {
		process.exit(1);
	}
}

await main();
