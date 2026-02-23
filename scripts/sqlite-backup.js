#!/usr/bin/env node

import Database from "better-sqlite3";

const sourcePath = process.argv[2];
const destinationPath = process.argv[3];

if (!sourcePath || !destinationPath) {
	console.error("Usage: node scripts/sqlite-backup.js <source.db> <destination.db>");
	process.exit(1);
}

const db = new Database(sourcePath, { fileMustExist: true });

try {
	// Ensure pending WAL pages are included before backing up.
	db.pragma("wal_checkpoint(PASSIVE)");
	await db.backup(destinationPath);
} finally {
	db.close();
}
