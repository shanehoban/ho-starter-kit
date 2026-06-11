import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { emailLogs, users } from "@/db/schema";
import { getAuthUser, requireAdmin, requireSuperAdmin } from "@/server/auth-utils";
import { getEmailService } from "@/server/email/provider-factory";
import { TemplateRenderer } from "@/server/email/template-renderer";
import { assertSameOriginRequest } from "@/server/request-security";

const emailTypeSchema = z.enum(["user_registered", "user_approved", "password_reset"]);
const emailStatusSchema = z.enum(["pending", "sent", "delivered", "bounced", "failed"]);

const getEmailLogsInputSchema = z.object({
	type: emailTypeSchema.optional(),
	status: emailStatusSchema.optional(),
	userId: z.string().trim().min(1).optional(),
	limit: z.number().int().positive().max(1000).optional(),
});

const retryFailedEmailLogInputSchema = z.object({
	logId: z.number().int().positive(),
});

export function parseEmailLogTemplateData(value: string | null): Record<string, unknown> {
	if (!value) return {};
	try {
		const parsed = JSON.parse(value);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
	} catch {
		// Invalid historical template data should not prevent retrying the original email shell.
	}
	return {};
}

export const getEmailLogs = createServerFn({ method: "GET" })
	.validator((data) => getEmailLogsInputSchema.parse(data ?? {}))
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

export const retryFailedEmailLog = createServerFn({ method: "POST" })
	.validator((data) => retryFailedEmailLogInputSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const user = await getAuthUser();
		requireSuperAdmin(user);

		const [log] = await db.select().from(emailLogs).where(eq(emailLogs.id, data.logId));
		if (!log) {
			throw new Error("Email log not found");
		}
		if (log.status !== "failed") {
			throw new Error("Only failed emails can be retried");
		}

		const type = emailTypeSchema.parse(log.type);
		const templateData = parseEmailLogTemplateData(log.templateData);
		const { html, text } = await TemplateRenderer.render(type, templateData);
		const result = await getEmailService().sendEmail({
			userId: log.userId ?? undefined,
			to: log.to,
			subject: log.subject,
			html,
			text,
			type,
			templateData,
		});

		return {
			success: result.success,
			error: result.error ?? null,
		};
	});
