import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.{test,spec}.{ts,tsx,js}"],
		exclude: ["node_modules", "dist", ".output"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary", "html"],
			include: [
				"src/server/app-url.ts",
				"src/server/auth-guards.ts",
				"src/server/origin-guard.ts",
				"src/server/password-reset-policy.ts",
				"src/server/request-identity.ts",
				"src/server/validators.ts",
				"src/server/email/providers/null-provider.ts",
				"src/lib/utils.ts",
			],
			exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.spec.tsx"],
			thresholds: {
				lines: 85,
				functions: 70,
				statements: 85,
				branches: 75,
			},
		},
	},
});
