import path from "node:path";

export type DbProvider = "sqlite" | "postgres";

const rawProvider = process.env.DB_PROVIDER?.trim().toLowerCase();

export const DB_PROVIDER: DbProvider = rawProvider === "postgres" ? "postgres" : "sqlite";
export const DB_PATH = process.env.DB_PATH || "./sqlite.db";
export const DATABASE_URL = process.env.DATABASE_URL || "";

if (DB_PROVIDER === "postgres" && !DATABASE_URL && process.env.NODE_ENV === "production") {
	throw new Error("DATABASE_URL must be configured when DB_PROVIDER=postgres");
}

export const UPLOAD_DIR =
	process.env.UPLOAD_DIR ||
	(process.env.DB_PATH ? path.join(path.dirname(process.env.DB_PATH), "uploads") : "./uploads");
