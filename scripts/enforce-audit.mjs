#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const severityRank = {
	info: 0,
	low: 1,
	moderate: 2,
	high: 3,
	critical: 4,
};

const projectRoot = process.cwd();
const allowlistPath = path.join(projectRoot, "security", "audit-allowlist.json");
const defaultThreshold = "moderate";
const args = process.argv.slice(2);
const auditFileArgIndex = args.indexOf("--audit-file");
const auditFilePath =
	auditFileArgIndex >= 0 && typeof args[auditFileArgIndex + 1] === "string"
		? args[auditFileArgIndex + 1]
		: null;

function parseAuditJson(auditText) {
	const combined = auditText ?? "";
	const firstBrace = combined.indexOf("{");
	const lastBrace = combined.lastIndexOf("}");
	if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
		console.error("Unable to parse pnpm audit output as JSON.");
		console.error(combined.trim());
		process.exit(1);
	}

	const raw = combined.slice(firstBrace, lastBrace + 1);
	try {
		return JSON.parse(raw);
	} catch (error) {
		console.error("Failed to decode pnpm audit JSON output.");
		console.error(error);
		console.error(raw);
		process.exit(1);
	}
}

function runAuditJson() {
	if (!auditFilePath) {
		console.error("Missing --audit-file argument.");
		process.exit(1);
	}
	if (!fs.existsSync(auditFilePath)) {
		console.error(`Audit file not found: ${auditFilePath}`);
		process.exit(1);
	}

	return parseAuditJson(fs.readFileSync(auditFilePath, "utf8"));
}

function loadPolicy() {
	if (!fs.existsSync(allowlistPath)) {
		return { severityThreshold: defaultThreshold, allowlist: [] };
	}
	const parsed = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
	return {
		severityThreshold: parsed.severityThreshold ?? defaultThreshold,
		allowlist: Array.isArray(parsed.allowlist) ? parsed.allowlist : [],
	};
}

function isAllowlisted(advisory, policyEntry) {
	const normalizeAuditPath = (input) => {
		return String(input)
			.split(">")
			.map((part) => {
				const compact = part.replace(/\s+/g, "");
				const lastAt = compact.lastIndexOf("@");
				if (lastAt > 0) {
					return compact.slice(0, lastAt);
				}
				return compact;
			})
			.join(">");
	};

	if (String(policyEntry.id) !== String(advisory.id)) return false;
	if (policyEntry.module && policyEntry.module !== advisory.module_name) return false;

	if (policyEntry.pathsContain && Array.isArray(policyEntry.pathsContain) && policyEntry.pathsContain.length > 0) {
		const advisoryPaths = advisory.findings
			.flatMap((finding) => finding.paths ?? [])
			.map((item) => normalizeAuditPath(item));
		for (const requiredPathFragment of policyEntry.pathsContain) {
			const normalizedRequiredFragment = normalizeAuditPath(requiredPathFragment);
			if (!advisoryPaths.some((auditPath) => auditPath.includes(normalizedRequiredFragment))) {
				return false;
			}
		}
	}

	if (policyEntry.expiresOn) {
		const expiry = new Date(`${policyEntry.expiresOn}T23:59:59Z`);
		if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
			return false;
		}
	}

	return true;
}

const audit = runAuditJson();
const policy = loadPolicy();
const threshold = policy.severityThreshold;

if (!(threshold in severityRank)) {
	console.error(`Invalid severityThreshold "${threshold}" in ${allowlistPath}`);
	process.exit(1);
}

const advisories = Object.values(audit.advisories ?? {});
const failing = [];

for (const advisory of advisories) {
	const advisorySeverity = advisory.severity ?? "info";
	if (!(advisorySeverity in severityRank)) continue;
	if (severityRank[advisorySeverity] < severityRank[threshold]) continue;

	const matchedAllowlist = policy.allowlist.find((entry) => isAllowlisted(advisory, entry));
	if (matchedAllowlist) continue;

	failing.push({
		id: advisory.id,
		severity: advisorySeverity,
		module: advisory.module_name,
		title: advisory.title,
		url: advisory.url,
	});
}

if (failing.length > 0) {
	console.error(
		`Audit enforcement failed. ${failing.length} advisory/advisories at severity >= ${threshold} are not allowlisted:`,
	);
	for (const item of failing) {
		console.error(`- [${item.severity}] ${item.module} (${item.id}): ${item.title}`);
		console.error(`  ${item.url}`);
	}
	process.exit(1);
}

console.log(`Audit enforcement passed. Threshold=${threshold}.`);
