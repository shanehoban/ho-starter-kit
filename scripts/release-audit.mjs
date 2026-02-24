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
		throw new Error('Usage: node scripts/release-audit.mjs --provider <sqlite|postgres|all>');
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
			process.env.BETTER_AUTH_SECRET ?? `release-audit-${crypto.randomBytes(24).toString("hex")}`,
		DB_PROVIDER: provider,
		...overrides,
	};

	return env;
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
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const artifactsDir = path.join(process.cwd(), "artifacts", "release-audit", timestamp);
	ensureDir(artifactsDir);

	const report = {
		startedAt: new Date().toISOString(),
		provider,
		artifactsDir,
		steps: [],
		success: false,
	};

	let localPostgresStarted = false;
	let postgresComposeFile = path.join(process.cwd(), "docker-compose.audit-postgres.yml");
	let postgresUrl =
		process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:55433/ho_starter_kit_audit";

	try {
		for (const step of [
			...(skipE2E
				? []
				: [
						[
							"playwright chromium preflight",
							"pnpm",
							["exec", "node", "--input-type=module", "-e", playwrightPreflightScript],
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
				const sqliteDbPath = "/tmp/ho-starter-kit-release-audit.sqlite";
				removeSqliteDb(sqliteDbPath);
				const env = buildAuditEnv("sqlite", { DB_PATH: sqliteDbPath });
				const providerOutputDir = path.join(artifactsDir, "sqlite");
				ensureDir(providerOutputDir);

				const sqliteSteps = [
					["sqlite migrate", "pnpm", ["db:apply-migrations"]],
					["sqlite integrity", "pnpm", ["db:check"]],
					["sqlite smoke", "pnpm", ["db:smoke"]],
				];
				if (!skipE2E) {
					sqliteSteps.push([
						"sqlite route/security e2e",
						"pnpm",
						["test:e2e", "--project=chromium"],
						{
							...env,
							PLAYWRIGHT_OUTPUT_DIR: path.join(providerOutputDir, "playwright-output"),
							PLAYWRIGHT_JSON_REPORT: path.join(providerOutputDir, "playwright-report.json"),
						},
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
					const result = runCommand(name, command, args, { env: customEnv ?? env });
					report.steps.push(result);
					if (result.status === "failed") throw new Error(`Step failed: ${name}`);
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
					if (up.status === "failed") throw new Error("Step failed: postgres compose up");
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
					postgresSteps.push([
						"postgres route/security e2e",
						"pnpm",
						["test:e2e", "--project=chromium"],
						{
							...env,
							PLAYWRIGHT_OUTPUT_DIR: path.join(providerOutputDir, "playwright-output"),
							PLAYWRIGHT_JSON_REPORT: path.join(providerOutputDir, "playwright-report.json"),
						},
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
					const result = runCommand(name, command, args, { env: customEnv ?? env });
					report.steps.push(result);
					if (result.status === "failed") throw new Error(`Step failed: ${name}`);
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
