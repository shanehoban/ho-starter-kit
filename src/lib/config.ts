import path from "node:path";

export type DbProvider = "sqlite" | "postgres";

const rawProvider = process.env.DB_PROVIDER?.trim().toLowerCase();

export const DB_PROVIDER: DbProvider = rawProvider === "postgres" ? "postgres" : "sqlite";
export const DB_PATH = process.env.DB_PATH || "./sqlite.db";
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET?.trim() || "";

if (DB_PROVIDER === "postgres" && !DATABASE_URL && process.env.NODE_ENV === "production") {
	throw new Error("DATABASE_URL must be configured when DB_PROVIDER=postgres");
}

if (process.env.NODE_ENV === "production") {
	if (!BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32) {
		throw new Error(
			"BETTER_AUTH_SECRET must be configured with at least 32 characters in production.",
		);
	}
}

export const UPLOAD_DIR =
	process.env.UPLOAD_DIR ||
	(process.env.DB_PATH ? path.join(path.dirname(process.env.DB_PATH), "uploads") : "./uploads");
