#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import postgres from "postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";

const provider = process.env.DB_PROVIDER === "postgres" ? "postgres" : "sqlite";

if (provider === "postgres") {
	await applyPostgresMigrations();
} else {
	applySqliteMigrations();
}

async function applyPostgresMigrations() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error("DATABASE_URL is required when DB_PROVIDER=postgres");
		process.exit(1);
	}

	const migrationsFolder = path.resolve(process.cwd(), "drizzle", "postgres");
	if (!fs.existsSync(migrationsFolder)) {
		console.error(`Migrations folder not found: ${migrationsFolder}`);
		process.exit(1);
	}

	const client = postgres(databaseUrl, { max: 1 });
	try {
		const db = drizzlePg(client);
		await migratePostgres(db, { migrationsFolder });
		console.log(`Applied postgres migrations from ${migrationsFolder}`);
	} finally {
		await client.end();
	}
}

function applySqliteMigrations() {
	const dbPath = process.env.DB_PATH || "./sqlite.db";
	const migrationsFolder = path.resolve(process.cwd(), "drizzle", "sqlite");

	const dbDir = path.dirname(dbPath);
	if (dbDir && dbDir !== ".") {
		fs.mkdirSync(dbDir, { recursive: true });
	}

	if (!fs.existsSync(migrationsFolder)) {
		console.error(`Migrations folder not found: ${migrationsFolder}`);
		process.exit(1);
	}

	const sqlite = new Database(dbPath);
	sqlite.pragma("journal_mode = WAL");
	sqlite.pragma("foreign_keys = ON");

	const MIGRATIONS_TABLE = "__drizzle_migrations";

	function ensureMigrationsTable() {
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				hash text NOT NULL,
				created_at numeric
			)
		`);
	}

	function readMigrationEntriesFromDisk() {
		const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
		const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
		const entries = Array.isArray(journal.entries) ? journal.entries : [];

		return entries.map((entry) => {
			const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
			const sqlText = fs.readFileSync(sqlPath, "utf8");
			return {
				...entry,
				hash: createHash("sha256").update(sqlText).digest("hex"),
				statements: sqlText
					.split("--> statement-breakpoint")
					.map((statement) => statement.trim())
					.filter(Boolean),
			};
		});
	}

	const migrationEntries = readMigrationEntriesFromDisk();

	function getMigrationsCount() {
		ensureMigrationsTable();
		const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM "${MIGRATIONS_TABLE}"`).get();
		return Number(row.count);
	}

	function getLatestMigrationCreatedAt() {
		ensureMigrationsTable();
		const row = sqlite
			.prepare(`SELECT created_at FROM "${MIGRATIONS_TABLE}" ORDER BY created_at DESC LIMIT 1`)
			.get();
		return row ? Number(row.created_at) : null;
	}

	function isAlreadyExistsError(error) {
		let cursor = error;
		while (cursor) {
			if (
				cursor instanceof Error &&
				(cursor.message.includes("already exists") || cursor.message.includes("SQLITE_ERROR"))
			) {
				return true;
			}
			cursor = cursor instanceof Error ? cursor.cause : undefined;
		}
		return false;
	}

	function normalizeSql(sql) {
		return sql.replace(/\s+/g, " ").replace(/;+$/, "").trim();
	}

	function extractFailedSqlFromError(error) {
		let cursor = error;
		const marker = "Failed to run the query '";

		while (cursor) {
			if (cursor instanceof Error && cursor.message.includes(marker)) {
				const start = cursor.message.indexOf(marker);
				const end = cursor.message.lastIndexOf("'");
				if (start !== -1 && end !== -1 && end > start) {
					return cursor.message.slice(start + marker.length, end);
				}
			}
			cursor = cursor instanceof Error ? cursor.cause : undefined;
		}
		return null;
	}

	function findFailingMigrationEntry(error) {
		const failedSql = extractFailedSqlFromError(error);
		if (!failedSql) return null;
		const normalizedFailedSql = normalizeSql(failedSql);

		for (const entry of migrationEntries) {
			for (const statement of entry.statements) {
				if (normalizeSql(statement) === normalizedFailedSql) {
					return entry;
				}
			}
		}
		return null;
	}

	function bootstrapMigrationJournalFromDisk() {
		if (migrationEntries.length === 0) {
			return;
		}
		const insert = sqlite.prepare(
			`INSERT INTO "${MIGRATIONS_TABLE}" ("hash", "created_at") VALUES (?, ?)`,
		);
		const tx = sqlite.transaction(() => {
			for (const entry of migrationEntries) {
				insert.run(entry.hash, entry.when);
			}
		});
		tx();
	}

	function reconcileMissingMigrationHistory(failingEntry) {
		const latestCreatedAt = getLatestMigrationCreatedAt();
		const fromCreatedAt = latestCreatedAt ?? Number.NEGATIVE_INFINITY;

		const recoveryTarget = failingEntry
			? failingEntry.when
			: migrationEntries.find((entry) => entry.when > fromCreatedAt)?.when;

		if (!recoveryTarget) return 0;

		const entriesToInsert = migrationEntries.filter(
			(entry) => entry.when > fromCreatedAt && entry.when <= recoveryTarget,
		);
		if (entriesToInsert.length === 0) return 0;

		const selectByCreatedAt = sqlite.prepare(
			`SELECT hash FROM "${MIGRATIONS_TABLE}" WHERE created_at = ? LIMIT 1`,
		);
		const selectExact = sqlite.prepare(
			`SELECT COUNT(*) AS count FROM "${MIGRATIONS_TABLE}" WHERE hash = ? AND created_at = ?`,
		);
		const insert = sqlite.prepare(
			`INSERT INTO "${MIGRATIONS_TABLE}" ("hash", "created_at") VALUES (?, ?)`,
		);

		const tx = sqlite.transaction(() => {
			let insertedCount = 0;
			for (const entry of entriesToInsert) {
				const existingForTimestamp = selectByCreatedAt.get(entry.when);
				if (existingForTimestamp && existingForTimestamp.hash !== entry.hash) {
					throw new Error(
						`Migration history mismatch at ${entry.tag} (${entry.when}): database hash does not match disk migrations.`,
					);
				}

				const existingExact = Number(selectExact.get(entry.hash, entry.when).count);
				if (existingExact === 0) {
					insert.run(entry.hash, entry.when);
					insertedCount += 1;
				}
			}
			return insertedCount;
		});

		return tx();
	}

	try {
		const db = drizzleSqlite(sqlite);
		try {
			migrateSqlite(db, { migrationsFolder });
		} catch (error) {
			if (isAlreadyExistsError(error) && getMigrationsCount() === 0) {
				console.warn(
					"Migration history was empty while schema objects already existed. Bootstrapping migration journal and retrying once.",
				);
				bootstrapMigrationJournalFromDisk();
				migrateSqlite(db, { migrationsFolder });
			} else if (isAlreadyExistsError(error)) {
				const failingEntry = findFailingMigrationEntry(error);
				const insertedCount = reconcileMissingMigrationHistory(failingEntry);

				if (insertedCount > 0) {
					console.warn(
						`Migration history was behind while schema objects already existed. Added ${insertedCount} missing migration record(s) and retrying once.`,
					);
					migrateSqlite(db, { migrationsFolder });
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}

		console.log(`Applied sqlite migrations from ${migrationsFolder} to ${dbPath}`);
	} finally {
		sqlite.close();
	}
}
