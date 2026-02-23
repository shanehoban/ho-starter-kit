import { defineConfig } from "drizzle-kit";

const provider = process.env.DB_PROVIDER === "postgres" ? "postgres" : "sqlite";

const config =
	provider === "postgres"
		? defineConfig({
				dialect: "postgresql",
				schema: "./src/db/schema.ts",
				out: "./drizzle/postgres",
				dbCredentials: {
					url: process.env.DATABASE_URL || "",
				},
			})
		: defineConfig({
				dialect: "sqlite",
				schema: "./src/db/schema.ts",
				out: "./drizzle/sqlite",
				dbCredentials: {
					url: process.env.DB_PATH || "./sqlite.db",
				},
			});

export default config;
