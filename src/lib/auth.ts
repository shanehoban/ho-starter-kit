import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { count, eq, or } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { DB_PROVIDER } from "@/lib/config";
import { sendUserRegisteredEmailToAdmins } from "@/server/email/notification-emailer";

const authProvider = DB_PROVIDER === "postgres" ? "pg" : "sqlite";

export const auth = betterAuth({
	database: drizzleAdapter(db as never, {
		provider: authProvider,
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "member",
				input: false,
			},
			approved: {
				type: "boolean",
				defaultValue: false,
				input: false,
			},
			phone: {
				type: "string",
				required: false,
				input: false,
			},
			mustChangePassword: {
				type: "boolean",
				defaultValue: false,
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const [result] = await db.select({ value: count() }).from(schema.users);
					if (result.value === 0) {
						return {
							data: {
								...user,
								role: "super-admin",
								approved: true,
							},
						};
					}

					return { data: user };
				},
				after: async (user) => {
					const admins = await db
						.select()
						.from(schema.users)
						.where(or(eq(schema.users.role, "admin"), eq(schema.users.role, "super-admin")));

					for (const admin of admins) {
						if (admin.id !== user.id) {
							await db.insert(schema.notifications).values({
								userId: admin.id,
								type: "user_registered",
								message: `New user registered: ${user.name} (${user.email})`,
							});
						}
					}

					if (admins.some((admin: { id: string }) => admin.id !== user.id)) {
						await sendUserRegisteredEmailToAdmins({
							userName: user.name,
							userEmail: user.email,
							userId: user.id,
						});
					}
				},
			},
		},
	},
	plugins: [tanstackStartCookies()],
});
