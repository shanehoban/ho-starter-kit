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
assertFileExists("nitro.config.ts");
assertFileExists("src/lib/csp.ts");
assertFileExists("src/server/plugins/security-headers.mjs");

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
assertContains(
	"src/lib/auth.ts",
	/trustedOrigins/,
	'must explicitly configure Better Auth trusted origins',
);
assertContains(
	"src/lib/auth.ts",
	/secret:\s*BETTER_AUTH_SECRET/,
	'must wire BETTER_AUTH_SECRET explicitly into Better Auth config',
);
assertContains(
	"nitro.config.ts",
	/src\/server\/plugins\/security-headers\.mjs/,
	'must register the security headers plugin in nitro config',
);
assertContains(
	"src/server/plugins/security-headers.mjs",
	/"X-Frame-Options": "DENY"/,
	'must set X-Frame-Options header',
);
assertContains(
	"src/server/plugins/security-headers.mjs",
	/"X-Content-Type-Options": "nosniff"/,
	'must set X-Content-Type-Options header',
);
assertContains(
	"src/server/plugins/security-headers.mjs",
	/"Content-Security-Policy"/,
	'must set a baseline Content-Security-Policy header',
);
assertContains(
	"src/server/plugins/security-headers.mjs",
	/buildContentSecurityPolicy/,
	'must build CSP through shared CSP policy helper',
);
assertContains(
	"src/lib/csp.ts",
	/CSP_SCRIPT_NONCE/,
	'must define CSP script nonce used for SSR script tags',
);
assertContains(
	"src/router.tsx",
	/nonce:\s*CSP_SCRIPT_NONCE/,
	'must wire router SSR nonce so TanStack SSR scripts satisfy CSP',
);
assertContains(
	"src/routes/__root.tsx",
	/<ScriptOnce>/,
	'must render theme boot script via ScriptOnce so nonce is attached',
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
