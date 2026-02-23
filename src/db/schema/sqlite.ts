import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	role: text("role", { enum: ["super-admin", "admin", "member"] })
		.notNull()
		.default("member"),
	approved: integer("approved", { mode: "boolean" }).notNull().default(false),
	phone: text("phone"),
	mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedBy: text("updated_by"),
});

export const sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const notifications = sqliteTable("notifications", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: text("type", { enum: ["user_registered", "user_approved"] }).notNull(),
	message: text("message").notNull(),
	read: integer("read", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const emailLogs = sqliteTable("email_logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
	to: text("to").notNull(),
	subject: text("subject").notNull(),
	type: text("type", { enum: ["user_registered", "user_approved", "password_reset"] }).notNull(),
	templateData: text("template_data"),
	provider: text("provider").notNull().default("resend"),
	providerId: text("provider_id"),
	status: text("status", { enum: ["pending", "sent", "delivered", "bounced", "failed"] })
		.notNull()
		.default("pending"),
	error: text("error"),
	sentAt: integer("sent_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const publicRateLimits = sqliteTable("public_rate_limits", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	identifier: text("identifier").notNull(),
	endpoint: text("endpoint").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});
