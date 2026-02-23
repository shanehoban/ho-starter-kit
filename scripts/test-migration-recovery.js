#!/usr/bin/env node

if (process.env.DB_PROVIDER === "postgres") {
	console.log("Migration recovery test is sqlite-only. Skipping for postgres.");
	process.exit(0);
}

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";

const rootDir = process.cwd();
const applyMigrationsScriptPath = path.join(rootDir, "scripts", "apply-migrations.js");
const migrationJournalPath = path.join(rootDir, "drizzle", "sqlite", "meta", "_journal.json");

if (!fs.existsSync(applyMigrationsScriptPath)) {
	console.error(`Missing migration script: ${applyMigrationsScriptPath}`);
	process.exit(1);
}

if (!fs.existsSync(migrationJournalPath)) {
	console.error(`Missing migration journal: ${migrationJournalPath}`);
	process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(migrationJournalPath, "utf8"));
const expectedMigrationCount = Array.isArray(journal.entries) ? journal.entries.length : 0;
if (expectedMigrationCount === 0) {
	console.error("Migration journal is empty. Nothing to test.");
	process.exit(1);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ho-starter-kit-migration-recovery-"));
const tempDbPath = path.join(tempDir, "test.sqlite");

try {
	const db = new Database(tempDbPath);
	db.close();

	runApplyMigrations("Initial migration run");
	assertMigrationCount(expectedMigrationCount, "after initial migration run");

	deleteLatestMigrationRecord();
	runApplyMigrations("Recovery run (partial migration history)");
	assertMigrationCount(expectedMigrationCount, "after partial-history recovery");

	clearMigrationHistory();
	runApplyMigrations("Recovery run (empty migration history)");
	assertMigrationCount(expectedMigrationCount, "after empty-history recovery");

	console.log("Migration recovery test passed.");
} finally {
	fs.rmSync(tempDir, { recursive: true, force: true });
}

function runApplyMigrations(label) {
	console.log(`\n== ${label} ==`);
	const result = spawnSync(process.execPath, [applyMigrationsScriptPath], {
		stdio: "inherit",
		env: { ...process.env, DB_PROVIDER: "sqlite", DB_PATH: tempDbPath },
	});
	if (result.status !== 0) {
		throw new Error(`apply-migrations exited with code ${result.status ?? "unknown"}`);
	}
}

function assertMigrationCount(expectedCount, context) {
	const db = new Database(tempDbPath, { readonly: true });
	try {
		const row = db.prepare('SELECT COUNT(*) AS count FROM "__drizzle_migrations"').get();
		const actualCount = Number(row.count);
		if (actualCount !== expectedCount) {
			throw new Error(`Expected ${expectedCount} migration records ${context}, found ${actualCount}.`);
		}
	} finally {
		db.close();
	}
}

function deleteLatestMigrationRecord() {
	const db = new Database(tempDbPath);
	try {
		db.exec(`
			DELETE FROM "__drizzle_migrations"
			WHERE created_at = (SELECT MAX(created_at) FROM "__drizzle_migrations")
		`);
	} finally {
		db.close();
	}
}

function clearMigrationHistory() {
	const db = new Database(tempDbPath);
	try {
		db.exec('DELETE FROM "__drizzle_migrations"');
	} finally {
		db.close();
	}
}
