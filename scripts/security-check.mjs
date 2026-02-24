#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const errors = [];

function readText(filePath) {
	return fs.readFileSync(path.join(projectRoot, filePath), "utf8");
}

function assertFileExists(filePath) {
	const fullPath = path.join(projectRoot, filePath);
	if (!fs.existsSync(fullPath)) {
		errors.push(`Missing required file: ${filePath}`);
	}
}

function assertContains(filePath, pattern, message) {
	const text = readText(filePath);
	if (!pattern.test(text)) {
		errors.push(`${filePath}: ${message}`);
	}
}

function assertCountAtLeast(filePath, pattern, minimumCount, message) {
	const text = readText(filePath);
	const matches = text.match(pattern) ?? [];
	if (matches.length < minimumCount) {
		errors.push(`${filePath}: ${message}. Expected at least ${minimumCount}, found ${matches.length}.`);
	}
}

function runCommand(label, command, args) {
	const result = spawnSync(command, args, {
		cwd: projectRoot,
		stdio: "inherit",
		env: process.env,
	});
	if (result.status !== 0) {
		errors.push(`${label} failed with exit code ${result.status ?? "unknown"}`);
	}
}

function runCommandIfFileExists(label, filePath, command, args) {
	const fullPath = path.join(projectRoot, filePath);
	if (!fs.existsSync(fullPath)) {
		return;
	}
	runCommand(label, command, args);
}

assertFileExists("SECURITY.md");
assertFileExists("security/audit-allowlist.json");
assertFileExists("tests/e2e/route-security.spec.ts");

assertContains(
	"src/routes/awaiting-approval.tsx",
	/throw redirect\(\{ to: "\/" \}\)/,
	'must redirect anonymous users to "/"',
);
assertContains(
	"src/routes/awaiting-approval.tsx",
	/throw redirect\(\{ to: "\/app" \}\)/,
	'must redirect approved users to "/app"',
);
assertContains(
	"src/routes/_authenticated/admin.tsx",
	/throw redirect\(\{ to: "\/app" \}\)/,
	'must redirect non-admin users to "/app"',
);
assertContains(
	"src/routes/_authenticated.tsx",
	/throw redirect\(\{ to: "\/login" \}\)/,
	'must redirect unauthenticated users to "/login"',
);
assertContains(
	"src/routes/_authenticated.tsx",
	/throw redirect\(\{ to: "\/awaiting-approval" \}\)/,
	'must redirect unapproved users to "/awaiting-approval"',
);
assertCountAtLeast(
	"src/server/users.ts",
	/assertSameOriginRequest\(\);/g,
	8,
	"must enforce same-origin checks on every POST write server function",
);

runCommand("origin-guard tests", "pnpm", ["test", "src/server/origin-guard.test.ts"]);
runCommand("auth-guards tests", "pnpm", ["test", "src/server/auth-guards.test.ts"]);
runCommand("password-reset-policy tests", "pnpm", ["test", "src/server/password-reset-policy.test.ts"]);
runCommand("request-identity tests", "pnpm", ["test", "src/server/request-identity.test.ts"]);
runCommandIfFileExists(
	"rate-limiter tests",
	"src/server/rate-limiter.test.ts",
	"pnpm",
	["test", "src/server/rate-limiter.test.ts"],
);

if (errors.length > 0) {
	console.error("Security checks failed:");
	for (const message of errors) {
		console.error(`- ${message}`);
	}
	process.exit(1);
}

console.log("Security checks passed.");
