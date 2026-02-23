import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { emailLogs, users } from "@/db/schema";
import { getAuthUser, requireAdmin } from "@/server/auth-utils";

const emailTypeSchema = z.enum(["user_registered", "user_approved", "password_reset"]);
const emailStatusSchema = z.enum(["pending", "sent", "delivered", "bounced", "failed"]);

const getEmailLogsInputSchema = z.object({
	type: emailTypeSchema.optional(),
	status: emailStatusSchema.optional(),
	userId: z.string().trim().min(1).optional(),
	limit: z.number().int().positive().max(1000).optional(),
});

export const getEmailLogs = createServerFn({ method: "GET" })
	.inputValidator((data) => getEmailLogsInputSchema.parse(data ?? {}))
	.handler(async ({ data }) => {
		const user = await getAuthUser();
		requireAdmin(user);

		const conditions = [];
		if (data.type) conditions.push(eq(emailLogs.type, data.type));
		if (data.status) conditions.push(eq(emailLogs.status, data.status));
		if (data.userId) conditions.push(eq(emailLogs.userId, data.userId));

		const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
		return db
			.select({
				id: emailLogs.id,
				userId: emailLogs.userId,
				userName: users.name,
				to: emailLogs.to,
				subject: emailLogs.subject,
				type: emailLogs.type,
				provider: emailLogs.provider,
				providerId: emailLogs.providerId,
				status: emailLogs.status,
				error: emailLogs.error,
				sentAt: emailLogs.sentAt,
				createdAt: emailLogs.createdAt,
			})
			.from(emailLogs)
			.leftJoin(users, eq(emailLogs.userId, users.id))
			.where(whereCondition)
			.orderBy(desc(emailLogs.createdAt))
			.limit(data.limit ?? 500);
	});
