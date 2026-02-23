import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs, users } from "@/db/schema";
import type { EmailLogType, IEmailProvider } from "./types";

export class EmailService {
	constructor(private provider: IEmailProvider) {}

	async sendEmail(params: {
		userId?: string;
		to: string;
		subject: string;
		html: string;
		text?: string;
		type: EmailLogType;
		templateData?: Record<string, unknown>;
	}) {
		const serializedTemplateData = params.templateData ? JSON.stringify(params.templateData) : null;

		const [logEntry] = await db
			.insert(emailLogs)
			.values({
				userId: params.userId || null,
				to: params.to,
				subject: params.subject,
				type: params.type,
				templateData: serializedTemplateData,
				provider: this.provider.name,
				status: "pending",
			})
			.returning();

		try {
			const result = await this.provider.send({
				to: params.to,
				subject: params.subject,
				html: params.html,
				text: params.text,
			});

			await db
				.update(emailLogs)
				.set({
					status: result.success ? "sent" : "failed",
					providerId: result.id || null,
					error: result.error || null,
					sentAt: result.success ? new Date() : null,
				})
				.where(eq(emailLogs.id, logEntry.id));

			return { success: result.success, error: result.error };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			await db
				.update(emailLogs)
				.set({
					status: "failed",
					error: errorMessage,
				})
				.where(eq(emailLogs.id, logEntry.id));

			return { success: false, error: errorMessage };
		}
	}

	async sendToUser(params: {
		userId: string;
		subject: string;
		html: string;
		text?: string;
		type: EmailLogType;
		templateData?: Record<string, unknown>;
	}) {
		const [user] = await db
			.select({ email: users.email })
			.from(users)
			.where(eq(users.id, params.userId));
		if (!user) {
			throw new Error("User not found");
		}

		return this.sendEmail({
			...params,
			to: user.email,
		});
	}
}
