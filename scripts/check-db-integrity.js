#!/usr/bin/env node

import Database from "better-sqlite3";
import postgres from "postgres";

const provider = process.env.DB_PROVIDER === "postgres" ? "postgres" : "sqlite";

if (provider === "postgres") {
	await checkPostgresIntegrity();
} else {
	checkSqliteIntegrity();
}

async function checkPostgresIntegrity() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error("DATABASE_URL is required when DB_PROVIDER=postgres");
		process.exit(1);
	}

	const sql = postgres(databaseUrl, { max: 1 });
	const issues = [];
	try {
		const [missingUsers] = await sql`
      SELECT COUNT(*)::int AS count
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.user_id = u.id AND a.provider_id = 'credential'
      )
    `;
		if (missingUsers.count > 0) {
			issues.push({ severity: "error", message: `${missingUsers.count} users without credential accounts` });
		}

		const [superAdminCount] = await sql`
      SELECT COUNT(*)::int AS count FROM users WHERE role = 'super-admin'
    `;

		const [userCount] = await sql`
      SELECT COUNT(*)::int AS count FROM users
    `;
		if (userCount.count > 0 && superAdminCount.count === 0) {
			issues.push({ severity: "error", message: "No super-admin users found" });
		} else if (userCount.count === 0) {
			issues.push({ severity: "warning", message: "No users yet (first registration will become super-admin)" });
		}

		const [stats] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM users) as users,
        (SELECT COUNT(*)::int FROM accounts WHERE provider_id = 'credential') as accounts,
        (SELECT COUNT(*)::int FROM sessions) as sessions
    `;

		console.log("\nDatabase Stats:");
		console.log(`  Users: ${stats.users}`);
		console.log(`  Credential Accounts: ${stats.accounts}`);
		console.log(`  Sessions: ${stats.sessions}`);
	} finally {
		await sql.end();
	}

	reportIssuesAndExit(issues);
}

function checkSqliteIntegrity() {
	const dbPath = process.env.DB_PATH || "./sqlite.db";
	const db = new Database(dbPath);
	const issues = [];

	try {
		const usersWithoutAccounts = db.prepare(`
      SELECT u.id, u.email, u.name
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.user_id = u.id AND a.provider_id = 'credential'
      )
    `).all();

		if (usersWithoutAccounts.length > 0) {
			issues.push({
				severity: "error",
				message: `${usersWithoutAccounts.length} users without credential accounts`,
			});
		}

		const superAdminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super-admin'").get();
		const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
		if (userCount.count > 0 && superAdminCount.count === 0) {
			issues.push({ severity: "error", message: "No super-admin users found" });
		} else if (userCount.count === 0) {
			issues.push({
				severity: "warning",
				message: "No users yet (first registration will become super-admin)",
			});
		}

		const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM accounts WHERE provider_id = 'credential') as accounts,
        (SELECT COUNT(*) FROM sessions) as sessions
    `).get();

		console.log("\nDatabase Stats:");
		console.log(`  Users: ${stats.users}`);
		console.log(`  Credential Accounts: ${stats.accounts}`);
		console.log(`  Sessions: ${stats.sessions}`);
	} finally {
		db.close();
	}

	reportIssuesAndExit(issues);
}

function reportIssuesAndExit(issues) {
	if (issues.length === 0) {
		console.log("\nIntegrity check passed");
		process.exit(0);
	}

	const errors = issues.filter((issue) => issue.severity === "error");
	const warnings = issues.filter((issue) => issue.severity === "warning");

	if (errors.length > 0) {
		console.log(`\nErrors (${errors.length}):`);
		for (const issue of errors) {
			console.log(`- ${issue.message}`);
		}
	}

	if (warnings.length > 0) {
		console.log(`\nWarnings (${warnings.length}):`);
		for (const issue of warnings) {
			console.log(`- ${issue.message}`);
		}
	}

	process.exit(errors.length > 0 ? 1 : 0);
}
