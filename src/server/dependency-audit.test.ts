import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let fixtureDir: string;
beforeEach(() => {
	fixtureDir = mkdtempSync(join(tmpdir(), "starter-audit-test-"));
});
afterEach(() => {
	rmSync(fixtureDir, { recursive: true, force: true });
});

function runAudit(report: unknown, prefix = "") {
	const filename = join(fixtureDir, "audit.json");
	writeFileSync(filename, prefix + JSON.stringify(report));
	const result = spawnSync(
		process.execPath,
		["scripts/enforce-audit.mjs", "--audit-file", filename],
		{
			encoding: "utf8",
			env: { ...process.env, GITHUB_STEP_SUMMARY: "" },
		},
	);
	expect(result.error).toBeUndefined();
	return result;
}

const report = (advisories = {}) => ({
	advisories,
	metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 } },
});

describe("dependency audit gate", () => {
	it("accepts a complete report with no vulnerabilities, even after a pnpm notice", () => {
		expect(runAudit(report(), "pnpm notice\n").status).toBe(0);
	});
	it("rejects registry errors instead of treating them as an empty audit", () => {
		const result = runAudit({
			error: { code: "ERR_PNPM_AUDIT_BAD_RESPONSE", message: "Registry unavailable" },
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("incomplete report");
	});
	it.each([{}, { advisories: {} }, { advisories: [], metadata: { vulnerabilities: {} } }])(
		"rejects incomplete audit data: %j",
		(input) => {
			expect(runAudit(input).status).toBe(1);
		},
	);
	it("blocks advisories at the existing moderate threshold and prints the fix", () => {
		const result = runAudit(
			report({
				test: {
					id: "test",
					severity: "moderate",
					module_name: "fixture-package",
					title: "Fixture advisory",
					url: "https://example.com/advisory",
					patched_versions: ">=2.0.0",
					findings: [],
				},
			}),
		);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("fixture-package");
		expect(result.stderr).toContain("Patched versions: >=2.0.0");
	});
	it("keeps low-severity advisories below the configured threshold", () => {
		expect(runAudit(report({ test: { severity: "low" } })).status).toBe(0);
	});
	it("rejects an unknown severity rather than silently skipping it", () => {
		expect(runAudit(report({ test: { severity: "unknown" } })).status).toBe(1);
	});
});
