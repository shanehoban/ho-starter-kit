import { DB_PROVIDER } from "@/lib/config";
import * as postgresSchema from "./schema/postgres";
import * as sqliteSchema from "./schema/sqlite";

const selected = (
	DB_PROVIDER === "postgres" ? postgresSchema : sqliteSchema
) as typeof sqliteSchema;

export const users = selected.users;
export const sessions = selected.sessions;
export const accounts = selected.accounts;
export const verifications = selected.verifications;
export const notifications = selected.notifications;
export const emailLogs = selected.emailLogs;
export const publicRateLimits = selected.publicRateLimits;
