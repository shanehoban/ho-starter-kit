import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL, DB_PATH, DB_PROVIDER } from "@/lib/config";
import * as schema from "./schema";

let database: ReturnType<typeof drizzleSqlite>;
let closeHandler: (() => Promise<void>) | null = null;

if (DB_PROVIDER === "postgres") {
	if (!DATABASE_URL) {
		throw new Error("DATABASE_URL is required when DB_PROVIDER=postgres");
	}
	const client = postgres(DATABASE_URL, {
		max: 10,
	});
	database = drizzlePostgres(client, { schema: schema as never }) as unknown as ReturnType<
		typeof drizzleSqlite
	>;
	closeHandler = async () => {
		await client.end();
	};
} else {
	const sqlite = new Database(DB_PATH);
	sqlite.pragma("journal_mode = WAL");
	sqlite.pragma("foreign_keys = ON");
	database = drizzleSqlite(sqlite, { schema: schema as never });
}

export const db = database;

export async function closeDb(): Promise<void> {
	if (closeHandler) {
		await closeHandler();
	}
}
