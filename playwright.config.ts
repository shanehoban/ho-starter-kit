import { defineConfig, devices } from "@playwright/test";

const host = process.env.E2E_HOST ?? "127.0.0.1";
const port = Number(process.env.E2E_PORT ?? "3000");
const baseURL = process.env.E2E_BASE_URL ?? `http://${host}:${port}`;
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results/playwright";
const jsonReportPath = process.env.PLAYWRIGHT_JSON_REPORT ?? "test-results/playwright/report.json";

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["json", { outputFile: jsonReportPath }]],
	outputDir,
	use: {
		baseURL,
		trace: "retain-on-failure",
		video: "off",
	},
	webServer: {
		command: process.env.E2E_WEB_SERVER_COMMAND ?? `pnpm dev -- --host ${host} --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI && process.env.PLAYWRIGHT_REUSE_SERVER === "1",
		timeout: 120_000,
		env: {
			...process.env,
			NODE_ENV: "test",
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});

