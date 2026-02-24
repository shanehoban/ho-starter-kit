#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const errors = [];

function fail(message) {
	errors.push(message);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(dir, matcher, relativeBase = projectRoot, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(full, matcher, relativeBase, acc);
			continue;
		}
		if (matcher(full)) {
			acc.push(path.relative(relativeBase, full));
		}
	}
	return acc;
}

function checkPackageScriptNames() {
	const packageJson = readJson(path.join(projectRoot, "package.json"));
	const scripts = packageJson.scripts ?? {};
	const scriptNameRegex = /^[a-z0-9]+(?::[a-z0-9-]+)*$/;

	for (const scriptName of Object.keys(scripts)) {
		if (!scriptNameRegex.test(scriptName)) {
			fail(`Invalid script name "${scriptName}". Use lowercase colon-separated names.`);
		}
	}
}

function checkEnvVarNaming() {
	const envExamplePath = path.join(projectRoot, ".env.example");
	const lines = fs.readFileSync(envExamplePath, "utf8").split(/\r?\n/);
	const envNameRegex = /^[A-Z][A-Z0-9_]*$/;

	for (const [index, line] of lines.entries()) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const key = trimmed.split("=")[0]?.trim();
		if (!key) continue;
		if (!envNameRegex.test(key)) {
			fail(`Invalid env var name "${key}" in .env.example:${index + 1}`);
		}
	}
}

function isValidRouteToken(token) {
	if (token === "$") return true;
	if (token.startsWith("$")) {
		return /^[a-z][a-zA-Z0-9]*$/.test(token.slice(1));
	}
	if (token.startsWith("_")) {
		return /^_{1,2}[a-z0-9-]+_?$/.test(token);
	}
	return /^[a-z0-9-]+_?$/.test(token);
}

function checkRouteFileNaming() {
	const routesDir = path.join(projectRoot, "src", "routes");
	const routeFiles = walkFiles(
		routesDir,
		(filePath) => filePath.endsWith(".tsx") || filePath.endsWith(".ts"),
	);

	for (const relativeFile of routeFiles) {
		const withoutPrefix = relativeFile.replace(/^src[\\/]+routes[\\/]+/, "");
		const directoryParts = withoutPrefix.split(path.sep);
		const fileName = directoryParts.pop();
		if (!fileName) continue;

		for (const dirPart of directoryParts) {
			if (!isValidRouteToken(dirPart)) {
				fail(`Invalid route directory name "${dirPart}" in ${relativeFile}`);
			}
		}

		const stem = fileName.replace(/\.(tsx|ts)$/, "");
		const tokens = stem.split(".");
		for (const token of tokens) {
			if (!isValidRouteToken(token)) {
				fail(`Invalid route file token "${token}" in ${relativeFile}`);
			}
		}
	}
}

function checkServerFileNaming() {
	const serverDir = path.join(projectRoot, "src", "server");
	const serverFiles = walkFiles(
		serverDir,
		(filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
	);
	const fileRegex = /^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.(ts|tsx)$/;

	for (const relativeFile of serverFiles) {
		const base = path.basename(relativeFile);
		if (!fileRegex.test(base)) {
			fail(`Invalid server filename "${base}" in ${relativeFile}`);
		}
	}
}

checkPackageScriptNames();
checkEnvVarNaming();
checkRouteFileNaming();
checkServerFileNaming();

if (errors.length > 0) {
	console.error("Naming checks failed:");
	for (const message of errors) {
		console.error(`- ${message}`);
	}
	process.exit(1);
}

console.log("Naming checks passed.");
